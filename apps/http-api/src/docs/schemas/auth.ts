export const loginSchema = {
    type: 'object',
    properties: {
        email: { type: 'string' },
    },
    required: ['email']
};

export const userSchema = {
    type: 'object',
    properties: {
        accessToken: { type: 'string' },
        refreshToken: { type: 'string' },
    }
};