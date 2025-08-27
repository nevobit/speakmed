import { RouteOptions } from 'fastify';
import { ReportSchemaMongo } from '@repo/entities/src/models/report-mongo';
import { TemplateSchemaMongo } from '@repo/entities/src/models/template-mongo';
import mongoose from 'mongoose';
import Handlebars from 'handlebars';
import { createReport, getAllReports, getReportById, getTemplateById, extractMedicationsFromAudio } from '@repo/business-logic';
import axios from 'axios';
import { cleanHtmlContent } from '../utils/htmlCleaner';
import { safeJsonParse } from '../utils/jsonCleaner';
import { readFileSync } from 'node:fs';
import { join } from 'node:path';

const Report = mongoose.model('Report', ReportSchemaMongo);
const OPENAI_API_KEY = process.env.OPENAI_API_KEY;

// Cargar las bases de datos del Vademecum
const chileList: string[] = JSON.parse(
    readFileSync(join(__dirname, '../../data/vademecum_cl.json'), 'utf8'),
);

const colList: string[] = JSON.parse(
    readFileSync(join(__dirname, '../../data/vademecum_co.json'), 'utf8'),
);

const argList: string[] = JSON.parse(
    readFileSync(join(__dirname, '../../data/vademecum_ar.json'), 'utf8'),
);

const vademecumData: Record<string, string[]> = {
    ARG: argList,
    MEX: colList,
    COL: colList,
    CHL: chileList,
};

// Función para normalizar texto (eliminar acentos, convertir a minúsculas, etc.)
function normalizeText(text: string): string {
    return text
        .toLowerCase()
        .normalize('NFD')
        .replace(/[\u0300-\u036f]/g, '') // Eliminar acentos
        .replace(/[^a-z0-9\s]/g, ' ') // Solo letras, números y espacios
        .replace(/\s+/g, ' ') // Múltiples espacios a uno solo
        .trim();
}

// Función para extraer posibles nombres de medicamentos del texto
function extractMedicationNames(text: string): string[] {
    const normalizedText = normalizeText(text);
    const words = normalizedText.split(/\s+/);
    const medications: string[] = [];

    // Buscar palabras que podrían ser medicamentos (3-15 caracteres, sin números al inicio)
    for (let i = 0; i < words.length; i++) {
        const word = words[i];
        if (word && word.length >= 3 && word.length <= 15 && !/^\d/.test(word)) {
            medications.push(word);
        }

        // Buscar combinaciones de 2-3 palabras
        if (i < words.length - 1) {
            const twoWords = `${word} ${words[i + 1]}`;
            if (twoWords.length >= 4 && twoWords.length <= 20) {
                medications.push(twoWords);
            }
        }

        if (i < words.length - 2) {
            const threeWords = `${word} ${words[i + 1]} ${words[i + 2]}`;
            if (threeWords.length >= 6 && threeWords.length <= 25) {
                medications.push(threeWords);
            }
        }
    }

    return [...new Set(medications)]; // Eliminar duplicados
}

// Función para calcular similitud entre dos strings
function calculateSimilarity(str1: string, str2: string): number {
    const normalized1 = normalizeText(str1);
    const normalized2 = normalizeText(str2);

    if (normalized1 === normalized2) return 1.0;

    // Algoritmo de similitud de Jaro-Winkler simplificado
    const maxLength = Math.max(normalized1.length, normalized2.length);
    const minLength = Math.min(normalized1.length, normalized2.length);

    if (minLength === 0) return 0.0;

    let matches = 0;
    let transpositions = 0;
    const matchWindow = Math.floor(maxLength / 2) - 1;

    for (let i = 0; i < normalized1.length; i++) {
        const start = Math.max(0, i - matchWindow);
        const end = Math.min(normalized2.length, i + matchWindow + 1);

        for (let j = start; j < end; j++) {
            if (normalized1[i] === normalized2[j]) {
                matches++;
                if (i !== j) transpositions++;
                break;
            }
        }
    }

    if (matches === 0) return 0.0;

    const similarity = (matches / normalized1.length + matches / normalized2.length + (matches - transpositions / 2) / matches) / 3;
    return Math.min(1.0, similarity);
}

// Función para validar medicamentos contra el Vademecum
function validateMedications(text: string, country: string = 'CHL'): {
    found: Array<{ name: string; similarity: number; original: string }>;
    notFound: string[];
    suggestions: Array<{ original: string; suggestions: string[] }>;
} {
    const medications = extractMedicationNames(text);
    const vademecum = vademecumData[country] || vademecumData['CHL'] || [];

    const found: Array<{ name: string; similarity: number; original: string }> = [];
    const notFound: string[] = [];
    const suggestions: Array<{ original: string; suggestions: string[] }> = [];

    for (const medication of medications) {
        let bestMatch: { name: string; similarity: number } | null = null;
        const localSuggestions: string[] = [];

        for (const vademecumItem of vademecum) {
            const similarity = calculateSimilarity(medication, vademecumItem);

            if (similarity > 0.8) {
                if (!bestMatch || similarity > bestMatch.similarity) {
                    bestMatch = { name: vademecumItem, similarity };
                }
            } else if (similarity > 0.6) {
                localSuggestions.push(vademecumItem);
            }
        }

        if (bestMatch) {
            found.push({
                name: bestMatch.name,
                similarity: bestMatch.similarity,
                original: medication
            });
        } else {
            notFound.push(medication);
            if (localSuggestions.length > 0) {
                suggestions.push({
                    original: medication,
                    suggestions: localSuggestions.slice(0, 5) // Máximo 5 sugerencias
                });
            }
        }
    }

    return { found, notFound, suggestions };
}

