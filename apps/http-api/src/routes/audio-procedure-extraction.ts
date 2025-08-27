import { RouteOptions } from 'fastify';
import { extractProceduresFromAudio } from '@repo/business-logic';

const OPENAI_API_KEY = process.env.OPENAI_API_KEY;

export const audioProcedureExtractionRoute: RouteOptions = {
    method: 'POST',
    url: '/api/audio-procedure-extraction',
    schema: {
        response: {
            200: {
                type: 'object',
                properties: {
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
                                priority: { type: 'string', enum: ['Alta', 'Media', 'Baja'] },
                                category: { type: 'string' },
                                preparation: { type: 'string' },
                                followUp: { type: 'string' },
                                additionalNotes: { type: 'string' }
                            }
                        }
                    },
                    summary: {
                        type: 'object',
                        properties: {
                            totalProcedures: { type: 'number' },
                            confidence: { type: 'number' },
                            extractionMethod: { type: 'string' }
                        }
                    },
                    rawText: { type: 'string' }
                }
            },
            400: {
                type: 'object',
                properties: {
                    error: { type: 'string' }
                }
            },
            500: {
                type: 'object',
                properties: {
                    error: { type: 'string' }
                }
            }
        }
    },
    handler: async (request, reply) => {
        if (!OPENAI_API_KEY) {
            return reply.code(500).send({
                error: 'OpenAI API key not configured'
            });
        }

        try {
            // @ts-ignore - Fastify-multipart types
            const dataFile = await request.file();

            if (!dataFile) {
                return reply.code(400).send({
                    error: 'No audio file uploaded'
                });
            }

            // Convertir el archivo a Blob
            const chunks: Buffer[] = [];
            for await (const chunk of dataFile.file) {
                chunks.push(chunk);
            }
            const buffer = Buffer.concat(chunks);
            const blob = new Blob([buffer], { type: dataFile.mimetype });

            // Extraer procedimientos del audio
            const result = await extractProceduresFromAudio(blob, OPENAI_API_KEY);

            return {
                procedures: result.procedures,
                summary: result.summary,
                rawText: result.rawText
            };

        } catch (error: any) {
            console.error('Error in audio procedure extraction:', error);

            return reply.code(500).send({
                error: 'Error al extraer procedimientos del audio',
                detail: error.message
            });
        }
    }
};
