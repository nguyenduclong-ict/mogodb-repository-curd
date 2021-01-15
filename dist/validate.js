"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.validateEntity = exports.getValidatorOfEntity = void 0;
const async_validator_1 = __importDefault(require("async-validator"));
const mongoose_1 = require("mongoose");
const cached = new Map();
function getValidatorOfEntity(EntityClass, useCache = true) {
    if (useCache && cached.get(EntityClass)) {
        return cached.get(EntityClass);
    }
    const entityDefination = {};
    Reflect.getOwnMetadataKeys(EntityClass).forEach((key) => {
        if (!key.startsWith("^"))
            entityDefination[key] = Reflect.getOwnMetadata(key, EntityClass);
    });
    const descriptor = {};
    Object.keys(entityDefination).forEach((field) => {
        let config = entityDefination[field];
        const rule = {
            required: !!config.required,
        };
        if (Array.isArray(config)) {
            config = config[0];
            rule.defaultField = {};
            initType(rule.defaultField, config);
            rule.type = "array";
            Object.assign(rule, config.arrayValidator || {});
        }
        else {
            initType(rule, config);
        }
        descriptor[field] = rule;
    });
    cached.set(EntityClass, descriptor);
    return descriptor;
}
exports.getValidatorOfEntity = getValidatorOfEntity;
function checkRequired(rule, value) {
    let isRequired = Array.isArray(rule)
        ? !!rule.find((r) => r.required)
        : rule.required;
    return isRequired ? !!value : true;
}
function getRequiredMessage(rule) {
    return ((Array.isArray(rule)
        ? rule.find((r) => r.required)?.message
        : rule.message) || rule.fullField + " required");
}
function getErrorMessage(rule, dfMessage) {
    return (Array.isArray(rule) ? rule[0].message : rule.message) || dfMessage;
}
function initType(rule, config) {
    if (Array.isArray(config.type)) {
        rule.type = "array";
        rule.defaultField = initType({}, config.type[0]);
    }
    else {
        switch (config.type) {
            case String:
            case mongoose_1.SchemaTypes.String:
                rule.type = "string";
                break;
            case Array:
            case mongoose_1.SchemaTypes.Array:
                rule.type = "array";
                break;
            case Boolean:
            case mongoose_1.SchemaTypes.Boolean:
                rule.type = "boolean";
                break;
            case Date:
            case mongoose_1.SchemaTypes.Date:
                rule.validator = (r, v, cb) => {
                    if (!checkRequired(r, v)) {
                        return cb(getRequiredMessage(r));
                    }
                    else if (new Date(v).toString() !== "Invalid Date") {
                        return cb(cb(getErrorMessage(r, r.fullField + " must be Date")));
                    }
                    cb();
                };
                break;
            case mongoose_1.SchemaTypes.ObjectId:
                rule.validator = (r, v, cb) => {
                    if (!checkRequired(r, v)) {
                        return cb(getRequiredMessage(r));
                    }
                    else if (!mongoose_1.isValidObjectId(v)) {
                        cb(getErrorMessage(r, r.fullField + " must be ObjectId"));
                    }
                    cb();
                };
                break;
            case Number:
            case mongoose_1.SchemaTypes.Number:
                rule.type = "number";
                break;
            default:
                rule.type = "any";
        }
    }
    config.min && (rule.min = config.min);
    config.max && (rule.max = config.max);
    config.enum && (rule.enum = config.enum);
    Object.assign(rule, config.validator || {});
    return rule;
}
function validateEntity(EntityClass, value, useCache = true) {
    const descriptor = getValidatorOfEntity(EntityClass, useCache);
    const validateSchema = new async_validator_1.default(descriptor);
    return new Promise((resolve) => {
        validateSchema.validate(value, {}, (errors, fields) => {
            if (errors) {
                resolve({ valid: false, errors, fields });
            }
            else {
                resolve({ valid: true });
            }
        });
    });
}
exports.validateEntity = validateEntity;