// Función para extraer medicamentos del contenido del informe
async function extractMedicationsFromReport(reportContent: string): Promise<any[]> {
    // Primero intentar extraer medicamentos usando la validación existente
    // const medicationValidation = validateMedications(reportContent, 'CHL');

    // // Convertir los medicamentos encontrados al formato de la receta
    // const medications = medicationValidation.found.map((med, index) => {
    //     // Buscar información adicional del medicamento en el contenido
    //     const medicationInfo = extractMedicationDetails(reportContent, med.name);

    //     return {
    //         name: med.name,
    //         dosage: medicationInfo.dosage || '',
    //         form: medicationInfo.form || 'comprimido',
    //         manufacturer: medicationInfo.manufacturer || '',
    //         type: medicationInfo.type || 'Permanente',
    //         composition: medicationInfo.composition || med.name,
    //         instructions: medicationInfo.instructions || 'Según indicación médica',
    //         startDate: new Date().toLocaleDateString('es-CL'),
    //         additionalNotes: medicationInfo.additionalNotes || ''
    //     };
    // });

    // Si no se encontraron medicamentos, intentar extraer usando IA
        try {
            const aiMedications = await extractMedicationsWithAI(reportContent);
            if (aiMedications.length > 0) {
                return aiMedications;
            } else {
                return [];
            }
        } catch (error) {
            console.error('Error extracting medications with AI:', error);
            return [];
        }

    // // Si aún no hay medicamentos, intentar extraer del texto usando patrones
    // if (medications.length === 0) {
    //     // Extraer medicamentos del texto usando patrones comunes
    //     const medicationPatterns = [
    //         /(?:recetar|prescribir|indicar|dar)\s+([a-zA-ZáéíóúñÁÉÍÓÚÑ\s]+?)(?:\s+\d+|\s+mg|\s+ml|\s+comprimido|\.|,|$)/gi,
    //         /([a-zA-ZáéíóúñÁÉÍÓÚÑ\s]+?)\s+(?:mg|ml|comprimido|tableta|cápsula)/gi,
    //         /(?:medicamento|fármaco|droga)\s+([a-zA-ZáéíóúñÁÉÍÓÚÑ\s]+?)(?:\s+\d+|\s+mg|\s+ml|\.|,|$)/gi
    //     ];

    //     const extractedNames = new Set<string>();

    //     medicationPatterns.forEach(pattern => {
    //         const matches = reportContent.match(pattern);
    //         if (matches) {
    //             matches.forEach(match => {
    //                 const name = match.replace(/(?:recetar|prescribir|indicar|dar|medicamento|fármaco|droga)\s+/gi, '').trim();
    //                 if (name.length > 2 && name.length < 50) {
    //                     extractedNames.add(name);
    //                 }
    //             });
    //         }
    //     });

    // extractedNames.forEach(name => {
    //     const medicationInfo = extractMedicationDetails(reportContent, name);
    //     medications.push({
    //         name: name,
    //         dosage: medicationInfo.dosage || '',
    //         form: medicationInfo.form || 'comprimido',
    //         manufacturer: medicationInfo.manufacturer || '',
    //         type: medicationInfo.type || 'Permanente',
    //         composition: medicationInfo.composition || name,
    //         instructions: medicationInfo.instructions || 'Según indicación médica',
    //         startDate: new Date().toLocaleDateString('es-CL'),
    //         additionalNotes: medicationInfo.additionalNotes || ''
    //     });
    // });
    // }

    // return medications;
}

// Función para extraer medicamentos usando IA
async function extractMedicationsWithAI(reportContent: string): Promise<any[]> {
    if (!OPENAI_API_KEY) {
        return [];
    }

    const prompt = `Eres un asistente médico experto. Analiza el siguiente informe médico y extrae todos los medicamentos mencionados con sus detalles, en caso de no tener detalles agregalos tu.
ejemplo si dicen salbutamol, agregar el nombre del medicamento, la dosis, la forma farmacéutica, el fabricante, el tipo de tratamiento, la composición y las instrucciones de uso.

Informe médico:
${reportContent}

Extrae los medicamentos y devuelve el resultado en formato JSON con la siguiente estructura:
[
  {
    "name": "Nombre del medicamento",
    "dosage": "Dosis (ej: 500mg, 10ml)",
    "form": "Forma farmacéutica (comprimido, jarabe, etc.)",
    "manufacturer": "Fabricante si se menciona",
    "type": "Tipo de tratamiento (Permanente, Temporal)",
    "composition": "Composición del medicamento",
    "instructions": "Instrucciones de uso",
    "additionalNotes": "Notas adicionales"
  }
]

Si no hay medicamentos mencionados, devuelve un array vacío [].

IMPORTANTE: DEVUELVE SOLO JSON PURO, sin markdown, sin backticks, sin explicaciones adicionales. El JSON debe ser parseable directamente con JSON.parse().`;

    try {
        const response = await axios.post(
            'https://api.openai.com/v1/chat/completions',
            {
                model: 'gpt-3.5-turbo',
                messages: [
                    {
                        role: 'system',
                        content: 'Eres un asistente médico experto especializado en extraer información de medicamentos de informes médicos.'
                    },
                    {
                        role: 'user',
                        content: prompt
                    }
                ],
                max_tokens: 1000,
                temperature: 0.1
            },
            {
                headers: {
                    'Authorization': `Bearer ${OPENAI_API_KEY}`,
                    'Content-Type': 'application/json'
                },
                timeout: 30000
            }
        );

        const content = response.data.choices[0].message.content;

        // Usar la función utilitaria para parsear JSON de manera segura
        const medications = safeJsonParse<any[]>(content);
        if (medications && Array.isArray(medications)) {
            return medications.map(med => ({
                ...med,
                startDate: new Date().toLocaleDateString('es-CL')
            }));
        }

        return [];
    } catch (error) {
        console.error('Error calling OpenAI API for medication extraction:', error);
        return [];
    }
}

