import { Document, Schema } from "mongoose";
import { EntityOptions, FieldType } from "./interface";
export declare function Field(config?: FieldType | FieldType[]): (target: any, key: any) => void;
export declare function DeleteDateColumn(config?: FieldType): (target: any, key: any) => void;
export declare function Entity(options: EntityOptions): (target: any) => void;
export declare function createSchema<E = any>(EntityClass: any): Schema<Document<E>, import("mongoose").Model<Document<E>>>;
