import axios from 'axios';

/**
 * Limpia el contenido JSON de respuestas de IA que pueden incluir markdown y backticks
 */
function cleanJsonContent(content: string): string {
    if (!content) return '';

    let cleaned = content.trim();

    // Remover markdown code blocks
    cleaned = cleaned.replace(/```json\s*/gi, '');
    cleaned = cleaned.replace(/```\s*/gi, '');
    cleaned = cleaned.replace(/^```\s*/, '');
    cleaned = cleaned.replace(/\s*```$/, '');

    // Remover explicaciones adicionales antes o después del JSON
    const jsonStart = cleaned.indexOf('[');
    const jsonEnd = cleaned.lastIndexOf(']');

    if (jsonStart !== -1 && jsonEnd !== -1 && jsonEnd > jsonStart) {
        cleaned = cleaned.substring(jsonStart, jsonEnd + 1);
    }

    // Limpiar espacios extra
    cleaned = cleaned.trim();

    return cleaned;
}

/**
 * Intenta parsear JSON con limpieza automática
 */
function safeJsonParse<T>(content: string): T | null {
    try {
        const cleaned = cleanJsonContent(content);
        return JSON.parse(cleaned) as T;
    } catch (error) {
        console.error('Error parsing JSON after cleaning:', error);
        console.error('Original content:', content);
        return null;
    }
}

export interface ExtractedMedication {
    name: string;
    dosage: string;
    form: string;
    manufacturer?: string;
    type: string;
    composition: string;
    instructions: string;
    startDate: string;
    additionalNotes?: string;
}

export interface MedicationExtractionResult {
    medications: ExtractedMedication[];
    summary: {
        totalMedications: number;
        confidence: number;
        extractionMethod: string;
    };
    rawText?: string;
}

/**
 * Extrae medicamentos del audio usando transcripción y análisis con IA
 * @param audioBlob - El archivo de audio a procesar
 * @param apiKey - API key de OpenAI
 * @returns Lista de medicamentos extraídos con detalles
 */
export const extractMedicationsFromAudio = async (
    audioBlob: Blob,
    apiKey: string
): Promise<MedicationExtractionResult> => {
    try {
        // Paso 1: Transcribir el audio
        const transcript = await transcribeAudio(audioBlob, apiKey);

        // Paso 2: Extraer medicamentos del texto transcrito
        const medications = await extractMedicationsFromText(transcript, apiKey);

        // Paso 3: Validar medicamentos contra Vademecum
        const validatedMedications = await validateMedications(medications, apiKey);

        return {
            medications: validatedMedications,
            summary: {
                totalMedications: validatedMedications.length,
                confidence: calculateConfidence(validatedMedications),
                extractionMethod: 'AI + Vademecum Validation'
            },
            rawText: transcript
        };
    } catch (error) {
        console.error('Error extracting medications from audio:', error);
        throw new Error('Error al extraer medicamentos del audio');
    }
};

/**
 * Transcribe el audio usando OpenAI Whisper
 */
const transcribeAudio = async (audioBlob: Blob, apiKey: string): Promise<string> => {
    const formData = new FormData();
    formData.append('file', audioBlob, 'audio.webm');
    formData.append('model', 'whisper-1');
    formData.append('language', 'es');
    formData.append('response_format', 'json');

    const response = await axios.post(
        'https://api.openai.com/v1/audio/transcriptions',
        formData,
        {
            headers: {
                'Authorization': `Bearer ${apiKey}`,
                // NOTE: In Node.js, use formData.getHeaders(). In browser, FormData does not have getHeaders().
                // If running in browser, do not spread formData.getHeaders().
                // If using axios in browser, Content-Type will be set automatically.
            },
            timeout: 30000,
        })

    return response.data.text;
};

/**
 * Extrae medicamentos del texto usando IA
 */
