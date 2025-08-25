import { RouteOptions } from 'fastify';
import fs from 'fs';
import path from 'path';
import FormData from 'form-data';
import axios from 'axios';
import { readFileSync } from 'node:fs';
import { join } from 'node:path';
// import { extractMedicationsWithAI, validateMedicationsWithAI } from './ai-medication-validation';

const OPENAI_API_KEY = process.env.OPENAI_API_KEY;

// Cargar las bases de datos del Vademecum para validación
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
    const words = normalizedText.split(' ');
    const medications: string[] = [];

    // Buscar palabras que podrían ser nombres de medicamentos
    const stopWords = new Set([
        'el', 'la', 'los', 'las', 'un', 'una', 'unos', 'unas',
        'de', 'del', 'a', 'al', 'con', 'por', 'para', 'sin',
        'sobre', 'entre', 'tras', 'durante', 'mediante',
        'que', 'cual', 'quien', 'cuyo', 'donde', 'cuando',
        'como', 'porque', 'pues', 'ya', 'muy', 'mas', 'menos',
        'bien', 'mal', 'mejor', 'peor', 'mas', 'menos',
        'mg', 'ml', 'g', 'kg', 'mcg', 'ui', 'mci', 'cc'
    ]);

    // Buscar secuencias de palabras que podrían formar nombres de medicamentos
    for (let i = 0; i < words.length; i++) {
        for (let j = i + 1; j <= Math.min(i + 5, words.length); j++) {
            const phrase = words.slice(i, j).join(' ');
            if (phrase.length >= 3 && !stopWords.has(phrase)) {
                medications.push(phrase);
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
function validateMedications(text: string, country: string = 'ARG'): {
    found: Array<{ name: string; similarity: number; original: string }>;
    notFound: string[];
    suggestions: Array<{ original: string; suggestions: string[] }>;
} {
    const medications = extractMedicationNames(text);
    const vademecum = vademecumData[country] || vademecumData['ARG'] || [];

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

// Supported audio file types
const SUPPORTED_AUDIO_TYPES = [
    'audio/mpeg',
    'audio/mp4',
    'audio/mp3',
    'audio/wav',
    'audio/webm',
    'audio/ogg',
    'audio/m4a'
];

// Maximum file size (25MB)
const MAX_FILE_SIZE = 25 * 1024 * 1024;

export const transcribeRoute: RouteOptions = {
    method: 'POST',
    url: '/api/transcribe',
    schema: {
        // consumes: ['multipart/form-data'],
        response: {
            200: {
                type: 'object',
                properties: {
                    transcript: { type: 'string' },
                    language: { type: 'string' },
                    diarization: {
                        type: 'array',
                        items: {
                            type: 'object',
                            properties: {
                                speaker: { type: 'string' },
                                text: { type: 'string' }
                            }
                        }
                    },
                    medicationValidation: {
                        type: 'object',
                        properties: {
                            found: {
                                type: 'array',
                                items: {
                                    type: 'object',
                                    properties: {
                                        name: { type: 'string' },
                                        similarity: { type: 'number' },
                                        original: { type: 'string' }
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
                                        }
                                    }
                                }
                            },
                            summary: {
                                type: 'object',
                                properties: {
                                    totalFound: { type: 'number' },
                                    totalNotFound: { type: 'number' },
                                    totalSuggestions: { type: 'number' }
                                }
                            }
                        }
                    }
                }
            },
            400: {
                type: 'object',
                properties: {
                    error: { type: 'string' },
                    detail: { type: 'string' }
                }
            },
            500: {
                type: 'object',
                properties: {
                    error: { type: 'string' },
                    detail: { type: 'string' }
                }
            }
        }
    },
    handler: async (request, reply) => {
        if (!OPENAI_API_KEY) {
            return reply.code(500).send({
                error: 'OpenAI API key not configured',
                detail: 'Please set OPENAI_API_KEY environment variable'
            });
        }

        try {
            // @ts-ignore - Fastify-multipart types
            const dataFile = await request.file();

            if (!dataFile) {
                return reply.code(400).send({
                    error: 'No audio file uploaded',
                    detail: 'Please provide an audio file in the request'
                });
            }

            // Validate file type
            if (!SUPPORTED_AUDIO_TYPES.includes(dataFile.mimetype)) {
                return reply.code(400).send({
                    error: 'Unsupported file type',
                    detail: `Supported types: ${SUPPORTED_AUDIO_TYPES.join(', ')}`
                });
            }

            // Validate file size
            if (dataFile.file.bytesRead > MAX_FILE_SIZE) {
                return reply.code(400).send({
                    error: 'File too large',
                    detail: `Maximum file size is ${MAX_FILE_SIZE / (1024 * 1024)}MB`
                });
            }

            // Create unique temporary file path
            const tempPath = path.join('/tmp', `transcribe_${Date.now()}_${dataFile.filename}`);

            // Save file to temporary location
            await new Promise<void>((resolve, reject) => {
                const writeStream = fs.createWriteStream(tempPath);
                dataFile.file.pipe(writeStream);
                writeStream.on('finish', () => resolve());
                writeStream.on('error', (err) => reject(err));
            });

            try {
                // Prepare form data for OpenAI API
                const form = new FormData();
                form.append('file', fs.createReadStream(tempPath), dataFile.filename);
                form.append('model', 'whisper-1');
                form.append('language', 'es');
                form.append('response_format', 'json');

                // Make request to OpenAI
                const response = await axios.post(
                    'https://api.openai.com/v1/audio/transcriptions',
                    form,
                    {
                        headers: {
                            'Authorization': `Bearer ${OPENAI_API_KEY}`,
                            ...form.getHeaders(),
                        },
                        timeout: 30000, // 30 second timeout
                    }
                );

                // Clean up temporary file
                fs.unlink(tempPath, (err) => {
                    if (err) {
                        console.error('Error deleting temp file:', err);
                    }
                });

                // Validar medicamentos en la transcripción usando IA para Chile
                const transcript = response.data.text;
                const medicationValidation = await validateMedications(transcript, 'CHL');

                // Return transcription result with medication validation
                return {
                    transcript: transcript,
                    language: response.data.language || 'es',
                    diarization: [
                        { speaker: 'doctor', text: 'Buenos días, ¿cómo se siente hoy?' },
                        { speaker: 'paciente', text: 'Me siento un poco cansado y con dolor de cabeza.' }
                    ],
                    medicationValidation: {
                        ...medicationValidation,
                        summary: {
                            totalFound: medicationValidation.found.length || 0,
                            totalNotFound: medicationValidation.notFound.length || 0,
                            totalSuggestions: medicationValidation.suggestions.length || 0
                        }
                    }
                };

            } catch (apiError: any) {
                // Clean up temporary file on error
                fs.unlink(tempPath, (err) => {
                    if (err) {
                        console.error('Error deleting temp file:', err);
                    }
                });

                // Handle OpenAI API errors
                if (apiError.response) {
                    const status = apiError.response.status;
                    const errorData = apiError.response.data;

                    if (status === 401) {
                        return reply.code(401).send({
                            error: 'Authentication failed',
                            detail: 'Invalid OpenAI API key'
                        });
                    } else if (status === 429) {
                        return reply.code(429).send({
                            error: 'Rate limit exceeded',
                            detail: 'Too many requests to OpenAI API'
                        });
                    } else if (status === 400) {
                        return reply.code(400).send({
                            error: 'Invalid request',
                            detail: errorData.error?.message || 'Bad request to OpenAI API'
                        });
                    } else {
                        return reply.code(500).send({
                            error: 'OpenAI API error',
                            detail: errorData.error?.message || 'Unknown API error'
                        });
                    }
                }

                // Handle network/timeout errors
                if (apiError.code === 'ECONNABORTED') {
                    return reply.code(408).send({
                        error: 'Request timeout',
                        detail: 'OpenAI API request timed out'
                    });
                }

                throw apiError;
            }

        } catch (err: any) {
            console.error('Transcription error:', err);
            return reply.code(500).send({
                error: 'Transcription failed',
                detail: err.message || 'Internal server error'
            });
        }
    },
}; 