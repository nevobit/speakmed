import Redis from 'ioredis';
import { MonoContext } from '@repo/core-modules';
import { DATA_SOURCES_KEY } from './constants';

export const getRedisReadClient = () => {
  const dataSources = MonoContext.getState()[DATA_SOURCES_KEY] as {
    redis: {
      read: Redis;
    };
  };

  if (!dataSources.redis.read) throw new Error(`No redis write client found`);

  return dataSources.redis.read;
};

export const getRedisWriteClient = () => {
  const dataSources = MonoContext.getState()[DATA_SOURCES_KEY] as {
    redis: {
      write: Redis;
    };
  };

  if (!dataSources.redis.write) throw new Error(`No redis write client found`);

  return dataSources.redis.write;
};