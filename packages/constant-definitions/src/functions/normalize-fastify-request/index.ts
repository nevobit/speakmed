import { NormalizedRequest, RequestInterface } from '../../types/normalized-request';
import { alertOverrideConflict } from '../alert-override-conflict';
import { Logger, MonoContext } from '@repo/core-modules';
import { FastifyRequest } from 'fastify';
type Headers = Record<string, string | string[] | undefined>;

export const normalizeFastifyRequest = <R extends RequestInterface = RequestInterface>({
    method,
    protocol,
    hostname,
    url,
    headers,
    body,
    ip,
    ips,
    params,
    query,
}: FastifyRequest): NormalizedRequest<R> => {
    const logger = MonoContext.getStateValue('logger') as Logger;

    const normalizedHeaders: RequestInterface['Headers'] = (
        headers
    ) ? (
            Object.keys(headers).reduce<RequestInterface["Headers"]>(
                (acc, key) => {
                    if (typeof headers[key] !== 'undefined') {
                        const newAcc = acc as Headers;
                        newAcc[key.toLowerCase()] = headers[key] as string;
                }

                    return acc;
            },
            {} as RequestInterface['Headers']
        )
    ) : (
        {} as RequestInterface['Headers']
    );

    const subdomains =
        ((hostname || '').match(/\./g) || []).length > 1 ? hostname.split('.').slice(0, -2) : [];

    const path = url.split('?')[0];

    alertOverrideConflict(body as Record<string, unknown> || {}, params as Record<string, unknown> || {}, (message) => logger.error(message));

    const newBody = {
        ...((body as Record<string, unknown>) || {}),
        ...((params as Record<string, unknown>) || {}),
    } as unknown as RequestInterface['Body'];

    const newQuery = {
        ...((query as Record<string, unknown>) || {}),
    } as unknown as RequestInterface['Query'];

    return {
        method,
        path: path!,
        headers: normalizedHeaders,
        protocol,
        secure: protocol === 'https',
        hostname,
        subdomains,
        body: newBody,
        query: newQuery,
        url,
        ip: (ips ? ips[0] : ip)!,
    };
};
