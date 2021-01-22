"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.parseMongoQuery = exports.transformContext = exports.createConnection = exports.createMongoUri = exports.waterFallPromises = void 0;
const mongoose_1 = __importDefault(require("mongoose"));
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
    const conn = mongoose_1.default.createConnection(createMongoUri(uri), options);
    conn.on("connected", () => {
        console.log("*** connection ready", conn.name);
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
function parseMongoQuery(query) {
    if (query.id) {
        query._id = query.id;
        delete query.id;
    }
    return query;
}
exports.parseMongoQuery = parseMongoQuery;
