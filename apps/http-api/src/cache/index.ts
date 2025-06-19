import { getRedisReadClient, getRedisWriteClient } from '@repo/constant-definitions';

export const getFromCache = async <R>(key: string) => {
    const cache = getRedisReadClient();

    const res = await cache.hget("api-cache", key);

    return res ? (JSON.parse(res) as R) : null;
};

export const setCache = async (key: string, value: unknown) => {
    const cache = getRedisWriteClient();
    
    await cache.hset("api-cache", key, JSON.stringify(value));
};

export const invalidateCache = async (key: string) => {
    const cache = getRedisWriteClient();

    const res = await cache.hdel("api-cache", key);

    if(res < 1) throw new Error("Could not invalidate cache");
};