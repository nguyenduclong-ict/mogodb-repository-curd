import { CustomSchema, EntityOptions, FieldType } from "./interface";
export declare function Field(config?: FieldType | FieldType[]): (target: any, key: any) => void;
export declare function DeleteDateColumn(config?: FieldType): (target: any, key: any) => void;
export declare function Entity<E = any>(options?: EntityOptions<E>): (target: any) => void;
export declare function createSchema<E = any>(EntityClass: any): CustomSchema;
