/**
 * Limpia el contenido JSON de respuestas de IA que pueden incluir markdown y backticks
 * @param content - Contenido que puede contener JSON con markdown
 * @returns JSON limpio y parseable
 */
export function cleanJsonContent(content: string): string {
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
 * @param content - Contenido que puede contener JSON
 * @returns Objeto parseado o null si falla
 */
export function safeJsonParse<T>(content: string): T | null {
    try {
        const cleaned = cleanJsonContent(content);
        return JSON.parse(cleaned) as T;
    } catch (error) {
        console.error('Error parsing JSON after cleaning:', error);
        console.error('Original content:', content);
        return null;
    }
}
