import { RouteOptions } from 'fastify';
import fs from 'fs';
import path from 'path';
// import mongoose from 'mongoose';
// import { UserSchemaMongo } from '@repo/entities/src/models/users/user-mongo';
// import { User } from '@repo/entities/src/models/users/user';

export const vozDoctorRoute: RouteOptions = {
    method: 'POST',
    url: '/api/voz-doctor',
    handler: async (request, reply) => {
        const userId = request.headers['x-user-id'] as string;
        if (!userId) {
            return reply.code(400).send({ error: 'Falta el header x-user-id' });
        }
        // @ts-ignore - Fastify-multipart types
        const dataFile = await request.file();
        if (!dataFile) {
            return reply.code(400).send({ error: 'No se subió ningún archivo de audio' });
        }
        // Crear ruta única para el archivo
        const savePath = path.join('/tmp', `voz-doctor_${Date.now()}_${dataFile.filename}`);
        // Guardar archivo
        await new Promise<void>((resolve, reject) => {
            const writeStream = fs.createWriteStream(savePath);
            dataFile.file.pipe(writeStream);
            writeStream.on('finish', () => resolve());
            writeStream.on('error', (err) => reject(err));
        });
        // Actualizar usuario
        // await User.findOneAndUpdate(
        //     { _id: userId },
        //     { voiceSamplePath: savePath },
        //     { new: true }
        // );
        return { success: true, message: 'Muestra de voz guardada', file: savePath };
    },
};
