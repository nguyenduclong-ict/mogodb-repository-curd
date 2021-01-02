"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.transformContext = exports.createConnection = exports.createMongoUri = exports.waterFallPromises = void 0;
const mongoose = require("mongoose");
function waterFallPromises(promises) {
    return promises.reduce((prev, curr) => prev.then((prevResult) => curr(prevResult)), Promise.resolve());
}
exports.waterFallPromises = waterFallPromises;
function createMongoUri(options) {
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
        .replace("{port}", options.port)
        .replace("{dbName}", options.dbName);
    if (options.authSource) {
        uri += "?authSource=" + options.authSource;
    }
    return uri;
}
exports.createMongoUri = createMongoUri;
function createConnection(uri, options) {
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
                transform: (doc, converted) => {
                    converted.id = doc._id;
                    delete converted.__v;
                    delete converted._id;
                },
            });
        });
    });
    return conn;
}
exports.createConnection = createConnection;
function transformContext(context) {
    return {
        new: true,
        ...context.params,
        meta: context.meta,
    };
}
exports.transformContext = transformContext;
