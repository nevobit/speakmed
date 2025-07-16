import { RouteOptions } from 'fastify';

export const descargarExamenRoute: RouteOptions = {
    method: 'GET',
    url: '/api/examenes/:id/descargar',
    handler: async (request, reply) => {
        const { id } = request.params as { id: string };
        // Mock: genera un PDF simple al vuelo
        const pdfBuffer = Buffer.from(`PDF de exámenes médicos para ID: ${id}`);
        reply.header('Content-Type', 'application/pdf');
        reply.header('Content-Disposition', `attachment; filename=examenes_${id}.pdf`);
        return reply.send(pdfBuffer);
    },
};
