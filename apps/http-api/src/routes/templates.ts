import { RouteOptions } from 'fastify';
import { TemplateSchemaMongo } from '@repo/entities/src/models/template-mongo';
import mongoose from 'mongoose';
import { getAllTemplates } from '@repo/business-logic';

export const Template = mongoose.model('Template', TemplateSchemaMongo);

export const getTemplatesRoute: RouteOptions = {
    method: 'GET',
    url: '/api/templates',
    handler: async (request, reply) => {
        // const userId = request.headers['x-user-id'] as string;
        const templates = getAllTemplates();
        return templates;
    },
};

export const createTemplateRoute: RouteOptions = {
    method: 'POST',
    url: '/api/templates',
    handler: async (request, reply) => {
        const userId = request.headers['x-user-id'] as string;
        const { name, type, fields } = request.body as any;
        const template = await Template.create({ name, type, fields, userId });
        return template;
    },
};

export const updateTemplateRoute: RouteOptions = {
    method: 'PUT',
    url: '/api/templates/:id',
    handler: async (request, reply) => {
        const { id } = request.params as any;
        const { name, type, fields } = request.body as any;
        const template = await Template.findByIdAndUpdate(id, { name, type, fields }, { new: true });
        return template;
    },
};

export const deleteTemplateRoute: RouteOptions = {
    method: 'DELETE',
    url: '/api/templates/:id',
    handler: async (request, reply) => {
        const { id } = request.params as any;
        await Template.findByIdAndDelete(id);
        return { success: true };
    },
}; 