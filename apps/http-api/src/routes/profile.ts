import { RouteOptions } from 'fastify';
import { UserSchemaMongo } from '@repo/entities/src/models/users/user-mongo';
import mongoose from 'mongoose';

const User = mongoose.model('User', UserSchemaMongo);

export const getProfileRoute: RouteOptions = {
    method: 'GET',
    url: '/api/profile',
    handler: async (request, reply) => {
        const userId = request.headers['x-user-id'] as string;
        const user = await User.findOne({ _id: userId });
        if (!user) return reply.code(404).send({ message: 'User not found' });
        return user;
    },
};

export const updateProfileRoute: RouteOptions = {
    method: 'PUT',
    url: '/api/profile',
    handler: async (request, reply) => {
        const userId = request.headers['x-user-id'] as string;
        const update = request.body as any;
        const user = await User.findOneAndUpdate(
            { id: userId },
            update,
            { new: true }
        );
        if (!user) return reply.code(404).send({ message: 'User not found' });
        return user;
    },
}; 