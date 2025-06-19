import { RouteOptions } from 'fastify';
import { MonoContext } from '@repo/core-modules';

export const healthCheckRoute: RouteOptions = {
  method: 'GET',
  url: '/health-check',
  handler: async () => {

    return {
      appVersion: MonoContext.getStateValue('version'),
      status: 'ok',
      uptime: process.uptime(),
    };
  },
};