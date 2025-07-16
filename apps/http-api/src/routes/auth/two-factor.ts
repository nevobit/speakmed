import { RouteOptions } from 'fastify';
import { MonoContext } from '@repo/core-modules';
import { RouteMethod } from '@repo/constant-definitions';

export const loginRoute: RouteOptions = {
    method: RouteMethod.POST,
    url: '/auth/2fa/generate',
    handler: async () => {
        return {
            appVersion: MonoContext.getStateValue('version'),
            status: 'ok',
            uptime: process.uptime(),
        };
    },
};