import { RouteOptions } from 'fastify';
import { extractMedicationsFromAudio } from '@repo/business-logic';

const OPENAI_API_KEY = process.env.OPENAI_API_KEY;

export const audioMedicationExtractionRoute: RouteOptions = {
    method: 'POST',
    url: '/api/audio-medication-extraction',
    schema: {
        response: {
            200: {
                type: 'object',
                properties: {
                    medications: {
                        type: 'array',
                        items: {
                            type: 'object',
                            properties: {
                                name: { type: 'string' },
                                dosage: { type: 'string' },
                                form: { type: 'string' },
                                manufacturer: { type: 'string' },
                                type: { type: 'string' },
                                composition: { type: 'string' },
                                instructions: { type: 'string' },
                                startDate: { type: 'string' },
                                additionalNotes: { type: 'string' }
                            }
                        }
                    },
                    summary: {
                        type: 'object',
                        properties: {
                            totalMedications: { type: 'number' },
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

            // Extraer medicamentos del audio
            const result = await extractMedicationsFromAudio(blob, OPENAI_API_KEY);

            return {
                medications: result.medications,
                summary: result.summary,
                rawText: result.rawText
            };

        } catch (error: any) {
            console.error('Error in audio medication extraction:', error);

            return reply.code(500).send({
                error: 'Error al extraer medicamentos del audio',
                detail: error.message
            });
        }
    }
};
