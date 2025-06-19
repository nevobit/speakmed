import axios, {
  AxiosRequestHeaders,
  AxiosRequestConfig,
  AxiosResponse,
} from "axios";
import FunctionQueue, {
  FunctionQueueResult,
  QueueableFunction,
} from "@simplyhexagonal/function-queue";
import { MonoContext } from "@repo/core-modules";

export interface InitApiOptions {
  apiBaseUrl: string;
  apiName: string;
  headers?: AxiosRequestHeaders;
  rateLimitMs?: number;
  timeout?: number;
  maxRetries?: number;
}

export interface GenericApi {
  request: (config: AxiosRequestConfig) => Promise<FunctionQueueResult<unknown>>;
}

export const initApi = async ({
  apiBaseUrl,
  apiName,
  headers,
  rateLimitMs,
  timeout,
  maxRetries,
}: InitApiOptions) => {
  const api = axios.create({
    baseURL: apiBaseUrl,
    headers,
  });

  const requestFn: QueueableFunction<
    AxiosRequestConfig,
    AxiosResponse["data"]
  > = (config: AxiosRequestConfig) => {
    return api.request(config).then(({ data }) => data);
  };

  const requestQ = new FunctionQueue(requestFn, {
    waitTimeBetweenRuns: rateLimitMs || 400,
    getResultTimeout: timeout || 30000,
    maxRetries: maxRetries || 0,
  });

  const request = async (config: AxiosRequestConfig) => {
    const payloadId = await requestQ.queuePayload(config);

    requestQ.processQueue();

    const result = await requestQ.getResult(payloadId);

    return result;
  };

  MonoContext.setState({
    dataSources: {
      ...(MonoContext.getState()["dataSources"] || {}),
      [`${apiName}`]: { request },
    },
  });
};
