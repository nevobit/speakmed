/**
 * Utilidades para limpiar y procesar HTML correctamente
 */

/**
 * Limpia y procesa HTML para asegurar espacios correctos
 * @param htmlContent - El contenido HTML a limpiar
 * @returns El contenido HTML limpio con espacios correctos
 */
export const cleanAndProcessHtml = (htmlContent: string): string => {
    if (!htmlContent) return '';

    // Remover marcadores de código si existen
    let cleaned = htmlContent.replace(/```html/g, '').replace(/```/g, '');

    // Asegurar que los espacios entre elementos HTML se mantengan
    cleaned = cleaned
        // Asegurar espacios después de etiquetas de cierre
        .replace(/>(\w)/g, '> $1')
        // Asegurar espacios antes de etiquetas de apertura
        .replace(/(\w)</g, '$1 <')
        // Limpiar múltiples espacios
        .replace(/\s+/g, ' ')
        // Asegurar espacios después de puntos y comas
        .replace(/([.;:])(\w)/g, '$1 $2')
        // Asegurar espacios antes de puntos y comas
        .replace(/(\w)([.;:])/g, '$1 $2')
        // Asegurar espacios después de comas
        .replace(/,(\w)/g, ', $1')
        // Asegurar espacios antes de comas
        .replace(/(\w),/g, '$1 ,')
        // Asegurar espacios después de paréntesis de apertura
        .replace(/\((\w)/g, '( $1')
        // Asegurar espacios antes de paréntesis de cierre
        .replace(/(\w)\)/g, '$1 )')
        // Limpiar espacios al inicio y final
        .trim();

    return cleaned;
};

/**
 * Convierte HTML a texto plano
 * @param html - El contenido HTML a convertir
 * @returns El texto plano
 */
export const htmlToPlainText = (html: string): string => {
    const tempDiv = document.createElement('div');
    tempDiv.innerHTML = html;
    return tempDiv.textContent || tempDiv.innerText || '';
};

/**
 * Valida si el contenido HTML tiene problemas de espacios
 * @param htmlContent - El contenido HTML a validar
 * @returns true si hay problemas de espacios, false en caso contrario
 */
export const hasSpacingIssues = (htmlContent: string): boolean => {
    if (!htmlContent) return false;

    // Patrones que indican problemas de espacios
    const spacingIssues = [
        />\w/, // Palabra pegada después de etiqueta de cierre
        /\w</, // Palabra pegada antes de etiqueta de apertura
        /[.;:]\w/, // Puntuación pegada a palabra
        /\w[.;:]/, // Palabra pegada a puntuación
        /,\w/, // Coma pegada a palabra
        /\w,/, // Palabra pegada a coma
        /\(\w/, // Paréntesis de apertura pegado a palabra
        /\w\)/, // Palabra pegada a paréntesis de cierre
    ];

    return spacingIssues.some(pattern => pattern.test(htmlContent));
};
