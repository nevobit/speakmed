import { RouteOptions } from 'fastify';
import { SettingsSchemaMongo } from '@repo/entities/src/models/settings-mongo';
import mongoose from 'mongoose';

const Settings = mongoose.model('Settings', SettingsSchemaMongo);

export const getSettingsRoute: RouteOptions = {
    method: 'GET',
    url: '/api/settings',
    handler: async (request, reply) => {
        const userId = request.headers['x-user-id'] as string;
        let settings = await Settings.findOne({ userId });
        if (!settings) {
            settings = await Settings.create({ userId });
        }
        return settings;
    },
};

export const updateSettingsRoute: RouteOptions = {
    method: 'PUT',
    url: '/api/settings',
    handler: async (request, reply) => {
        const userId = request.headers['x-user-id'] as string;
        const { perspective, detailLevel, missingInfo, dictionary } = request.body as any;
        const settings = await Settings.findOneAndUpdate(
            { userId },
            { perspective, detailLevel, missingInfo, dictionary },
            { new: true, upsert: true }
        );
        return settings;
    },
}; 