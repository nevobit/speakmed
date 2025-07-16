import { URL } from "url";
import { Pool } from "pg";
import { drizzle } from "drizzle-orm/node-postgres";
import { Logger, MonoContext } from "@repo/core-modules";

export interface InitPostgresOptions {
  postgresUrl?: string;
}

export const initPostgresDb = async ({
  postgresUrl,
}: InitPostgresOptions): Promise<void> => {
  const logger = MonoContext.getStateValue("logger") as Logger;

  try {
    const parsedPosgresUrl = new URL(postgresUrl || "");

    const config = {
      user: parsedPosgresUrl.username,
      host: parsedPosgresUrl.host,
      password: parsedPosgresUrl.password,
      database: parsedPosgresUrl.pathname.replace(/^\/+|\/$/g, ""),
    };

    const connectionPool = new Pool(config);
    const postgresql = drizzle(connectionPool);
    logger.info("Postgresql successfully connected");

    MonoContext.setState({
      dataSources: {
        ...(MonoContext.getState()["dataSources"] || {}),
        postgresql,
      },
    });
  } catch (error) {
    logger.info('Postgresql connection error');

  }
};