// Función para extraer detalles específicos de un medicamento del contenido
function extractMedicationDetails(content: string, medicationName: string): {
    dosage: string;
    form: string;
    manufacturer: string;
    type: string;
    composition: string;
    instructions: string;
    additionalNotes: string;
} {
    const details = {
        dosage: '',
        form: 'comprimido',
        manufacturer: '',
        type: 'Permanente',
        composition: medicationName,
        instructions: 'Según indicación médica',
        additionalNotes: ''
    };

    // Buscar dosis
    const dosagePatterns = [
        new RegExp(`${medicationName.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')}\\s*(\\d+(?:\\.\\d+)?)\\s*(mg|ml|g)`, 'gi'),
        new RegExp(`(\\d+(?:\\.\\d+)?)\\s*(mg|ml|g)\\s*${medicationName.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')}`, 'gi')
    ];

    dosagePatterns.forEach(pattern => {
        const match = content.match(pattern);
        if (match) {
            details.dosage = `${match[1]} ${match[2]}`;
        }
    });

    // Buscar forma farmacéutica
    const formPatterns = [
        /(comprimido|tableta|cápsula|jarabe|inyección|crema|pomada|gotas|supositorio)/gi
    ];

    formPatterns.forEach(pattern => {
        const match = content.match(pattern);
        if (match) {
            details.form = match[1]?.toLowerCase() || '';
        }
    });

    // Buscar instrucciones
    const instructionPatterns = [
        /(?:cada|por)\s*(\d+)\s*(?:horas?|días?|semanas?)/gi,
        /(\d+)\s*(?:vez|veces)\s*(?:al\s*día|diario)/gi,
        /(?:tomar|administrar|aplicar)\s*([^.]+?)(?:\.|$)/gi
    ];

    instructionPatterns.forEach(pattern => {
        const match = content.match(pattern);
        if (match) {
            details.instructions = match[0].trim();
        }
    });

    // Buscar fabricante
    const manufacturerPatterns = [
        /(?:fabricante|laboratorio|marca)\s*:?\s*([a-zA-ZáéíóúñÁÉÍÓÚÑ\s]+?)(?:\.|,|$)/gi
    ];

    manufacturerPatterns.forEach(pattern => {
        const match = content.match(pattern);
        if (match) {
            details.manufacturer = match[1]?.trim() || '';
        }
    });

    return details;
}

// Function to enhance medical content using ChatGPT
async function enhanceMedicalContent(rawContent: string): Promise<string> {
    if (!OPENAI_API_KEY) {
        console.warn('OpenAI API key not configured, returning raw content');
        return rawContent;
    }

    const medicalPrompt = `Eres un asistente médico experto. Analiza el siguiente contenido de una consulta médica y genera un informe médico detallado, bien estructurado y profesional. 

El informe debe incluir:
1. Resumen ejecutivo de la consulta
2. Motivo de consulta
3. Antecedentes relevantes
4. Exploración física (si aplica)
5. Diagnóstico/Impresión diagnóstica
6. Plan de tratamiento/Recomendaciones
7. Observaciones adicionales

IMPORTANTE:
- Formatea el resultado en HTML con etiquetas apropiadas para una presentación profesional
- Usa un lenguaje médico apropiado pero comprensible
- Asegúrate de que haya espacios adecuados entre palabras y elementos
- Usa etiquetas HTML como <h2>, <h3>, <p>, <ul>, <li> para estructurar el contenido
- Evita concatenar palabras sin espacios
- Cada sección debe estar claramente separada

Contenido de la consulta:
${rawContent}

Genera un informe médico completo y detallado:`;

    try {
        const response = await axios.post(
            'https://api.openai.com/v1/chat/completions',
            {
                model: 'gpt-3.5-turbo',
                messages: [
                    {
                        role: 'system',
                        content: 'Eres un asistente médico experto especializado en generar informes médicos detallados y profesionales.'
                    },
                    {
                        role: 'user',
                        content: medicalPrompt
                    }
                ],
                max_tokens: 2000,
                temperature: 0.3
            },
            {
                headers: {
                    'Authorization': `Bearer ${OPENAI_API_KEY}`,
                    'Content-Type': 'application/json'
                },
                timeout: 30000
            }
        );

        const content = response.data.choices[0].message.content;

        // Limpiar y procesar el HTML para asegurar espacios correctos
        const cleanedContent = cleanHtmlContent(content);

        return cleanedContent;
    } catch (error: any) {
        console.error('Error calling OpenAI API:', error);

        return `
            <div class="medical-report">
                <h2>Informe Médico</h2>
                <div class="content">
                    <h3>Resumen de la Consulta</h3>
                    <p>${rawContent}</p>
                </div>
            </div>
        `;
    }
}



