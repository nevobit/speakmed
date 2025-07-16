import { RouteOptions } from 'fastify';
import { ReportSchemaMongo } from '@repo/entities/src/models/report-mongo';
import { TemplateSchemaMongo } from '@repo/entities/src/models/template-mongo';
import mongoose from 'mongoose';
import Handlebars from 'handlebars';
import { createReport, getAllReports, getReportById, getTemplateById } from '@repo/business-logic';
import axios from 'axios';

const Report = mongoose.model('Report', ReportSchemaMongo);
const OPENAI_API_KEY = process.env.OPENAI_API_KEY;

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

Formatea el resultado en HTML con etiquetas apropiadas para una presentación profesional. Usa un lenguaje médico apropiado pero comprensible.

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

        return response.data.choices[0].message.content;
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

        return response.data.choices[0].message.content.trim();
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