"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.createSchema = exports.Entity = exports.DeleteDateColumn = exports.Field = void 0;
const mongoose_1 = require("mongoose");
const _ = require("lodash");
function Field(config = { type: String }) {
    return function (target, key) {
        Reflect.defineMetadata(key, config, target.constructor);
    };
}
exports.Field = Field;
function DeleteDateColumn(config) {
    config = _.defaultsDeep(config, {
        type: mongoose_1.SchemaTypes.Date,
        default: null,
        columnType: "deleteDate",
    });
    return Field(config);
}
exports.DeleteDateColumn = DeleteDateColumn;
function Entity(options) {
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
    return schema;
}
exports.createSchema = createSchema;