// Function to generate medical summary using ChatGPT
async function generateMedicalSummary(enhancedContent: string): Promise<string> {
    if (!OPENAI_API_KEY) {
        console.warn('OpenAI API key not configured, returning basic summary');
        return enhancedContent.slice(0, 200) + (enhancedContent.length > 200 ? '...' : '');
    }

    const summaryPrompt = `Eres un asistente médico experto. Genera un resumen ejecutivo conciso y profesional del siguiente informe médico.

El resumen debe incluir:
- Motivo principal de la consulta
- Diagnóstico principal
- Recomendaciones más importantes
- Duración máxima de 150 palabras

IMPORTANTE: Devuelve SOLO el texto del resumen, sin formato HTML, sin etiquetas, sin viñetas. Solo texto plano y legible.

Informe médico:
${enhancedContent}

Resumen ejecutivo:`;

    try {
        const response = await axios.post(
            'https://api.openai.com/v1/chat/completions',
            {
                model: 'gpt-3.5-turbo',
                messages: [
                    {
                        role: 'system',
                        content: 'Eres un asistente médico experto especializado en generar resúmenes ejecutivos concisos y profesionales.'
                    },
                    {
                        role: 'user',
                        content: summaryPrompt
                    }
                ],
                max_tokens: 300,
                temperature: 0.2
            },
            {
                headers: {
                    'Authorization': `Bearer ${OPENAI_API_KEY}`,
                    'Content-Type': 'application/json'
                },
                timeout: 30000
            }
        );

        const summary = response.data.choices[0].message.content.trim();

        // Limpiar y procesar el resumen para asegurar espacios correctos
        const cleanedSummary = cleanHtmlContent(summary);

        return cleanedSummary;
    } catch (error: any) {
        console.error('Error calling OpenAI API for summary:', error);

        // Return basic summary if API fails
        return enhancedContent.slice(0, 200) + (enhancedContent.length > 200 ? '...' : '');
    }
}

export const getReportsRoute: RouteOptions = {
    method: 'GET',
    url: '/api/reports',
    handler: async (request, reply) => {
        // const userId = request.headers['x-user-id'] as string;
        const reports = await getAllReports();
        return reports;
    },
};

export const getReportDetailRoute: RouteOptions = {
    method: 'GET',
    url: '/api/reports/:id',
    handler: async (request, reply) => {
        const { id } = request.params as any;
        const report = await getReportById(id)
        return report;
    },
};

export const createReportRoute: RouteOptions = {
    method: 'POST',
    url: '/api/reports',
    handler: async (request, reply) => {
        const userId = request.headers['x-user-id'] as string;
        const { templateId, content, date, duration } = request.body as any;

        console.log(templateId)
        // 1. Buscar la plantilla
        const template = await getTemplateById(templateId);
        // const template = await Template.findOne({ _id: templateId, userId });
        if (!template) {
            return reply.code(404).send({ error: 'Plantilla no encontrada' });
        }

        // 2. Mejorar el contenido usando ChatGPT
        const enhancedContent = await enhanceMedicalContent(content);

        // 3. Generar resumen usando ChatGPT
        const summary = await generateMedicalSummary(enhancedContent);

        let templateSource = '<div>{{content}}</div>';
        if (Array.isArray(template.fields) && typeof template.fields[0] === 'string') {
            templateSource = template.fields[0];
        }
        const compiled = Handlebars.compile(templateSource);
        const reportHtml = compiled({ content: enhancedContent });

        const report = await createReport(templateId, enhancedContent, date, duration, summary);

        return {
            content: enhancedContent,
            summary,
            id: report.id,
        };
    },
};

export const updateReportRoute: RouteOptions = {
    method: 'PUT',
    url: '/api/reports/:id',
    handler: async (request, reply) => {
        const { id } = request.params as any;
        const { content, duration, summary } = request.body as any;
        const report = await Report.findByIdAndUpdate(id, { content, duration, summary }, { new: true });
        return report;
    },
};

export const deleteReportRoute: RouteOptions = {
    method: 'DELETE',
    url: '/api/reports/:id',
    handler: async (request, reply) => {
        const { id } = request.params as any;
        await Report.findByIdAndDelete(id);
        return { success: true };
    },
};

