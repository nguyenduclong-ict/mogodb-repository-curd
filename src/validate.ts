import ValidateSchema, { RuleItem, Rules } from "async-validator";
import { isValidObjectId, SchemaTypes } from "mongoose";

const cached = new Map();

export function getValidatorOfEntity(EntityClass: any, useCache = true) {
  if (useCache && cached.get(EntityClass)) {
    return cached.get(EntityClass);
  }

  const entityDefination: any = {};
  Reflect.getMetadataKeys(EntityClass).forEach((key: string) => {
    if (!key.startsWith("^"))
      entityDefination[key] = Reflect.getMetadata(key, EntityClass);
  });

  const descriptor: Rules = {};

  Object.keys(entityDefination).forEach((field: string) => {
    let config = entityDefination[field];

    const rule: RuleItem = {
      required: !!config.required,
    };

    if (Array.isArray(config)) {
      config = config[0];
      rule.defaultField = {};
      initType(rule.defaultField, config);
      rule.type = "array";
      Object.assign(rule, config.arrayValidator || {});
    } else {
      initType(rule, config);
    }

    descriptor[field] = rule;
  });

  cached.set(EntityClass, descriptor);
  return descriptor;
}

function checkRequired(rule: Rules, value: any) {
  let isRequired = Array.isArray(rule)
    ? !!rule.find((r) => r.required)
    : rule.required;
  return isRequired ? !!value : true;
}

function getRequiredMessage(rule: Rules) {
  return (
    (Array.isArray(rule)
      ? rule.find((r) => r.required)?.message
      : rule.message) || rule.fullField + " required"
  );
}

function getErrorMessage(rule: Rules, dfMessage: string) {
  return (Array.isArray(rule) ? rule[0].message : rule.message) || dfMessage;
}

function initType(rule: RuleItem, config: any) {
  if (Array.isArray(config.type)) {
    rule.type = "array";
    rule.defaultField = initType({}, config.type[0]);
  } else {
    switch (config.type) {
      case String:
      case SchemaTypes.String:
        rule.type = "string";
        break;

      case Array:
      case SchemaTypes.Array:
        rule.type = "array";
        break;

      case Boolean:
      case SchemaTypes.Boolean:
        rule.type = "boolean";
        break;

      case Date:
      case SchemaTypes.Date:
        rule.validator = (r, v, cb) => {
          if (!checkRequired(r, v)) {
            return cb(getRequiredMessage(r));
          } else if (new Date(v).toString() !== "Invalid Date") {
            return cb(cb(getErrorMessage(r, r.fullField + " must be Date")));
          }
          cb();
        };
        break;

      case SchemaTypes.ObjectId:
        rule.validator = (r, v, cb) => {
          if (!checkRequired(r, v)) {
            return cb(getRequiredMessage(r));
          } else if (!isValidObjectId(v)) {
            cb(getErrorMessage(r, r.fullField + " must be ObjectId"));
          }
          cb();
        };
        break;

      case Number:
      case SchemaTypes.Number:
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

export function validateEntity(EntityClass: any, value: any, useCache = true) {
  const descriptor = getValidatorOfEntity(EntityClass, useCache);
  const validateSchema = new ValidateSchema(descriptor);

  return new Promise<{
    valid: boolean;
    errors?: { message: string; field: string }[];
    fields?: any;
  }>((resolve) => {
    validateSchema.validate(value, {}, (errors, fields) => {
      if (errors) {
        resolve({ valid: false, errors, fields });
      } else {
        resolve({ valid: true });
      }
    });
  });
}
