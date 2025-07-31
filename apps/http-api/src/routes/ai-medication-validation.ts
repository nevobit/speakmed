import { RouteOptions } from 'fastify';
import { readFileSync } from 'node:fs';
import { join } from 'node:path';
import axios from 'axios';

const OPENAI_API_KEY = process.env.OPENAI_API_KEY;

// Cargar solo la base de datos de Chile
const chileVademecum: string[] = JSON.parse(
    readFileSync(join(__dirname, '../../data/vademecum_cl.json'), 'utf8'),
);

// Función para normalizar texto
function normalizeText(text: string): string {
    return text
        .toLowerCase()
        .normalize('NFD')
        .replace(/[\u0300-\u036f]/g, '') // Eliminar acentos
        .replace(/[^a-z0-9\s]/g, ' ') // Solo letras, números y espacios
        .replace(/\s+/g, ' ') // Múltiples espacios a uno solo
        .trim();
}

// Función para extraer medicamentos usando IA
export async function extractMedicationsWithAI(text: string): Promise<string[]> {
    if (!OPENAI_API_KEY) {
        console.warn('OpenAI API key not configured, using basic extraction');
        return extractMedicationsBasic(text);
    }

    const prompt = `Eres un experto farmacéutico chileno. Analiza el siguiente texto de una consulta médica y extrae TODOS los nombres de medicamentos mencionados.

IMPORTANTE:
- Extrae solo los nombres de medicamentos, no dosis ni indicaciones
- Incluye nombres comerciales y genéricos
- Devuelve SOLO una lista JSON de strings, sin explicaciones adicionales
- Si no hay medicamentos, devuelve un array vacío []

Ejemplos de medicamentos que debes detectar:
- Paracetamol, Ibuprofeno, Aspirina
- Nombres comerciales como: Dolo-Neurobion, Advil, etc.
- Antibióticos: Amoxicilina, Azitromicina, etc.
- Medicamentos especializados: Omeprazol, Metformina, etc.

Texto a analizar:
"${text}"

Lista de medicamentos (solo JSON):`;

    try {
        const response = await axios.post(
            'https://api.openai.com/v1/chat/completions',
            {
                model: 'gpt-3.5-turbo',
                messages: [
                    {
                        role: 'system',
                        content: 'Eres un farmacéutico experto especializado en identificar medicamentos en textos médicos. Responde solo con JSON válido.'
                    },
                    {
                        role: 'user',
                        content: prompt
                    }
                ],
                max_tokens: 500,
                temperature: 0.1
            },
            {
                headers: {
                    'Authorization': `Bearer ${OPENAI_API_KEY}`,
                    'Content-Type': 'application/json'
                },
                timeout: 15000
            }
        );

        const content = response.data.choices[0].message.content.trim();

        // Intentar parsear el JSON
        try {
            const medications = JSON.parse(content);
            if (Array.isArray(medications)) {
                return medications.filter(med => typeof med === 'string' && med.trim().length > 0);
            }
        } catch (parseError) {
            console.warn('Error parsing AI response:', parseError);
        }

        // Fallback a extracción básica
        return extractMedicationsBasic(text);
    } catch (error) {
        console.error('Error calling OpenAI API:', error);
        return extractMedicationsBasic(text);
    }
}

// Función de extracción básica como fallback
function extractMedicationsBasic(text: string): string[] {
    const normalizedText = normalizeText(text);
    const words = normalizedText.split(' ');
    const medications: string[] = [];

    const stopWords = new Set([
        'el', 'la', 'los', 'las', 'un', 'una', 'unos', 'unas',
        'de', 'del', 'a', 'al', 'con', 'por', 'para', 'sin',
        'sobre', 'entre', 'tras', 'durante', 'mediante',
        'que', 'cual', 'quien', 'cuyo', 'donde', 'cuando',
        'como', 'porque', 'pues', 'ya', 'muy', 'mas', 'menos',
        'bien', 'mal', 'mejor', 'peor', 'mas', 'menos',
        'mg', 'ml', 'g', 'kg', 'mcg', 'ui', 'mci', 'cc',
        'cada', 'hora', 'horas', 'dia', 'dias', 'semana', 'semanas',
        'mes', 'meses', 'año', 'años', 'vez', 'veces'
    ]);

    for (let i = 0; i < words.length; i++) {
        for (let j = i + 1; j <= Math.min(i + 5, words.length); j++) {
            const phrase = words.slice(i, j).join(' ');
            if (phrase.length >= 3 && !stopWords.has(phrase)) {
                medications.push(phrase);
            }
        }
    }

    return [...new Set(medications)];
}

