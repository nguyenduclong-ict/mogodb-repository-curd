import { Document, Schema, SchemaTypes } from "mongoose";
import { EntityOptions, FieldType } from "./interface";
import _ from "./utils/lodash";

export function Field(config: FieldType | FieldType[] = { type: String }) {
  return function (target: any, key: any) {
    Reflect.defineMetadata(key, config, target.constructor);
  };
}

export function DeleteDateColumn(config?: FieldType) {
  config = _.defaultsDeep(config, {
    required: false,
    type: SchemaTypes.Date,
    default: null,
    columnType: "deleteDate",
  });

  return Field(config);
}

export function Entity<E = any>(options: EntityOptions<E> = {}) {
  options = {
    autoIndex: true,
    virtualId: true,
    ...options,
  };
  return function (target: any) {
    Reflect.defineMetadata("^options", options, target);
  };
}

export function createSchema<E = any>(EntityClass: any) {
  const schemaDefinition: any = {};
  Reflect.getOwnMetadataKeys(EntityClass).forEach((key: string) => {
    if (!key.startsWith("^"))
      schemaDefinition[key] = Reflect.getOwnMetadata(key, EntityClass);
  });

  const options: EntityOptions = Reflect.getOwnMetadata(
    "^options",
    EntityClass
  );

  const schema = new Schema<Document<E>>(schemaDefinition, options);

  if (options?.virtualId) {
    schema.set("toJSON", {
      virtuals: true,
      transform: (doc: any, converted: any) => {
        converted.id = doc._id;
        delete converted.__v;
        delete converted._id;
      },
    });

    schema.set("toObject", {
      virtuals: true,
      transform: (doc: any, converted: any) => {
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
