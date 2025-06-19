import { Logger, MonoContext } from '@repo/core-modules';
import IORedis, {
  RedisOptions,
} from 'ioredis';
import { URL } from 'url';

export const createRedisConnection = async (
  redisUrl: string,
  readOnly = false,
  forceUsername = false,
) => {
  const logger = MonoContext.getStateValue('logger') as Logger;

  try {
    const url = new URL(redisUrl);

    logger.info('Connecting to redis', {url});

    const redisConnectionOptions: RedisOptions = {
      host: url.hostname ?? 'localhost',
      port: url.port ? parseInt(url.port, 10) : 6379,
      username: !!url.username && forceUsername ? url.username : undefined,
      password: url.password ? url.password : undefined,
      readOnly,
    };

    logger.info('Connecting to redis, using options', {redisConnectionOptions});

    const redis = new IORedis(redisConnectionOptions);

    logger.info('Redis successfully connected');

    return redis;
  } catch (error) {
    logger.error('Redis connection error', {error});
    throw error;
  }
};