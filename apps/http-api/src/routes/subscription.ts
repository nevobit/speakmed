import { RouteOptions } from 'fastify';
import { SubscriptionSchemaMongo } from '@repo/entities/src/models/subscription-mongo';
import mongoose from 'mongoose';

const Subscription = mongoose.model('Subscription', SubscriptionSchemaMongo);

export const getSubscriptionRoute: RouteOptions = {
    method: 'GET',
    url: '/api/subscription',
    handler: async (request, reply) => {
        const userId = request.headers['x-user-id'] as string;
        let subscription = await Subscription.findOne({ userId });
        if (!subscription) {
            subscription = await Subscription.create({ userId, plan: 'free', active: true });
        }
        return subscription;
    },
};

export const updateSubscriptionRoute: RouteOptions = {
    method: 'PUT',
    url: '/api/subscription',
    handler: async (request, reply) => {
        const userId = request.headers['x-user-id'] as string;
        const { plan, active } = request.body as any;
        const subscription = await Subscription.findOneAndUpdate(
            { userId },
            { plan, active },
            { new: true, upsert: true }
        );
        return subscription;
    },
}; 