// Función para generar PDF de receta médica
export const downloadRecetaRoute: RouteOptions = {
    method: 'POST',
    url: '/api/reports/:id/receta',
    handler: async (request, reply) => {
        const { id } = request.params as any;
        const medicalData = request.body as any;

        try {
            const report = await getReportById(id);
            if (!report) {
                return reply.code(404).send({ error: 'Reporte no encontrado' });
            }

            // Usar datos médicos personalizados o valores por defecto
            const data = {
                clinicName: medicalData?.clinicName || 'Clínica Alemana',
                doctorName: medicalData?.doctorName || 'Dr. Juan Pérez',
                doctorRut: medicalData?.doctorRut || '12.345.678-9',
                doctorSpecialty: medicalData?.doctorSpecialty || 'Medicina General',
                doctorLocation: medicalData?.doctorLocation || 'CONSULTORIO',
                patientName: medicalData?.patientName || 'María González',
                patientGender: medicalData?.patientGender || 'FEMENINO',
                patientRut: medicalData?.patientRut || '98.765.432-1',
                patientBirthDate: medicalData?.patientBirthDate || '01/01/1980 (43a)',
                doctorSignature: medicalData?.doctorSignature || null
            };

            // Extraer medicamentos del contenido del informe
            let medications = [];

            // Si no se proporcionaron medicamentos específicos, extraerlos del informe
            if (medications.length === 0 && report.content) {
                medications = await extractMedicationsFromReport(report.content);
            }
            console.log({ medications });

            // Si aún no hay medicamentos, intentar extraer del audio si está disponible
            if (medications.length === 0 && medicalData?.audioBlob) {
                try {
                    const audioExtraction = await extractMedicationsFromAudio(medicalData.audioBlob, OPENAI_API_KEY!);
                    if (audioExtraction.medications && audioExtraction.medications.length > 0) {
                        medications = audioExtraction.medications;
                        console.log({ medications });
                    }
                } catch (error) {
                    console.error('Error extracting medications from audio:', error);
                }
            }

            // Si aún no hay medicamentos, usar medicamentos de ejemplo como fallback
            if (medications.length === 0) {
                medications = [
                    {
                        name: 'Sin medicamentos especificados',
                        dosage: '',
                        form: '',
                        manufacturer: '',
                        type: '',
                        composition: 'Consulte con su médico',
                        instructions: 'Según indicación médica',
                        startDate: new Date().toLocaleDateString('es-CL'),
                        additionalNotes: ''
                    }
                ];
            }

            // Función para generar HTML de medicamentos
            const generateMedicationsHtml = (meds: any[]) => {
                return meds.map(med => `
                    <div style="margin-bottom: 1.5rem;">
                        <div style="display: flex; align-items: flex-start; margin-bottom: 0.5rem;">
                            <span style="font-size: 1.2rem; margin-right: 0.5rem; margin-top: 0.2rem; color: #000;">•</span>
                            <div style="flex: 1;">
                                <div style="font-size: 1rem; font-weight: 500; color: #000; line-height: 1.4;">
                                    ${med.name} ${med.dosage} ${med.form}
                                    ${med.manufacturer ? ` (${med.manufacturer})` : ''}
                                    ${med.type ? ` (${med.type})` : ''}
                                </div>
                                
                                <div style="font-size: 0.9rem; color: #374151; margin-top: 0.25rem; margin-left: 1.5rem; line-height: 1.4;">
                                    ${med.composition}
                                </div>
                                
                                <div style="font-size: 0.9rem; color: #374151; margin-top: 0.25rem; margin-left: 1.5rem; line-height: 1.4;">
                                    ${med.instructions}
                                </div>
                                
                                <div style="font-size: 0.9rem; color: #374151; margin-top: 0.25rem; margin-left: 1.5rem; line-height: 1.4;">
                                    A partir de: ${med.startDate}
                                </div>
                                
                                ${med.additionalNotes ? `
                                    <div style="font-size: 0.9rem; color: #374151; margin-top: 0.25rem; margin-left: 1.5rem; line-height: 1.4;">
                                        ${med.additionalNotes}
                                    </div>
                                ` : ''}
                            </div>
                        </div>
                    </div>
                `).join('');
            };

            // Generar contenido HTML para la receta médica con formato de medicamentos
            const recetaHtml = `
                <!DOCTYPE html>
                <html>
                <head>
                    <meta charset="UTF-8">
                    <title>Receta Médica</title>
                    <style>
                        @media print {
                            @page { margin: 20px; }
                            body { margin: 0; padding: 20px; }
                        }
                        body {
                            font-family: Arial, sans-serif;
                            margin: 0;
                            padding: 20px;
                            line-height: 1.4;
                            color: #333;
                        }
                        .header {
                            text-align: center;
                            margin-bottom: 2rem;
                            border-bottom: 2px solid #e5e7eb;
                            padding-bottom: 1rem;
                        }
                        .clinic-name {
                            font-size: 1.8rem;
                            font-weight: bold;
                            color: #1f2937;
                            margin: 0 0 0.5rem 0;
                        }
                        .title {
                            font-size: 1.4rem;
                            font-weight: 600;
                            color: #374151;
                            margin: 0 0 1rem 0;
                        }
                        .info-section {
                            display: grid;
                            grid-template-columns: 1fr 1fr;
                            gap: 2rem;
                            margin-bottom: 2rem;
                            padding: 1rem;
                            background: #f9fafb;
                            border-radius: 8px;
                        }
                        .info-column {
                            padding: 0.5rem;
                        }
                        .info-label {
                            font-weight: 600;
                            color: #374151;
                            margin-bottom: 0.25rem;
                        }
                        .info-value {
                            color: #6b7280;
                            font-size: 0.9rem;
                            margin-bottom: 0.5rem;
                        }
                        .medications-section {
                            margin-bottom: 2rem;
                        }
                        .medications-title {
                            font-size: 1.2rem;
                            font-weight: 600;
                            color: #1f2937;
                            margin: 0 0 1rem 0;
                            border-bottom: 1px solid #e5e7eb;
                            padding-bottom: 0.5rem;
                        }
                        .medications-content {
                            padding: 1rem;
                            background: #fff;
                            border-radius: 8px;
                        }
                        .signature {
                            margin-top: 3rem;
                            text-align: center;
                            border-top: 1px solid #e5e7eb;
                            padding-top: 1rem;
                        }
                        .signature-line {
                            border-top: 1px solid #000;
                            width: 200px;
                            margin: 10px auto;
                        }
                        .signature-image {
                            max-width: 200px;
                            max-height: 100px;
                            margin: 10px auto;
                        }
                        .qr-section {
                            text-align: center;
                            margin-top: 2rem;
                        }
                        .qr-code {
                            width: 100px;
                            height: 100px;
                            background: #008080;
                            margin: 0 auto;
                            display: flex;
                            align-items: center;
                            justify-content: center;
                            color: white;
                            font-weight: bold;
                        }
                        .validation-text {
                            font-size: 12px;
                            color: #666;
                            margin-top: 1rem;
                            text-align: center;
                        }
                        .print-button {
                            position: fixed;
                            top: 20px;
                            right: 20px;
                            padding: 10px 20px;
                            background: #008080;
                            color: white;
                            border: none;
                            border-radius: 5px;
                            cursor: pointer;
                            font-weight: bold;
                        }
                        @media print {
                            .print-button { display: none; }
                        }
                    </style>
                    <script>
                        function printAsPDF() {
                            window.print();
                        }
                        // Auto-print when page loads
                        window.onload = function() {
                            setTimeout(function() {
                                window.print();
                            }, 500);
                        };
                    </script>
                </head>
                <body>
                    <button class="print-button" onclick="printAsPDF()">Imprimir como PDF</button>
                    
                    <div class="header">
                        <div class="clinic-name">${data.clinicName}</div>
                        <div class="title">Receta Médica</div>
                    </div>
                    
                    <div class="info-section">
                        <div class="info-column">
                            <div class="info-label">Profesional:</div>
                            <div class="info-value">${data.doctorName}</div>
                            <div class="info-label">RUT:</div>
                            <div class="info-value">${data.doctorRut}</div>
                            <div class="info-label">Especialidad:</div>
                            <div class="info-value">${data.doctorSpecialty}</div>
                            <div class="info-label">Lugar:</div>
                            <div class="info-value">${data.doctorLocation}</div>
                        </div>
                        
                        <div class="info-column">
                            <div class="info-label">Paciente:</div>
                            <div class="info-value">${data.patientName}</div>
                            <div class="info-label">Sexo:</div>
                            <div class="info-value">${data.patientGender}</div>
                            <div class="info-label">RUT:</div>
                            <div class="info-value">${data.patientRut}</div>
                            <div class="info-label">Fecha Nacimiento:</div>
                            <div class="info-value">${data.patientBirthDate}</div>
                        </div>
                    </div>
                    
                    <div class="medications-section">
                        <div class="medications-title">Receta médica</div>
                        <div class="medications-content">
                            ${generateMedicationsHtml(medications)}
                        </div>
                    </div>
                    
                    <div class="signature">
                        ${data.doctorSignature ? `<img src="${data.doctorSignature}" alt="Firma del médico" class="signature-image" />` : '<div class="signature-line"></div>'}
                        <div style="font-weight: 600; margin-top: 0.5rem;">${data.doctorName}</div>
                    </div>
                    
                    <div class="qr-section">
                        <div class="qr-code">QR</div>
                    </div>
                    
                    <div class="validation-text">
                        Valide este documento en línea escaneando el código QR o visitando la dirección 
                        https://validador.clinicaalemana.cl/validar e ingresar el código ${id}
                    </div>
                </body>
                </html>
            `;

            reply.header('Content-Type', 'text/html');
            reply.header('Content-Disposition', `attachment; filename=receta_medica_${id}.html`);
            return reply.send(recetaHtml);

        } catch (error) {
            console.error('Error generating receta PDF:', error);
            return reply.code(500).send({ error: 'Error al generar la receta médica' });
        }
    },
};

