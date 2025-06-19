import { FastifyInstance, RouteOptions } from 'fastify';
import { healthCheckRoute } from './health-check';
import { authRoutes } from './auth';

const routes: RouteOptions[] = [
    healthCheckRoute,
    ...authRoutes
]

export const registerRoutes = (fasitfy: FastifyInstance) => {
    routes.map((route) => {
        fasitfy.route(route);
    })
}