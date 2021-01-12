"use strict";
var __createBinding = (this && this.__createBinding) || (Object.create ? (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    Object.defineProperty(o, k2, { enumerable: true, get: function() { return m[k]; } });
}) : (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    o[k2] = m[k];
}));
var __setModuleDefault = (this && this.__setModuleDefault) || (Object.create ? (function(o, v) {
    Object.defineProperty(o, "default", { enumerable: true, value: v });
}) : function(o, v) {
    o["default"] = v;
});
var __importStar = (this && this.__importStar) || function (mod) {
    if (mod && mod.__esModule) return mod;
    var result = {};
    if (mod != null) for (var k in mod) if (k !== "default" && Object.prototype.hasOwnProperty.call(mod, k)) __createBinding(result, mod, k);
    __setModuleDefault(result, mod);
    return result;
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.transformContext = exports.createConnection = exports.createMongoUri = exports.waterFallPromises = void 0;
const mongoose = __importStar(require("mongoose"));
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
