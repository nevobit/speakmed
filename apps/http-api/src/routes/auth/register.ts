import { RouteOptions } from 'fastify';
import { MonoContext } from '@repo/core-modules';
import { RouteMethod } from '@repo/constant-definitions';

export const registerRoute: RouteOptions = {
  method: RouteMethod.POST,
  url: '/auth/register',
  handler: async () => {
    return {
      appVersion: MonoContext.getStateValue('version'),
      status: 'ok',
      uptime: process.uptime(),
    };
  },
};