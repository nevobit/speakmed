import { verifyToken, getUserById } from '@repo/business-logic';
import { RouteMethod, makeFastifyRoute } from '@repo/constant-definitions';

export const getUserByIdRoute = makeFastifyRoute(
  RouteMethod.GET,
  '/user',
  verifyToken,
  async (request, reply) => {
    try {
      const { user } = request as unknown as {
        user: { id: string; iat: number; exp: number };
      };
      if (!user) return;
      const { id } = user;
      const userInfo = await getUserById(id);
      reply.status(200).send(userInfo);
    } catch (err) {
      if (err instanceof Error) {
        reply.status(500).send(err);
      }
    }
  },
);