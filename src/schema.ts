import { Document, Schema, SchemaOptions, SchemaTypes } from "mongoose";
import { FieldType } from "./interface";
import * as _ from "lodash";

export function Field(config: FieldType | FieldType[] = { type: String }) {
  return function (target: any, key: any) {
    Reflect.defineMetadata(key, config, target.constructor);
  };
}

export function DeleteDateColumn(config: FieldType) {
  config = _.defaultsDeep({
    type: SchemaTypes.Date,
    default: null,
    columnType: "deleteDate",
  });

  return Field(config);
}

export function Entity(options: SchemaOptions) {
  return function (target: any) {
    Reflect.defineMetadata("^options", options, target);
  };
}

export function createSchema<E = any>(EntityClass: any) {
  const schema: any = {};
  Reflect.getMetadataKeys(EntityClass).forEach((key: string) => {
    if (!key.startsWith("^"))
      schema[key] = Reflect.getMetadata(key, EntityClass);
  });

  const options: SchemaOptions = Reflect.getMetadata("^options", EntityClass);
  return new Schema<Document<E>>(schema, options);
}
