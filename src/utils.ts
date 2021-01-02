import { RepositoryContext } from "./interface";
import * as mongoose from "mongoose";

export function waterFallPromises(promises: any[]) {
  return promises.reduce(
    (prev: any, curr: any) => prev.then((prevResult: any) => curr(prevResult)),
    Promise.resolve()
  );
}

interface UriOption {
  host?: string;
  port?: string | number;
  dbName?: string;
  user?: string;
  pass?: string;
  authSource?: string;
}

export function createMongoUri(options: UriOption | string) {
  if (typeof options === "string") {
    return options;
  }

  options = {
    port: 27017,
    host: "localhost",
    dbName: "admin",
    authSource: options.dbName,
    ...options,
  };

  const str = "mongodb://{username}:{password}@{host}:{port}/{dbName}";
  let uri = str
    .replace("{username}", options.user)
    .replace("{password}", options.pass)
    .replace("{host}", options.host)
    .replace("{port}", options.port as string)
    .replace("{dbName}", options.dbName);

  if (options.authSource) {
    uri += "?authSource=" + options.authSource;
  }

  return uri;
}

export function createConnection(
  uri: string | UriOption,
  options?: mongoose.ConnectionOptions
) {
  options = {
    useNewUrlParser: true,
    useUnifiedTopology: true,
    useCreateIndex: true,
    useFindAndModify: false,
    ...options,
  };

  const conn = mongoose.createConnection(createMongoUri(uri), options);

  conn.on("connected", () => {
    console.log("*** connection ready", conn.name);
    conn.modelNames().forEach((name) => {
      const model = conn.model(name);
      model.schema.set("toJSON", {
        virtuals: true,
        transform: (doc: any, converted: any) => {
          converted.id = doc._id;
          delete converted.__v;
          delete converted._id;
        },
      });
    });
  });

  return conn;
}

export function transformContext<T = any, M = any>(
  context: any
): RepositoryContext<T, M> {
  return {
    new: true,
    ...context.params,
    meta: context.meta,
  };
}