const extractMedicationsFromText = async (
    text: string,
    apiKey: string
): Promise<ExtractedMedication[]> => {
    const prompt = `Eres un asistente médico experto. Analiza el siguiente texto de una consulta médica y extrae todos los medicamentos mencionados con sus detalles completos.

Texto de la consulta:
${text}

Extrae los medicamentos y devuelve el resultado en formato JSON con la siguiente estructura exacta:
[
  {
    "name": "Nombre del medicamento",
    "dosage": "Dosis (ej: 500mg, 10ml, 1 comprimido)",
    "form": "Forma farmacéutica (comprimido, jarabe, inyección, etc.)",
    "manufacturer": "Fabricante si se menciona (opcional)",
    "type": "Tipo de tratamiento (Permanente, Temporal, SOS)",
    "composition": "Composición del medicamento",
    "instructions": "Instrucciones de uso específicas",
    "startDate": "Fecha de inicio si se menciona",
    "additionalNotes": "Notas adicionales (opcional)"
  }
]

IMPORTANTE:
- Si no hay medicamentos mencionados, devuelve un array vacío []
- Usa información específica del texto cuando esté disponible
- Para campos no mencionados, usa valores por defecto apropiados
- Asegúrate de que el JSON sea válido y parseable
- Incluye solo medicamentos que realmente fueron recetados o mencionados
- DEVUELVE SOLO JSON PURO, sin markdown, sin backticks, sin explicaciones adicionales
- El JSON debe ser parseable directamente con JSON.parse()`;

    try {
        const response = await axios.post(
            'https://api.openai.com/v1/chat/completions',
            {
                model: 'gpt-3.5-turbo',
                messages: [
                    {
                        role: 'system',
                        content: 'Eres un asistente médico experto especializado en extraer información de medicamentos de consultas médicas.'
                    },
                    {
                        role: 'user',
                        content: prompt
                    }
                ],
                max_tokens: 2000,
                temperature: 0.1
            },
            {
                headers: {
                    'Authorization': `Bearer ${apiKey}`,
                    'Content-Type': 'application/json'
                },
                timeout: 30000
            }
        );

        const content = response.data.choices[0].message.content;

        // Usar la función utilitaria para parsear JSON de manera segura
        const medications = safeJsonParse<ExtractedMedication[]>(content);
        if (medications && Array.isArray(medications)) {
            return medications.map(med => ({
                ...med,
                startDate: med.startDate || new Date().toLocaleDateString('es-CL'),
                type: med.type || 'Temporal',
                form: med.form || 'comprimido',
                composition: med.composition || med.name
            }));
        }

        return [];
    } catch (error) {
        console.error('Error calling OpenAI API for medication extraction:', error);
        return [];
    }
};

/**
 * Valida medicamentos contra el Vademecum y mejora la información
 */
const validateMedications = async (
    medications: ExtractedMedication[],
    apiKey: string
): Promise<ExtractedMedication[]> => {
    if (medications.length === 0) return [];

    const prompt = `Eres un farmacéutico experto. Valida y mejora la información de los siguientes medicamentos contra el Vademecum de Chile.

Medicamentos a validar:
${JSON.stringify(medications, null, 2)}

Para cada medicamento:
1. Verifica que el nombre sea correcto según el Vademecum
2. Corrige la dosis si es necesario
3. Mejora las instrucciones de uso
4. Agrega información de composición si falta
5. Sugiere el fabricante más común en Chile

Devuelve el resultado en formato JSON con la misma estructura, pero con la información validada y mejorada.

IMPORTANTE: DEVUELVE SOLO JSON PURO, sin markdown, sin backticks, sin explicaciones adicionales. El JSON debe ser parseable directamente con JSON.parse().`;

    try {
        const response = await axios.post(
            'https://api.openai.com/v1/chat/completions',
            {
                model: 'gpt-3.5-turbo',
                messages: [
                    {
                        role: 'system',
                        content: 'Eres un farmacéutico experto especializado en validar medicamentos contra el Vademecum de Chile.'
                    },
                    {
                        role: 'user',
                        content: prompt
                    }
                ],
                max_tokens: 2000,
                temperature: 0.1
            },
            {
                headers: {
                    'Authorization': `Bearer ${apiKey}`,
                    'Content-Type': 'application/json'
                },
                timeout: 30000
            }
        );

        const content = response.data.choices[0].message.content;

        // Usar la función utilitaria para parsear JSON de manera segura
        const validatedMedications = safeJsonParse<ExtractedMedication[]>(content);
        if (validatedMedications && Array.isArray(validatedMedications)) {
            return validatedMedications;
        }

        return medications; // Retornar originales si falla la validación
    } catch (error) {
        console.error('Error validating medications:', error);
        return medications; // Retornar originales si falla la validación
    }
};

/**
 * Calcula la confianza de la extracción basada en la completitud de la información
 */
const calculateConfidence = (medications: ExtractedMedication[]): number => {
    if (medications.length === 0) return 0;

    let totalConfidence = 0;

    for (const med of medications) {
        let confidence = 0;

        // Puntos por información disponible
        if (med.name) confidence += 20;
        if (med.dosage) confidence += 20;
        if (med.instructions) confidence += 20;
        if (med.form) confidence += 10;
        if (med.composition) confidence += 10;
        if (med.manufacturer) confidence += 10;
        if (med.type) confidence += 5;
        if (med.startDate) confidence += 5;

        totalConfidence += confidence;
    }

    return Math.round(totalConfidence / medications.length);
};