// Función para generar PDF del informe completo
export const downloadInformeRoute: RouteOptions = {
    method: 'POST',
    url: '/api/reports/:id/informe',
    handler: async (request, reply) => {
        const { id } = request.params as any;
        const medicalData = request.body as any;

        try {
            const report = await getReportById(id);
            if (!report) {
                return reply.code(404).send({ error: 'Reporte no encontrado' });
            }

            // Usar datos médicos personalizados o valores por defecto
            const data = {
                clinicName: medicalData?.clinicName || 'Clínica Alemana',
                doctorName: medicalData?.doctorName || 'Dr. MÉDICO ESPECIALISTA',
                doctorRut: medicalData?.doctorRut || '12345678-9',
                doctorSpecialty: medicalData?.doctorSpecialty || 'Medicina General',
                doctorLocation: medicalData?.doctorLocation || 'CONSULTORIO',
                patientName: medicalData?.patientName || 'PACIENTE EJEMPLO',
                patientGender: medicalData?.patientGender || 'MASCULINO',
                patientRut: medicalData?.patientRut || '98765432-1',
                patientBirthDate: medicalData?.patientBirthDate || '01/01/1980 (43a)',
                doctorSignature: medicalData?.doctorSignature || null
            };

            // Generar contenido HTML para el informe médico completo con script de impresión automática
            const informeHtml = `
                <!DOCTYPE html>
                <html>
                <head>
                    <meta charset="UTF-8">
                    <title>Informe Médico</title>
                    <style>
                        @media print {
                            @page { margin: 20px; }
                            body { margin: 0; padding: 20px; }
                        }
                        body { font-family: Arial, sans-serif; margin: 0; padding: 20px; }
                        .header { text-align: center; margin-bottom: 30px; }
                        .title { color: #008080; font-size: 24px; margin-bottom: 10px; }
                        .subtitle { color: #666; font-size: 16px; }
                        .section { margin-bottom: 30px; }
                        .section-title { color: #008080; font-size: 18px; font-weight: bold; margin-bottom: 10px; }
                        .content { line-height: 1.6; }
                        .summary { background: #f9f9f9; padding: 15px; border-left: 4px solid #008080; }
                        .footer { margin-top: 40px; text-align: center; color: #666; font-size: 12px; }
                        .print-button { position: fixed; top: 20px; right: 20px; padding: 10px 20px; background: #008080; color: white; border: none; border-radius: 5px; cursor: pointer; }
                        @media print { .print-button { display: none; } }
                        .doctor-info { background: #f8fafc; padding: 15px; border-radius: 8px; margin-bottom: 20px; }
                        .signature-section { text-align: center; margin-top: 30px; }
                        .signature-image { max-width: 200px; max-height: 100px; margin: 10px auto; }
                    </style>
                    <script>
                        function printAsPDF() {
                            window.print();
                        }
                        // Auto-print when page loads
                        window.onload = function() {
                            setTimeout(function() {
                                window.print();
                            }, 500);
                        };
                    </script>
                </head>
                <body>
                    <button class="print-button" onclick="printAsPDF()">Imprimir como PDF</button>
                    
                    <div class="header">
                        <div class="title">Informe Médico</div>
                        <div class="subtitle">${data.clinicName}</div>
                        <div>Fecha: ${new Date().toLocaleDateString('es-CL')} | Hora: ${new Date().toLocaleTimeString('es-CL')}</div>
                    </div>
                    
                    <div class="doctor-info">
                        <strong>Médico:</strong> ${data.doctorName} | <strong>Especialidad:</strong> ${data.doctorSpecialty}<br>
                        <strong>Paciente:</strong> ${data.patientName} | <strong>RUT:</strong> ${data.patientRut}
                    </div>
                    
                    <div class="section">
                        <div class="section-title">Resumen Ejecutivo</div>
                        <div class="summary">
                            ${report.summary || 'Sin resumen disponible'}
                        </div>
                    </div>
                    
                    <div class="section">
                        <div class="section-title">Informe Detallado</div>
                        <div class="content">
                            ${report.content || 'Sin contenido disponible'}
                        </div>
                    </div>
                    
                    <div class="section">
                        <div class="section-title">Datos del Reporte</div>
                        <div class="content">
                            <strong>ID del Reporte:</strong> ${report.id}<br>
                            <strong>Duración de la consulta:</strong> ${report.duration || 'No especificada'}<br>
                            <strong>Fecha de creación:</strong> ${new Date(report.createdAt || Date.now()).toLocaleDateString('es-CL')}
                        </div>
                    </div>
                    
                    <div class="signature-section">
                        ${data.doctorSignature ? `<img src="${data.doctorSignature}" alt="Firma del médico" class="signature-image" />` : ''}
                        <div><strong>${data.doctorName}</strong></div>
                        <div>${data.doctorSpecialty}</div>
                    </div>
                    
                    <div class="footer">
                        <p>Este informe fue generado automáticamente por el sistema de ${data.clinicName}</p>
                        <p>Para consultas, contacte a su médico tratante</p>
                    </div>
                </body>
                </html>
            `;

            reply.header('Content-Type', 'text/html');
            reply.header('Content-Disposition', `attachment; filename=informe_medico_${id}.html`);
            return reply.send(informeHtml);

        } catch (error) {
            console.error('Error generating informe PDF:', error);
            return reply.code(500).send({ error: 'Error al generar el informe médico' });
        }
    },
};

