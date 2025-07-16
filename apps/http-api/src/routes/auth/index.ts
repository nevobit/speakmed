import { RouteOptions } from 'fastify';
import { loginRoute } from './login';
import { getUserByIdRoute } from './user';

export const authRoutes: RouteOptions[] = [
  loginRoute,
  getUserByIdRoute
]
