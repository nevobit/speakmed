import { RouteOptions } from 'fastify';
import { readFileSync } from 'node:fs';
import { join } from 'node:path';

const chileList: string[] = JSON.parse(
    readFileSync(join(__dirname, '../../data/vademecum_cl.json'), 'utf8'),
);

const colList: string[] = JSON.parse(
    readFileSync(join(__dirname, '../../data/vademecum_co.json'), 'utf8'),
);

const argList: string[] = JSON.parse(
    readFileSync(join(__dirname, '../../data/vademecum_ar.json'), 'utf8'),
);


const vademecumData: Record<string, string[]> = {
    ARG: argList,
    MEX: colList,
    COL: colList,
    CHL: chileList,
};

export const vademecumRoute: RouteOptions = {
    method: 'GET',
    url: '/api/vademecum',
    handler: async (request, reply) => {
        const { pais } = request.query as { pais?: string };
        if (!pais || !vademecumData[pais]) {
            return reply.code(400).send({ error: 'País no soportado o no especificado' });
        }
        return { medicamentos: vademecumData[pais] };
    },
}; 