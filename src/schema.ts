import { Document, Schema, SchemaOptions, SchemaTypes } from "mongoose";
import { EntityOptions, FieldType } from "./interface";
import * as _ from "lodash";

export function Field(config: FieldType | FieldType[] = { type: String }) {
  return function (target: any, key: any) {
    Reflect.defineMetadata(key, config, target.constructor);
  };
}

export function DeleteDateColumn(config?: FieldType) {
  config = _.defaultsDeep(config, {
    type: SchemaTypes.Date,
    default: null,
    columnType: "deleteDate",
  });

  return Field(config);
}

export function Entity(options: EntityOptions) {
  return function (target: any) {
    Reflect.defineMetadata("^options", options, target);
  };
}

export function createSchema<E = any>(EntityClass: any) {
  const schemaDefinition: any = {};
  Reflect.getMetadataKeys(EntityClass).forEach((key: string) => {
    if (!key.startsWith("^"))
      schemaDefinition[key] = Reflect.getMetadata(key, EntityClass);
  });

  const options: EntityOptions = Reflect.getMetadata("^options", EntityClass);

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

  return schema;
}
