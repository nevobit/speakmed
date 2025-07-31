import { RouteOptions } from 'fastify';
import { readFileSync } from 'node:fs';
import { join } from 'node:path';

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
    const words = normalizedText.split(' ');
    const medications: string[] = [];

    // Buscar palabras que podrían ser nombres de medicamentos
    // (palabras con 3 o más caracteres que no son artículos, preposiciones, etc.)
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
function validateMedications(text: string, country: string): {
    found: Array<{ name: string; similarity: number; original: string }>;
    notFound: string[];
    suggestions: Array<{ original: string; suggestions: string[] }>;
} {
    const medications = extractMedicationNames(text);
    const vademecum = vademecumData[country] || [];

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

export const medicationValidationRoute: RouteOptions = {
    method: 'POST',
    url: '/api/medication-validation',
    schema: {
        body: {
            type: 'object',
            required: ['text', 'country'],
            properties: {
                text: { type: 'string' },
                country: { type: 'string', enum: ['ARG', 'CHL', 'COL', 'MEX'] }
            }
        },
        response: {
            200: {
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
        const { text, country } = request.body as { text: string; country: string };

        if (!text || !country) {
            return reply.code(400).send({
                error: 'Se requiere texto y país para la validación'
            });
        }

        if (!vademecumData[country]) {
            return reply.code(400).send({
                error: 'País no soportado'
            });
        }

        try {
            const validation = validateMedications(text, country);

            const summary = {
                totalFound: validation.found.length,
                totalNotFound: validation.notFound.length,
                totalSuggestions: validation.suggestions.length
            };

            return {
                ...validation,
                summary
            };
        } catch (error) {
            console.error('Error en validación de medicamentos:', error);
            return reply.code(500).send({
                error: 'Error interno del servidor'
            });
        }
    }
}; 