import { RouteOptions } from 'fastify';
import fs from 'fs';
import path from 'path';

export const descargarRecetaRoute: RouteOptions = {
    method: 'GET',
    url: '/api/recetas/:id/descargar',
    handler: async (request, reply) => {
        const { id } = request.params as { id: string };
        // Mock: genera un PDF simple al vuelo
        const pdfBuffer = Buffer.from(`PDF de receta médica para ID: ${id}`);
        reply.header('Content-Type', 'application/pdf');
        reply.header('Content-Disposition', `attachment; filename=receta_${id}.pdf`);
        return reply.send(pdfBuffer);
    },
}; 