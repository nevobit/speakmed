import { RouteOptions } from 'fastify';
import { extractProceduresFromAudio } from '@repo/business-logic';
import Handlebars from 'handlebars';
import { readFileSync } from 'node:fs';
import { join } from 'node:path';

const OPENAI_API_KEY = process.env.OPENAI_API_KEY;

export const downloadProceduresRecipeRoute: RouteOptions = {
    method: 'POST',
    url: '/api/download-procedures-recipe',
    schema: {
        body: {
            type: 'object',
            properties: {
                reportId: { type: 'string' },
                patientData: {
                    type: 'object',
                    properties: {
                        name: { type: 'string' },
                        age: { type: 'string' },
                        gender: { type: 'string' },
                        id: { type: 'string' }
                    }
                },
                procedures: {
                    type: 'array',
                    items: {
                        type: 'object',
                        properties: {
                            name: { type: 'string' },
                            description: { type: 'string' },
                            instructions: { type: 'string' },
                            frequency: { type: 'string' },
                            duration: { type: 'string' },
                            priority: { type: 'string' },
                            category: { type: 'string' },
                            preparation: { type: 'string' },
                            followUp: { type: 'string' },
                            additionalNotes: { type: 'string' }
                        }
                    }
                },
                audioBlob: { type: 'string' } // Base64 encoded audio
            }
        }
    },
    handler: async (request, reply) => {
        try {
            const { reportId, patientData, procedures: providedProcedures, audioBlob } = request.body as any;

            // Si no se proporcionaron procedimientos específicos y hay audio, extraer del audio
            let procedures = providedProcedures || [];

            if (procedures.length === 0 && audioBlob && OPENAI_API_KEY) {
                try {
                    // Convertir base64 a Blob
                    const audioBuffer = Buffer.from(audioBlob, 'base64');
                    const blob = new Blob([audioBuffer], { type: 'audio/webm' });

                    const audioExtraction = await extractProceduresFromAudio(blob, OPENAI_API_KEY);
                    if (audioExtraction.procedures && audioExtraction.procedures.length > 0) {
                        procedures = audioExtraction.procedures;
                    }
                } catch (error) {
                    console.error('Error extracting procedures from audio:', error);
                }
            }

            // Si aún no hay procedimientos, usar procedimientos de ejemplo
            if (procedures.length === 0) {
                procedures = [
                    {
                        name: 'Sin procedimientos especificados',
                        description: 'Consulte con su médico para procedimientos específicos',
                        instructions: 'Seguir indicaciones médicas',
                        frequency: 'Según indicación',
                        duration: 'Indefinido',
                        priority: 'Media',
                        category: 'Control',
                        preparation: '',
                        followUp: 'Control médico regular',
                        additionalNotes: ''
                    }
                ];
            }

            // Generar HTML de la receta de procedimientos
            const proceduresHtml = generateProceduresRecipeHtml(patientData, procedures, reportId);

            // Configurar headers para descarga
            reply.header('Content-Type', 'text/html');
            reply.header('Content-Disposition', `attachment; filename="receta_procedimientos_${reportId}.html"`);

            return proceduresHtml;

        } catch (error: any) {
            console.error('Error generating procedures recipe:', error);
            return reply.code(500).send({
                error: 'Error al generar la receta de procedimientos',
                detail: error.message
            });
        }
    }
};