// Función para generar PDF de exámenes médicos
export const downloadExamenesRoute: RouteOptions = {
    method: 'POST',
    url: '/api/reports/:id/examenes',
    handler: async (request, reply) => {
        const { id } = request.params as any;
        const medicalData = request.body as any;

        try {
            const report = await getReportById(id);
            if (!report) {
                return reply.code(404).send({ error: 'Reporte no encontrado' });
            }

            // Usar datos médicos personalizados o valores por defecto
            const data = {
                clinicName: medicalData?.clinicName || 'Clínica Alemana',
                doctorName: medicalData?.doctorName || 'Dr. MÉDICO ESPECIALISTA',
                doctorRut: medicalData?.doctorRut || '12345678-9',
                doctorSpecialty: medicalData?.doctorSpecialty || 'Medicina General',
                doctorLocation: medicalData?.doctorLocation || 'CONSULTORIO',
                patientName: medicalData?.patientName || 'PACIENTE EJEMPLO',
                patientGender: medicalData?.patientGender || 'MASCULINO',
                patientRut: medicalData?.patientRut || '98765432-1',
                patientBirthDate: medicalData?.patientBirthDate || '01/01/1980 (43a)',
                doctorSignature: medicalData?.doctorSignature || null
            };

            // Generar contenido HTML para el documento de exámenes médicos
            const examenesHtml = `
                <!DOCTYPE html>
                <html>
                <head>
                    <meta charset="UTF-8">
                    <title>Examen / Procedimiento</title>
                    <style>
                        @media print {
                            @page { margin: 20px; }
                            body { margin: 0; padding: 20px; }
                        }
                        body { font-family: Arial, sans-serif; margin: 0; padding: 20px; }
                        .header { display: flex; justify-content: space-between; align-items: center; margin-bottom: 30px; }
                        .logo { color: #008080; font-weight: bold; font-size: 18px; }
                        .title { color: #008080; text-align: center; font-size: 24px; margin: 20px 0; }
                        .info-section { display: flex; border: 1px solid #ccc; margin-bottom: 20px; }
                        .info-column { flex: 1; padding: 15px; }
                        .info-column:first-child { border-right: 1px solid #ccc; }
                        .label { font-weight: bold; color: #333; }
                        .value { color: #008080; margin-bottom: 10px; }
                        .exam-section { margin-top: 20px; }
                        .exam-title { color: #008080; font-size: 18px; font-weight: bold; margin-bottom: 15px; }
                        .service-info { background: #f9f9f9; padding: 15px; border-radius: 8px; margin-bottom: 20px; }
                        .exam-result { margin-bottom: 15px; }
                        .exam-name { font-weight: bold; color: #333; margin-bottom: 5px; }
                        .exam-finding { color: #666; font-size: 14px; }
                        .signature { margin-top: 40px; text-align: center; }
                        .signature-line { border-top: 1px solid #000; width: 200px; margin: 10px auto; }
                        .signature-image { max-width: 200px; max-height: 100px; margin: 10px auto; }
                        .qr-section { text-align: center; margin-top: 30px; }
                        .validation-text { font-size: 12px; color: #666; margin-top: 20px; }
                        .print-button { position: fixed; top: 20px; right: 20px; padding: 10px 20px; background: #008080; color: white; border: none; border-radius: 5px; cursor: pointer; }
                        @media print { .print-button { display: none; } }
                    </style>
                    <script>
                        function printAsPDF() {
                            window.print();
                        }
                        // Auto-print when page loads
                        window.onload = function() {
                            setTimeout(function() {
                                window.print();
                            }, 500);
                        };
                    </script>
                </head>
                <body>
                    <button class="print-button" onclick="printAsPDF()">Imprimir como PDF</button>
                    
                    <div class="header">
                        <div class="logo">${data.clinicName}</div>
                        <div>Indicaciones</div>
                    </div>
                    
                    <div class="title">Examen / Procedimiento</div>
                    <div style="text-align: center; margin-bottom: 20px;">
                        Fecha: ${new Date().toLocaleDateString('es-CL')} Hora: ${new Date().toLocaleTimeString('es-CL')}
                    </div>
                    
                    <div class="info-section">
                        <div class="info-column">
                            <div class="label">Profesional</div>
                            <div class="value">${data.doctorName}</div>
                            <div class="label">RUT:</div>
                            <div class="value">${data.doctorRut}</div>
                            <div class="label">Especialidad:</div>
                            <div class="value">${data.doctorSpecialty}</div>
                            <div class="label">Lugar:</div>
                            <div class="value">${data.doctorLocation}</div>
                        </div>
                        <div class="info-column">
                            <div class="label">Paciente</div>
                            <div class="value">${data.patientName}</div>
                            <div class="label">Sexo:</div>
                            <div class="value">${data.patientGender}</div>
                            <div class="label">RUT:</div>
                            <div class="value">${data.patientRut}</div>
                            <div class="label">Fecha Nacimiento:</div>
                            <div class="value">${data.patientBirthDate}</div>
                        </div>
                    </div>
                    
                    <div class="exam-section">
                        <div class="exam-title">Examen / Procedimiento</div>
                        
                        <div class="service-info">
                            <strong>Servicio:</strong> ${data.doctorSpecialty} / <strong>Hip. Diagnóstica:</strong> No Definido
                        </div>
                        
                        <div class="exam-result">
                            <div class="exam-name">1. ${data.doctorSpecialty.toUpperCase()} - ${data.doctorSpecialty.toUpperCase()}</div>
                            <div class="exam-finding">
                                ${report.summary || 'Sin hallazgos específicos reportados'}
                            </div>
                        </div>
                    </div>
                    
                    <div class="signature">
                        ${data.doctorSignature ? `<img src="${data.doctorSignature}" alt="Firma del médico" class="signature-image" />` : '<div class="signature-line"></div>'}
                        <div>${data.doctorName}</div>
                    </div>
                    
                    <div class="qr-section">
                        <div style="width: 100px; height: 100px; background: #008080; margin: 0 auto; display: flex; align-items: center; justify-content: center; color: white;">
                            QR
                        </div>
                    </div>
                    
                    <div class="validation-text">
                        Valide este documento en línea escaneando el código QR o visitando la dirección 
                        https://validador.clinicaalemana.cl/validar e ingresar el código ${id}
                    </div>
                </body>
                </html>
            `;

            reply.header('Content-Type', 'text/html');
            reply.header('Content-Disposition', `attachment; filename=examenes_medicos_${id}.html`);
            return reply.send(examenesHtml);

        } catch (error) {
            console.error('Error generating examenes PDF:', error);
            return reply.code(500).send({ error: 'Error al generar el documento de exámenes' });
        }
    },
};

