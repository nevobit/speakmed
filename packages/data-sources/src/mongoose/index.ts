import { configureMongoose } from "@repo/constant-definitions";
import { Logger, MonoContext } from "@repo/core-modules";
import mongoose from "mongoose";

export interface InitMongooseOptions {
  mongoUrl?: string;
}

export const initMongoose = async ({ mongoUrl }: InitMongooseOptions) => {
  const logger = MonoContext.getStateValue("logger") as Logger;

  if (!mongoUrl) {
    throw new Error("MongoDB URL is not provided");
  }
  configureMongoose();

  const connection = mongoose.connection;

  connection.on("error", (error: Error) => {
    logger.error(`Error in Mongoose connection: ${JSON.stringify(error)}`);
    throw new Error(JSON.stringify(error));
  });

  connection.on("connected", () => {
    logger.info(`Mongoose: Connected to ${connection.name}`);
  });

  connection.on("reconnectFailed", () => {
    logger.error("Mongoose: DB Connection Lost, retries failed");
  });

  await mongoose.connect(mongoUrl, {
    connectTimeoutMS: 0,
    socketTimeoutMS: 0,
    family: 4,
    autoIndex: process.env.NODE_ENV !== "production",
    readPreference: "nearest",
  });

  MonoContext.setState({
    dataSources: {
      ...(MonoContext.getState()["dataSources"] || {}),
      mongoose,
    },
  });
};
