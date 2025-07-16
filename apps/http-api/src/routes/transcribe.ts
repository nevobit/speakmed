import { RouteOptions } from 'fastify';
import fs from 'fs';
import path from 'path';
import FormData from 'form-data';
import axios from 'axios';

const OPENAI_API_KEY = process.env.OPENAI_API_KEY;

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
                    language: { type: 'string' }
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

                // Return transcription result
                return {
                    transcript: response.data.text,
                    language: response.data.language || 'es',
                    diarization: [
                        { speaker: 'doctor', text: 'Buenos días, ¿cómo se siente hoy?' },
                        { speaker: 'paciente', text: 'Me siento un poco cansado y con dolor de cabeza.' }
                    ]
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