// Función para validar medicamentos con IA
export async function validateMedicationsWithAI(medications: string[]): Promise<{
    found: Array<{ name: string; similarity: number; original: string; confidence: string }>;
    notFound: string[];
    suggestions: Array<{ original: string; suggestions: string[]; reasoning: string }>;
    aiAnalysis: string;
}> {
    if (!OPENAI_API_KEY) {
        return validateMedicationsBasic(medications);
    }

    const vademecumText = chileVademecum.slice(0, 1000).join(', '); // Limitar para el prompt

    const prompt = `Eres un farmacéutico experto chileno. Valida los siguientes medicamentos contra el Vademecum de Chile.

Medicamentos a validar: ${medications}

Base de datos del Vademecum (primeros 1000 medicamentos): ${vademecumText}

Para cada medicamento, determina:
1. Si está en el Vademecum (con similitud > 0.8)
2. Si no está, sugiere alternativas similares
3. Proporciona un análisis de confianza

Responde en este formato JSON exacto:
{
  "found": [
    {
      "name": "NOMBRE_EXACTO_VADEMECUM",
      "similarity": 0.95,
      "original": "medicamento_original",
      "confidence": "ALTA"
    }
  ],
  "notFound": ["medicamento_no_encontrado"],
  "suggestions": [
    {
      "original": "medicamento_original",
      "suggestions": ["sugerencia1", "sugerencia2"],
      "reasoning": "Explicación de por qué se sugiere"
    }
  ],
  "aiAnalysis": "Análisis general de la validación"
}`;

    try {
        const response = await axios.post(
            'https://api.openai.com/v1/chat/completions',
            {
                model: 'gpt-3.5-turbo',
                messages: [
                    {
                        role: 'system',
                        content: 'Eres un farmacéutico experto chileno especializado en validación de medicamentos. Responde solo con JSON válido.'
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
                timeout: 20000
            }
        );

        const content = response.data.choices[0].message.content.trim();

        try {
            const result = JSON.parse(content);
            return {
                found: result.found || [],
                notFound: result.notFound || [],
                suggestions: result.suggestions || [],
                aiAnalysis: result.aiAnalysis || 'Análisis no disponible'
            };
        } catch (parseError) {
            console.warn('Error parsing AI validation response:', parseError);
            return validateMedicationsBasic(medications);
        }
    } catch (error) {
        console.error('Error calling OpenAI API for validation:', error);
        return validateMedicationsBasic(medications);
    }
}

// Función de validación básica como fallback
function validateMedicationsBasic(medications: string[]): {
    found: Array<{ name: string; similarity: number; original: string; confidence: string }>;
    notFound: string[];
    suggestions: Array<{ original: string; suggestions: string[]; reasoning: string }>;
    aiAnalysis: string;
} {
    const found: Array<{ name: string; similarity: number; original: string; confidence: string }> = [];
    const notFound: string[] = [];
    const suggestions: Array<{ original: string; suggestions: string[]; reasoning: string }> = [];

    for (const medication of medications) {
        let bestMatch: { name: string; similarity: number } | null = null;
        const localSuggestions: string[] = [];

        for (const vademecumItem of chileVademecum) {
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
                original: medication,
                confidence: bestMatch.similarity > 0.9 ? 'ALTA' : 'MEDIA'
            });
        } else {
            notFound.push(medication);
            if (localSuggestions.length > 0) {
                suggestions.push({
                    original: medication,
                    suggestions: localSuggestions.slice(0, 3),
                    reasoning: 'Medicamentos similares encontrados en el Vademecum'
                });
            }
        }
    }

    return {
        found,
        notFound,
        suggestions,
        aiAnalysis: 'Validación realizada con algoritmo básico de similitud'
    };
}

// Función para calcular similitud
function calculateSimilarity(str1: string, str2: string): number {
    const normalized1 = normalizeText(str1);
    const normalized2 = normalizeText(str2);

    if (normalized1 === normalized2) return 1.0;

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

export const aiMedicationValidationRoute: RouteOptions = {
    method: 'POST',
    url: '/api/ai-medication-validation',
    schema: {
        body: {
            type: 'object',
            required: ['text'],
            properties: {
                text: { type: 'string' }
            }
        },
        response: {
            200: {
                type: 'object',
                properties: {
                    extractedMedications: {
                        type: 'array',
                        items: { type: 'string' }
                    },
                    validation: {
                        type: 'object',
                        properties: {
                            found: {
                                type: 'array',
                                items: {
                                    type: 'object',
                                    properties: {
                                        name: { type: 'string' },
                                        similarity: { type: 'number' },
                                        original: { type: 'string' },
                                        confidence: { type: 'string' }
                                    }
                                }
                            },
                            notFound: {
                                type: 'array',
                                items: { type: 'string' }
                            },
                            suggestions: {
                                type: 'array',
                                items: {
                                    type: 'object',
                                    properties: {
                                        original: { type: 'string' },
                                        suggestions: {
                                            type: 'array',
                                            items: { type: 'string' }
                                        },
                                        reasoning: { type: 'string' }
                                    }
                                }
                            },
                            aiAnalysis: { type: 'string' }
                        }
                    },
                    summary: {
                        type: 'object',
                        properties: {
                            totalExtracted: { type: 'number' },
                            totalFound: { type: 'number' },
                            totalNotFound: { type: 'number' },
                            totalSuggestions: { type: 'number' },
                            validationMethod: { type: 'string' }
                        }
                    }
                }
            },
            400: {
                type: 'object',
                properties: {
                    error: { type: 'string' }
                }
            }
        }
    },
    handler: async (request, reply) => {
        const { text } = request.body as { text: string };

        if (!text || text.trim().length === 0) {
            return reply.code(400).send({
                error: 'Se requiere texto para la validación'
            });
        }

        try {
            // Extraer medicamentos con IA (automático)
            const extractedMedications = await extractMedicationsWithAI(text);

            // Validar medicamentos con IA (automático)
            const validation = await validateMedicationsWithAI(extractedMedications);

            const summary = {
                totalExtracted: extractedMedications.length,
                totalFound: validation.found.length,
                totalNotFound: validation.notFound.length,
                totalSuggestions: validation.suggestions.length,
                validationMethod: 'IA Automática'
            };

            return {
                extractedMedications,
                validation,
                summary
            };
        } catch (error) {
            console.error('Error en validación de medicamentos con IA:', error);
            return reply.code(500).send({
                error: 'Error interno del servidor'
            });
        }
    }
}; 