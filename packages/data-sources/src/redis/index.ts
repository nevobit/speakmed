import { Logger, MonoContext } from "@repo/core-modules";
import { createRedisConnection } from "./connection";

const { REDIS_URL, REDIS_WRITE_URL } = process.env;

export interface InitRedisOptions {
  redisReadUrl?: string;
  redisWriteUrl?: string;
}

export const initRedis = async ({
  redisReadUrl,
  redisWriteUrl,
}: InitRedisOptions) => {
  const logger = MonoContext.getStateValue("logger") as Logger;

  try {
    const readRedis = await createRedisConnection(
      redisReadUrl ?? REDIS_URL ?? "",
      true
    );
    const writeRedis = await createRedisConnection(
      redisWriteUrl ?? REDIS_WRITE_URL ?? ""
    );

    const redis = {
      read: readRedis,
      write: writeRedis,
    };

    MonoContext.setState({
      dataSources: {
        ...(MonoContext.getState()["dataSources"] || {}),
        redis,
      },
    });
  } catch (error) {
    logger.info("Redis connection error", {error});
  }
};