function generateProceduresRecipeHtml(patientData: any, procedures: any[], reportId: string): string {
    const template = `
<!DOCTYPE html>
<html lang="es">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>Receta de Procedimientos Médicos</title>
    <style>
        body {
            font-family: 'Arial', sans-serif;
            margin: 0;
            padding: 20px;
            background-color: #f5f5f5;
        }
        .container {
            max-width: 800px;
            margin: 0 auto;
            background: white;
            padding: 30px;
            border-radius: 10px;
            box-shadow: 0 2px 10px rgba(0,0,0,0.1);
        }
        .header {
            text-align: center;
            border-bottom: 3px solid #2c3e50;
            padding-bottom: 20px;
            margin-bottom: 30px;
        }
        .title {
            color: #2c3e50;
            font-size: 28px;
            font-weight: bold;
            margin: 0;
        }
        .subtitle {
            color: #7f8c8d;
            font-size: 16px;
            margin: 10px 0 0 0;
        }
        .patient-info {
            background: #ecf0f1;
            padding: 20px;
            border-radius: 8px;
            margin-bottom: 30px;
        }
        .patient-info h3 {
            color: #2c3e50;
            margin: 0 0 15px 0;
            font-size: 18px;
        }
        .patient-details {
            display: grid;
            grid-template-columns: 1fr 1fr;
            gap: 15px;
        }
        .patient-detail {
            display: flex;
            align-items: center;
        }
        .patient-detail strong {
            color: #34495e;
            margin-right: 10px;
            min-width: 80px;
        }
        .procedures-section {
            margin-bottom: 30px;
        }
        .procedures-section h3 {
            color: #2c3e50;
            font-size: 20px;
            margin-bottom: 20px;
            padding-bottom: 10px;
            border-bottom: 2px solid #3498db;
        }
        .procedure {
            background: #f8f9fa;
            border-left: 4px solid #3498db;
            padding: 20px;
            margin-bottom: 20px;
            border-radius: 0 8px 8px 0;
        }
        .procedure-header {
            display: flex;
            justify-content: space-between;
            align-items: center;
            margin-bottom: 15px;
        }
        .procedure-name {
            font-size: 18px;
            font-weight: bold;
            color: #2c3e50;
        }
        .procedure-priority {
            padding: 5px 12px;
            border-radius: 20px;
            font-size: 12px;
            font-weight: bold;
            text-transform: uppercase;
        }
        .priority-alta {
            background: #e74c3c;
            color: white;
        }
        .priority-media {
            background: #f39c12;
            color: white;
        }
        .priority-baja {
            background: #27ae60;
            color: white;
        }
        .procedure-category {
            color: #7f8c8d;
            font-size: 14px;
            font-style: italic;
        }
        .procedure-description {
            color: #34495e;
            margin-bottom: 15px;
            line-height: 1.6;
        }
        .procedure-details {
            display: grid;
            grid-template-columns: 1fr 1fr;
            gap: 15px;
            margin-bottom: 15px;
        }
        .procedure-detail {
            display: flex;
            align-items: flex-start;
        }
        .procedure-detail strong {
            color: #2c3e50;
            margin-right: 10px;
            min-width: 80px;
            font-size: 14px;
        }
        .procedure-instructions {
            background: #e8f4fd;
            padding: 15px;
            border-radius: 6px;
            border-left: 3px solid #3498db;
        }
        .procedure-instructions strong {
            color: #2c3e50;
            display: block;
            margin-bottom: 8px;
        }
        .procedure-preparation, .procedure-followup, .procedure-notes {
            margin-top: 15px;
            padding: 10px;
            background: #f8f9fa;
            border-radius: 6px;
        }
        .procedure-preparation strong, .procedure-followup strong, .procedure-notes strong {
            color: #2c3e50;
            display: block;
            margin-bottom: 5px;
        }
        .footer {
            margin-top: 40px;
            padding-top: 20px;
            border-top: 2px solid #ecf0f1;
            text-align: center;
            color: #7f8c8d;
            font-size: 14px;
        }
        .doctor-signature {
            margin-top: 30px;
            text-align: right;
        }
        .signature-line {
            border-top: 1px solid #2c3e50;
            width: 200px;
            margin-left: auto;
            margin-top: 40px;
        }
        .signature-text {
            text-align: center;
            margin-top: 5px;
            color: #2c3e50;
            font-size: 14px;
        }
        .date {
            text-align: right;
            color: #7f8c8d;
            font-size: 14px;
            margin-top: 20px;
        }
        @media print {
            body { background: white; }
            .container { box-shadow: none; }
        }
    </style>
</head>
<body>
    <div class="container">
        <div class="header">
            <h1 class="title">Receta de Procedimientos Médicos</h1>
            <p class="subtitle">Instrucciones y Procedimientos para el Paciente</p>
        </div>

        <div class="patient-info">
            <h3>Información del Paciente</h3>
            <div class="patient-details">
                <div class="patient-detail">
                    <strong>Nombre:</strong> {{patientData.name}}
                </div>
                <div class="patient-detail">
                    <strong>Edad:</strong> {{patientData.age}}
                </div>
                <div class="patient-detail">
                    <strong>Género:</strong> {{patientData.gender}}
                </div>
                <div class="patient-detail">
                    <strong>ID:</strong> {{patientData.id}}
                </div>
            </div>
        </div>

        <div class="procedures-section">
            <h3>Procedimientos Médicos Prescritos</h3>
            {{#each procedures}}
            <div class="procedure">
                <div class="procedure-header">
                    <div>
                        <div class="procedure-name">{{name}}</div>
                        <div class="procedure-category">{{category}}</div>
                    </div>
                    <span class="procedure-priority priority-{{lowercase priority}}">{{priority}}</span>
                </div>
                
                <div class="procedure-description">{{description}}</div>
                
                <div class="procedure-details">
                    <div class="procedure-detail">
                        <strong>Frecuencia:</strong> {{frequency}}
                    </div>
                    <div class="procedure-detail">
                        <strong>Duración:</strong> {{duration}}
                    </div>
                </div>
                
                <div class="procedure-instructions">
                    <strong>Instrucciones Específicas:</strong>
                    {{instructions}}
                </div>
                
                {{#if preparation}}
                <div class="procedure-preparation">
                    <strong>Preparación Requerida:</strong>
                    {{preparation}}
                </div>
                {{/if}}
                
                {{#if followUp}}
                <div class="procedure-followup">
                    <strong>Seguimiento:</strong>
                    {{followUp}}
                </div>
                {{/if}}
                
                {{#if additionalNotes}}
                <div class="procedure-notes">
                    <strong>Notas Adicionales:</strong>
                    {{additionalNotes}}
                </div>
                {{/if}}
            </div>
            {{/each}}
        </div>

        <div class="date">
            <strong>Fecha de Emisión:</strong> {{currentDate}}
        </div>

        <div class="doctor-signature">
            <div class="signature-line"></div>
            <div class="signature-text">Firma del Médico</div>
        </div>

        <div class="footer">
            <p>Este documento contiene las instrucciones médicas específicas para el paciente.</p>
            <p>ID de Reporte: {{reportId}}</p>
        </div>
    </div>
</body>
</html>`;

    const compiledTemplate = Handlebars.compile(template);

    // Helper para convertir a minúsculas
    Handlebars.registerHelper('lowercase', function (str) {
        return str ? str.toLowerCase() : '';
    });

    const currentDate = new Date().toLocaleDateString('es-CL', {
        year: 'numeric',
        month: 'long',
        day: 'numeric'
    });

    return compiledTemplate({
        patientData,
        procedures,
        reportId,
        currentDate
    });
}
