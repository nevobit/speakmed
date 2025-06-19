import StackTrace from 'stacktrace-js';
import { inspect } from 'util';

export enum LoggerTransportName {
  CONSOLE = "console",
  DISCORD = "discord",
}

export type LogLevel =
  | "debug"
  | "info"
  | "warn"
  | "error"
  | "fatal"
  | "all"
  | "raw";

interface LoggerTransportOptions {
  destination: string;
  channelName: string;
}

interface LogEntry {
  timestamp: string;
  level: LogLevel;
  message: string;
  [key: string]: unknown;
}

interface LoggerTransport {
  log(entry: LogEntry): Promise<void>;
}

type TransportConstructor = new (
  options: LoggerTransportOptions
) => LoggerTransport;

interface LoggerOptions {
  optionsByLevel: {
    [K in LogLevel]: Array<{
      transport: LoggerTransportName;
      options: LoggerTransportOptions;
    }>;
  };
  transports: {
    [K in LoggerTransportName]?: TransportConstructor;
  };
  appIdentifiers: {
    region?: string;
    clusterType?: string;
    hostname: string;
    app: string;
    version?: string;
    environment?: string;
    developer?: string;
  };
  catchTransportErrors: boolean;
  logLevel: LogLevel;
}

class Logger {
  private options: LoggerOptions;

  constructor(options: LoggerOptions) {
    this.options = options;
  }

  private async log(
    level: LogLevel,
    message: string,
    meta?: Record<string, unknown>
  ): Promise<void> {
    const timestamp = new Date().toISOString();
    const stack = await StackTrace.get();
    const caller = stack[2];
    const fileName = caller?.fileName;
    const lineNumber = caller?.lineNumber;
    const columnNumber = caller?.columnNumber;

    const logEntry: LogEntry = {
      timestamp,
      level,
      message,
      fileName,
      lineNumber,
      columnNumber,
      ...this.options.appIdentifiers,
      ...(meta || {}),
    };


    this.options.optionsByLevel[level].forEach((transportOption) => {
      const TransportClass = this.options.transports[transportOption.transport];
      if (TransportClass) {
        const transport = new TransportClass(transportOption.options);
        transport.log(logEntry).catch((error) => {
          if (this.options.catchTransportErrors) {
            console.error("Error in transport:", error);
          } else {
            throw error;
          }
        });
      }
    });
  }

  debug(message: string, meta?: Record<string, unknown>): void {
    this.log("debug", message, meta);
  }
  info(message: string, meta?: Record<string, unknown>): void {
    this.log("info", message, meta);
  }
  warn(message: string, meta?: Record<string, unknown>): void {
    this.log("warn", message, meta);
  }
  error(message: string, meta?: Record<string, unknown>): void {
    this.log("error", message, meta);
  }
  fatal(message: string, meta?: Record<string, unknown>): void {
    this.log("fatal", message, meta);
  }
  all(message: string, meta?: Record<string, unknown>): void {
    this.log("all", message, meta);
  }
  raw(message: string, meta?: Record<string, unknown>): void {
    this.log("raw", message, meta);
  }
}

class ConsoleTransport implements LoggerTransport {
  constructor(private options: LoggerTransportOptions) {}

  async log(entry: LogEntry): Promise<void> {
    const { timestamp, level, message, fileName, lineNumber, columnNumber, ...meta } = entry;
    const information = {
      timestamp,
      level: `[${level.toUpperCase()}]`,
      message,
      fileName: `${fileName}:${lineNumber}:${columnNumber}`
    }
    if (Object.keys(meta).length) {
      console.log(inspect({...information, ...meta}, { colors: true, depth: null,  sorted: true }));
    }else{
      console.log(inspect(information, { colors: true, depth: null, sorted: true }));
    }
    console.log('\n'); 
  }
}

export { Logger, ConsoleTransport };
