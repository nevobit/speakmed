import { RouteOptions } from 'fastify';
import { MonoContext } from '@repo/core-modules';
import { RouteMethod } from '@repo/constant-definitions';

export const loginRoute: RouteOptions = {
    method: RouteMethod.POST,
    url: '/auth/refresh-token',
    handler: async () => {
        return {
            appVersion: MonoContext.getStateValue('version'),
            status: 'ok',
            uptime: process.uptime(),
        };
    },
};