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
exports.createSchema = exports.Entity = exports.DeleteDateColumn = exports.Field = void 0;
const mongoose_1 = require("mongoose");
const _ = __importStar(require("./utils/lodash"));
function Field(config = { type: String }) {
    return function (target, key) {
        Reflect.defineMetadata(key, config, target.constructor);
    };
}
exports.Field = Field;
function DeleteDateColumn(config) {
    config = _.defaultsDeep(config, {
        required: false,
        type: mongoose_1.SchemaTypes.Date,
        default: null,
        columnType: "deleteDate",
    });
    return Field(config);
}
exports.DeleteDateColumn = DeleteDateColumn;
function Entity(options = {}) {
    options = {
        autoIndex: true,
        virtualId: true,
        ...options,
    };
    return function (target) {
        Reflect.defineMetadata("^options", options, target);
    };
}
exports.Entity = Entity;
function createSchema(EntityClass) {
    const schemaDefinition = {};
    Reflect.getMetadataKeys(EntityClass).forEach((key) => {
        if (!key.startsWith("^"))
            schemaDefinition[key] = Reflect.getMetadata(key, EntityClass);
    });
    const options = Reflect.getMetadata("^options", EntityClass);
    const schema = new mongoose_1.Schema(schemaDefinition, options);
    if (options?.virtualId) {
        schema.set("toJSON", {
            virtuals: true,
            transform: (doc, converted) => {
                converted.id = doc._id;
                delete converted.__v;
                delete converted._id;
            },
        });
        schema.set("toObject", {
            virtuals: true,
            transform: (doc, converted) => {
                converted.id = doc._id;
                delete converted.__v;
                delete converted._id;
            },
        });
    }
    if (options.indexes) {
        options.indexes.forEach((indexSetting) => {
            schema.index(indexSetting.fields, indexSetting.options);
        });
    }
    return schema;
}
exports.createSchema = createSchema;
