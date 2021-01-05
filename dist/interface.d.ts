import { Document, DocumentDefinition, FilterQuery, ObjectId, Schema, SchemaOptions, SchemaType, SchemaTypeOpts, UpdateQuery } from "mongoose";
export declare type LiteralUnion<T extends U, U = string> = T | (U & {});
export declare type HookItem = {
    handler: string;
    priority: number;
};
export declare type Trigger = "before" | "after";
export declare type HookAction = LiteralUnion<"list" | "find" | "findOne" | "create" | "update" | "delete" | "softDelete">;
export interface RepositoryContext<T = any, M = any> extends FindOptions<T> {
    meta?: M & {
        [x: string]: any;
    };
}
export interface ContextCreate<T = any, M = any> extends RepositoryContext<T, M> {
    data?: DocumentDefinition<T>;
}
export interface ContextCreateMany<T = any, M = any> extends RepositoryContext<T, M> {
    data?: Array<DocumentDefinition<T>>;
}
export interface ContextUpdate<T = any, M = any> extends RepositoryContext<T, M> {
    data?: UpdateQuery<T>;
}
export interface FindOptions<T> {
    query?: FilterQuery<T>;
    populates?: LiteralUnion<keyof T, string | number | symbol>[] | {
        path: LiteralUnion<keyof T, string | number | symbol>;
        select: string;
        model: string;
    }[];
    skip?: number;
    limit?: number;
    page?: number;
    pageSize?: number;
    sort?: string[];
    new?: boolean;
    projection?: any;
    session?: any;
    /**
     * ignore: return document no softDelete,
     * only: only return document softDeleted,
     * all: return both
     */
    softDelete?: "ignore" | "only" | "all";
}
export interface UpdateOperators<D = any> {
    $currentDate?: boolean;
    $inc?: number;
    $min?: number;
    $max?: number;
    $mul?: number;
    $rename?: {
        [x: string]: string;
    };
    $set?: D;
    $setOnInsert?: D;
    $unset?: D;
    $addToSet?: D;
    $pop?: {
        [x: string]: 1 | -1;
    };
    $push?: {
        [K in keyof D]?: any;
    };
    $pushAll?: {
        [K in keyof D]?: any;
    };
    $each?: D[];
    $position?: number;
    $slice?: number;
    $sort?: {
        [x: string]: 1 | -1;
    };
}
export interface ListResponse<D = any> {
    data: Document<D>[];
    limit: number;
    skip: number;
    page: number;
    totalPages: number;
    pageSize: number;
    total: number;
}
export declare type Reference<T> = Partial<T & ObjectId>;
export declare type FieldType = (SchemaTypeOpts<any> | Schema | SchemaType) & {
    ref?: string;
    slug?: any;
};
export interface RepositoryInject {
    connection?: any;
    name?: string;
    model?: any;
    schema?: any;
}
export interface EntityOptions extends SchemaOptions {
    virtualId?: boolean;
}
