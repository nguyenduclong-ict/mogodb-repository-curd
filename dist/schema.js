"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.createSchema = exports.Entity = exports.DeleteDateColumn = exports.Field = void 0;
const mongoose_1 = require("mongoose");
const lodash_1 = __importDefault(require("./utils/lodash"));
function Field(config = { type: String }) {
    return function (target, key) {
        Reflect.defineMetadata(key, config, target.constructor);
    };
}
exports.Field = Field;
function DeleteDateColumn(config) {
    config = lodash_1.default.defaultsDeep(config, {
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
    Reflect.getOwnMetadataKeys(EntityClass).forEach((key) => {
        if (!key.startsWith("^"))
            schemaDefinition[key] = Reflect.getOwnMetadata(key, EntityClass);
    });
    const options = Reflect.getOwnMetadata("^options", EntityClass);
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
    lodash_1.default.set(schema, "__options", options);
    lodash_1.default.set(schema, "__schemaDefinition", schemaDefinition);
    return schema;
}
exports.createSchema = createSchema;
