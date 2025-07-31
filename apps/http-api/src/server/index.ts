import "dotenv/config";
import os from "os";
import fastify from "fastify";
import fastifyCors from "@fastify/cors";
import fastifySwagger from "@fastify/swagger";
import fastifySwaggerUi from "@fastify/swagger-ui";
import fastifyRateLimit from "@fastify/rate-limit";
import fastifyMultipart from "@fastify/multipart";
import {
  ConsoleTransport,
  Logger,
  LoggerTransportName,
  MonoContext,
} from "@repo/core-modules";
import { version, name } from "../../package.json";
import { registerRoutes } from "../routes";
import { initDataSources } from '@repo/data-sources';
import { setLogger } from "@repo/constant-definitions";
import { swaggerOptions, swaggerUiOptions } from "../docs";

const { PORT, HOST, REGION, CORS_ORIGIN, ENVIRONMENT, MONGO_URL } = process.env;

const consoleOptions = {
  transport: LoggerTransportName.CONSOLE,
  options: {
    destination: LoggerTransportName.CONSOLE,
    channelName: LoggerTransportName.CONSOLE,
  },
};

const logger = new Logger({
  optionsByLevel: {
    debug: [consoleOptions],
    info: [consoleOptions],
    warn: [consoleOptions],
    error: [consoleOptions],
    fatal: [consoleOptions],
    all: [consoleOptions],
    raw: [consoleOptions],
  },
  transports: {
    [LoggerTransportName.CONSOLE]: ConsoleTransport,
  },
  appIdentifiers: {
    region: REGION,
    clusterType: "",
    hostname: os.hostname(),
    app: name,
    version: version,
    environment: ENVIRONMENT,
    developer: os.userInfo().username
  },
  catchTransportErrors: true,
  logLevel: "all",

});

const corsOptions = {
  origin: CORS_ORIGIN!.split(","),
};

setLogger(logger);

MonoContext.setState({
  version,
  secret: null,
});

const main = async () => {
  await initDataSources({
    // postgresqldb: {
    //   postgresUrl: DATABASE_URL
    // },
    mongoose: {
      mongoUrl: MONGO_URL
    },

  });

  const server = fastify({
    logger: false,
    bodyLimit: 10 * 1024 * 1024, // 10MB limit for body size
  });

  server.register(fastifyCors, corsOptions);
  server.register(fastifyMultipart, {
    limits: {
      fileSize: 5 * 1024 * 1024, // 5MB limit for file uploads
    },
  });
  server.register(fastifyRateLimit, {
    max: 30,
    timeWindow: "1 minute",
    keyGenerator: (request) => request.ip,
    errorResponseBuilder: (_request, context) => {
      return {
        code: 429,
        error: "Too Many Requests",
        message: `Rate limit exceeded, retry in ${context.after}`,
        date: Date.now(),
        expiresIn: context.after,
      };
    },
  });

  server.register(fastifySwagger, swaggerOptions);
  server.register(fastifySwaggerUi, swaggerUiOptions);

  // server.addHook('preValidation', async (req, reply) => {
  //   const data = await verify({ url: req.routeOptions.url, body: req.body, headers: req.headers, protocol: req.protocol });
  //   if (data?.type == "error") {
  //     reply.send(data.message)
  //   }
  // });

  server.register(
    (instance, _options, next) => {
      registerRoutes(instance);
      next();
    },
  );

  server.listen(
    { port: Number(PORT) || 8000, host: HOST },
    (err, address) => {
      console.log(err, address);
      logger.all(`Server successfully started on: ${address}`, { address });
      logger.info("Press CTRL-c to stop");
    }
  );
};

void main();