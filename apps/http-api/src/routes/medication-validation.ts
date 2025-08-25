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

    // Primero, agregar palabras individuales que podrían ser medicamentos
    for (const word of words) {
        if (word.length >= 3 && !stopWords.has(word)) {
            medications.push(word);
        }
    }

    // Luego, buscar secuencias de palabras que podrían formar nombres de medicamentos
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

// Función para calcular similitud entre dos strings usando múltiples algoritmos
function calculateSimilarity(str1: string, str2: string): number {
    const normalized1 = normalizeText(str1);
    const normalized2 = normalizeText(str2);

    if (normalized1 === normalized2) return 1.0;

    // 1. Distancia de Levenshtein
    const levenshteinDistance = calculateLevenshteinDistance(normalized1, normalized2);
    const maxLength = Math.max(normalized1.length, normalized2.length);
    const levenshteinSimilarity = 1 - (levenshteinDistance / maxLength);

    // 2. Similitud de Jaro-Winkler mejorada
    const jaroSimilarity = calculateJaroSimilarity(normalized1, normalized2);

    // 3. Similitud de caracteres comunes
    const commonCharSimilarity = calculateCommonCharSimilarity(normalized1, normalized2);

    // 4. Similitud de palabras (para casos como "paracetamol" vs "apracetamol")
    const wordSimilarity = calculateWordSimilarity(normalized1, normalized2);

    // Combinar todas las similitudes con pesos
    const combinedSimilarity = (
        levenshteinSimilarity * 0.4 +
        jaroSimilarity * 0.3 +
        commonCharSimilarity * 0.2 +
        wordSimilarity * 0.1
    );

    return Math.min(1.0, Math.max(0.0, combinedSimilarity));
}

// Función para calcular la distancia de Levenshtein
function calculateLevenshteinDistance(str1: string, str2: string): number {
    const matrix: number[][] = [];

    // Inicializar matriz
    for (let j = 0; j <= str2.length; j++) {
        matrix[j] = [];
        for (let i = 0; i <= str1.length; i++) {
            matrix[j]![i] = 0;
        }
    }

    for (let i = 0; i <= str1.length; i++) {
        matrix[0]![i] = i;
    }

    for (let j = 0; j <= str2.length; j++) {
        matrix[j]![0] = j;
    }

    for (let j = 1; j <= str2.length; j++) {
        for (let i = 1; i <= str1.length; i++) {
            const indicator = str1[i - 1] === str2[j - 1] ? 0 : 1;
            matrix[j]![i] = Math.min(
                matrix[j]![i - 1]! + 1, // eliminación
                matrix[j - 1]![i]! + 1, // inserción
                matrix[j - 1]![i - 1]! + indicator // sustitución
            );
        }
    }

    return matrix[str2.length]![str1.length]!;
}

// Función para calcular similitud de Jaro mejorada
function calculateJaroSimilarity(str1: string, str2: string): number {
    if (str1 === str2) return 1.0;
    if (str1.length === 0 || str2.length === 0) return 0.0;

    const matchWindow = Math.floor(Math.max(str1.length, str2.length) / 2) - 1;
    if (matchWindow < 0) return 0.0;

    let matches1 = new Array(str1.length).fill(false);
    let matches2 = new Array(str2.length).fill(false);

    // Encontrar coincidencias
    for (let i = 0; i < str1.length; i++) {
        const start = Math.max(0, i - matchWindow);
        const end = Math.min(str2.length, i + matchWindow + 1);

        for (let j = start; j < end; j++) {
            if (!matches2[j] && str1[i] === str2[j]) {
                matches1[i] = true;
                matches2[j] = true;
                break;
            }
        }
    }

    const matches1Str = str1.split('').filter((_, i) => matches1[i]).join('');
    const matches2Str = str2.split('').filter((_, i) => matches2[i]).join('');

    if (matches1Str.length === 0) return 0.0;

    // Calcular transposiciones
    let transpositions = 0;
    for (let i = 0; i < matches1Str.length; i++) {
        if (matches1Str[i] !== matches2Str[i]) {
            transpositions++;
        }
    }

    const m = matches1Str.length;
    const t = transpositions / 2;

    return (m / str1.length + m / str2.length + (m - t) / m) / 3;
}

// Función para calcular similitud basada en caracteres comunes
function calculateCommonCharSimilarity(str1: string, str2: string): number {
    const chars1 = new Set(str1.split(''));
    const chars2 = new Set(str2.split(''));

    const intersection = new Set([...chars1].filter(x => chars2.has(x)));
    const union = new Set([...chars1, ...chars2]);

    return intersection.size / union.size;
}

// Función para calcular similitud de palabras (especialmente útil para errores tipográficos)
function calculateWordSimilarity(str1: string, str2: string): number {
    // Para palabras cortas, usar similitud de caracteres
    if (str1.length <= 3 || str2.length <= 3) {
        return calculateCommonCharSimilarity(str1, str2);
    }

    // Para palabras más largas, buscar patrones de caracteres similares
    let similarChars = 0;
    const minLength = Math.min(str1.length, str2.length);

    for (let i = 0; i < minLength; i++) {
        if (str1[i] === str2[i]) {
            similarChars++;
        } else if (i > 0 && i < minLength - 1) {
            // Verificar transposiciones de caracteres adyacentes
            if (str1[i] === str2[i + 1] && str1[i + 1] === str2[i]) {
                similarChars += 0.8; // Penalizar ligeramente las transposiciones
                i++; // Saltar el siguiente carácter
            }
        }
    }

    return similarChars / Math.max(str1.length, str2.length);
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

            if (similarity > 0.75) {
                if (!bestMatch || similarity > bestMatch.similarity) {
                    bestMatch = { name: vademecumItem, similarity };
                }
            } else if (similarity > 0.5) {
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
                totalFound: validation.found.length || 0,
                totalNotFound: validation.notFound.length || 0,
                totalSuggestions: validation.suggestions.length || 0
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