// Función para obtener estadísticas del dashboard
export const getDashboardStatsRoute: RouteOptions = {
    method: 'GET',
    url: '/api/dashboard/stats',
    handler: async (request, reply) => {
        try {
            // Obtener estadísticas reales de la base de datos
            const totalReports = await Report.countDocuments();

            // Calcular duración promedio
            const reportsWithDuration = await Report.find({ duration: { $exists: true, $ne: null } });
            const averageDuration = reportsWithDuration.length > 0
                ? reportsWithDuration.reduce((acc, report) => acc + (parseInt(report.duration) || 0), 0) / reportsWithDuration.length
                : 0;

            // Obtener actividad reciente (últimos 10 reportes)
            const recentReports = await Report.find()
                .sort({ createdAt: -1 })
                .limit(10)
                .lean();

            // Simular estadísticas de descargas (en un sistema real, esto vendría de una tabla de logs)
            const totalDownloads = Math.floor(totalReports * 2.3); // Simulación basada en reportes

            // Simular estadísticas de grabaciones (en un sistema real, esto vendría de logs de transcripción)
            const totalRecordings = Math.floor(totalReports * 1.1); // Simulación basada en reportes

            // Formatear actividad reciente
            const recentActivity = recentReports.map((report, index) => ({
                id: report._id.toString(),
                type: 'report' as const,
                title: `Informe Médico - ${report.summary ? report.summary.substring(0, 30) + '...' : 'Sin título'}`,
                date: report.createdAt ? new Date(report.createdAt).toISOString() : new Date().toISOString()
            }));

            // Agregar algunas actividades simuladas para variedad
            const mockActivities = [
                {
                    id: `download-${Date.now()}`,
                    type: 'download' as const,
                    title: 'Receta Médica descargada',
                    date: new Date(Date.now() - 1000 * 60 * 30).toISOString() // 30 minutos atrás
                },
                {
                    id: `recording-${Date.now()}`,
                    type: 'recording' as const,
                    title: 'Nueva grabación iniciada',
                    date: new Date(Date.now() - 1000 * 60 * 60).toISOString() // 1 hora atrás
                }
            ];

            // Combinar actividades reales y simuladas
            const allActivities = [...recentActivity, ...mockActivities]
                .sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime())
                .slice(0, 6); // Limitar a 6 actividades

            const stats = {
                totalRecordings,
                totalReports,
                totalDownloads,
                averageDuration: Math.round(averageDuration * 10) / 10, // Redondear a 1 decimal
                recentActivity: allActivities
            };

            return stats;

        } catch (error) {
            console.error('Error getting dashboard stats:', error);
            return reply.code(500).send({ error: 'Error al obtener estadísticas del dashboard' });
        }
    },
}; 