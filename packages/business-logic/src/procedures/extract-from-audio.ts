import axios from 'axios';

export interface ExtractedProcedure {
    name: string;
    description: string;
    instructions: string;
    frequency: string;
    duration: string;
    priority: 'Alta' | 'Media' | 'Baja';
    category: string;
    preparation?: string;
    followUp?: string;
    additionalNotes?: string;
}

export interface ProcedureExtractionResult {
    procedures: ExtractedProcedure[];
    summary: {
        totalProcedures: number;
        confidence: number;
        extractionMethod: string;
    };
    rawText?: string;
}

/**
 * Extrae procedimientos médicos del audio usando transcripción y análisis con IA
 * @param audioBlob - El archivo de audio a procesar
 * @param apiKey - API key de OpenAI
 * @returns Lista de procedimientos extraídos con detalles
 */
export const extractProceduresFromAudio = async (
    audioBlob: Blob,
    apiKey: string
): Promise<ProcedureExtractionResult> => {
    try {
        // Paso 1: Transcribir el audio
        const transcript = await transcribeAudio(audioBlob, apiKey);

        // Paso 2: Extraer procedimientos del texto transcrito
        const procedures = await extractProceduresFromText(transcript, apiKey);

        // Paso 3: Validar y mejorar procedimientos
        const validatedProcedures = await validateProcedures(procedures, apiKey);

        return {
            procedures: validatedProcedures,
            summary: {
                totalProcedures: validatedProcedures.length,
                confidence: calculateConfidence(validatedProcedures),
                extractionMethod: 'AI + Medical Validation'
            },
            rawText: transcript
        };
    } catch (error) {
        console.error('Error extracting procedures from audio:', error);
        throw new Error('Error al extraer procedimientos del audio');
    }
};

/**
 * Transcribe el audio usando OpenAI Whisper
 */
const transcribeAudio = async (audioBlob: Blob, apiKey: string): Promise<string> => {
    const formData = new FormData();
    formData.append('file', audioBlob, 'audio.webm');
    formData.append('model', 'gpt-4o-mini-transcribe');
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
        }
    );

    return response.data.text;
};

/**
 * Extrae procedimientos del texto usando IA
 */
const extractProceduresFromText = async (
    text: string,
    apiKey: string
): Promise<ExtractedProcedure[]> => {
    const prompt = `Eres un asistente médico experto. Analiza el siguiente texto de una consulta médica y extrae todos los procedimientos médicos, exámenes, tratamientos y acciones que el paciente debe realizar.
    excluye medicamentos
Texto de la consulta:
${text}

Extrae los procedimientos y devuelve el resultado en formato JSON con la siguiente estructura exacta:
[
  {
    "name": "Nombre del procedimiento",
    "description": "Descripción detallada del procedimiento",
    "instructions": "Instrucciones específicas para el paciente",
    "frequency": "Frecuencia (ej: diario, cada 8 horas, semanal, una vez)",
    "duration": "Duración del tratamiento (ej: 7 días, 2 semanas, indefinido)",
    "priority": "Prioridad (Alta, Media, Baja)",
    "category": "Categoría (Examen, Tratamiento, Terapia, Cirugía, Control, etc.)",
    "preparation": "Preparación requerida (opcional)",
    "followUp": "Seguimiento requerido (opcional)",
    "additionalNotes": "Notas adicionales (opcional)"
  }
]

IMPORTANTE:
- Incluye solo procedimientos que el paciente debe realizar
- NO incluyas diagnósticos ni resúmenes generales
- Enfócate en acciones específicas: exámenes, tratamientos, terapias, controles
- Si no hay procedimientos mencionados, devuelve un array vacío []
- Usa información específica del texto cuando esté disponible
- Para campos no mencionados, usa valores por defecto apropiados
- Asegúrate de que el JSON sea válido y parseable
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
                        content: 'Eres un asistente médico experto especializado en extraer procedimientos médicos de consultas médicas.'
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
        const procedures = safeJsonParse<ExtractedProcedure[]>(content);
        if (procedures && Array.isArray(procedures)) {
            return procedures.map(proc => ({
                ...proc,
                priority: proc.priority || 'Media',
                category: proc.category || 'Tratamiento',
                frequency: proc.frequency || 'Según indicación',
                duration: proc.duration || 'Indefinido'
            }));
        }

        return [];
    } catch (error) {
        console.error('Error calling OpenAI API for procedure extraction:', error);
        return [];
    }
};

/**
 * Valida y mejora procedimientos usando IA
 */
const validateProcedures = async (
    procedures: ExtractedProcedure[],
    apiKey: string
): Promise<ExtractedProcedure[]> => {
    if (procedures.length === 0) return [];

    const prompt = `Eres un médico experto. Valida y mejora la información de los siguientes procedimientos médicos.

Procedimientos a validar:
${JSON.stringify(procedures, null, 2)}

Para cada procedimiento:
1. Verifica que el nombre sea correcto y específico
2. Mejora las instrucciones para que sean claras para el paciente
3. Corrige la frecuencia y duración si es necesario
4. Ajusta la prioridad según la urgencia médica
5. Categoriza correctamente el procedimiento
6. Agrega información de preparación si es relevante
7. Especifica el seguimiento requerido

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
                        content: 'Eres un médico experto especializado en validar procedimientos médicos.'
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
        const validatedProcedures = safeJsonParse<ExtractedProcedure[]>(content);
        if (validatedProcedures && Array.isArray(validatedProcedures)) {
            return validatedProcedures;
        }

        return procedures; // Retornar originales si falla la validación
    } catch (error) {
        console.error('Error validating procedures:', error);
        return procedures; // Retornar originales si falla la validación
    }
};

/**
 * Calcula la confianza de la extracción basada en la completitud de la información
 */
const calculateConfidence = (procedures: ExtractedProcedure[]): number => {
    if (procedures.length === 0) return 0;

    let totalConfidence = 0;

    for (const proc of procedures) {
        let confidence = 0;

        // Puntos por información disponible
        if (proc.name) confidence += 20;
        if (proc.description) confidence += 15;
        if (proc.instructions) confidence += 20;
        if (proc.frequency) confidence += 10;
        if (proc.duration) confidence += 10;
        if (proc.priority) confidence += 5;
        if (proc.category) confidence += 5;
        if (proc.preparation) confidence += 5;
        if (proc.followUp) confidence += 5;
        if (proc.additionalNotes) confidence += 5;

        totalConfidence += confidence;
    }

    return Math.round(totalConfidence / procedures.length);
};

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
