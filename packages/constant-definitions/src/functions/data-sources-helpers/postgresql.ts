import { MonoContext } from "@repo/core-modules"
import { DATA_SOURCES_KEY } from "./constants"
import { NodePgDatabase } from "drizzle-orm/node-postgres";
import { sql } from "drizzle-orm";

type QueryResult<T> = T extends Array<infer U> ? U[] : T;

export const getPostgresqlClient = () => {
    const dataSources = MonoContext.getState()[DATA_SOURCES_KEY] as {
        postgresql: NodePgDatabase<Record<string, never>>;
    };

    if (!dataSources.postgresql) throw new Error(`No mssql client found`);
    return dataSources.postgresql;
}

export const getPostgresqlDbRequest = async <T>(query: string): Promise<QueryResult<T>> => {
    const client = await getPostgresqlClient();
    const result = await client.execute(sql.raw(query));
    return result as QueryResult<T>;
}