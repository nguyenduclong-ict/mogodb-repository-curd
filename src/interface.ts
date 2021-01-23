import { RuleItem } from "async-validator";
import {
  Document,
  DocumentDefinition,
  FilterQuery,
  Schema,
  SchemaOptions,
  SchemaType,
  SchemaTypeOpts,
  UpdateQuery,
} from "mongoose";

export type LiteralUnion<T extends U, U = string> = T | (U & {});
export type HookItem = { handler: string; priority: number };
export type Trigger = "before" | "after";
export type HookAction = LiteralUnion<
  "list" | "find" | "findOne" | "create" | "update" | "delete" | "softDelete"
>;

export interface RepositoryContext<T = any, M = any> extends FindOptions<T> {
  meta?: M & { [x: string]: any };
}

export interface ContextCreate<T = any, M = any>
  extends RepositoryContext<T, M> {
  data?: DocumentDefinition<T>;
}

export interface ContextCreateMany<T = any, M = any>
  extends RepositoryContext<T, M> {
  data?: Array<DocumentDefinition<T>>;
}

export interface ContextUpdate<T = any, M = any>
  extends RepositoryContext<T, M> {
  data?: UpdateQuery<T>;
}

export interface FindOptions<T> {
  query?: FilterQuery<T>;
  populates?:
    | LiteralUnion<
        Exclude<keyof DocumentDefinition<T>, "_id" | "id" | "__v">,
        string | number | symbol
      >[]
    | {
        path: LiteralUnion<
          Exclude<keyof DocumentDefinition<T>, "_id" | "id" | "__v">,
          string | number | symbol
        >;
        select?: string;
        model?: string;
        populate?: FindOptions<T>["populates"];
      }[];
  skip?: number;
  limit?: number;
  page?: number;
  pageSize?: number;
  sort?: string[];
  new?: boolean;
  projection?: any;
  session?: any;
  select?: any;
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
  $rename?: { [x: string]: string };
  $set?: D;
  $setOnInsert?: D;
  $unset?: D;
  $addToSet?: D;
  $pop?: { [x: string]: 1 | -1 };
  $push?: { [K in keyof D]?: any };
  $pushAll?: { [K in keyof D]?: any };
  $each?: D[];
  $position?: number;
  $slice?: number;
  $sort?: { [x: string]: 1 | -1 };
}

export interface ListResponse<D = any> {
  data: D[];
  limit: number;
  skip: number;
  page: number;
  totalPages: number;
  pageSize: number;
  total: number;
}

export type Reference<E extends Document> = Omit<E, keyof Document>;

export type FieldType = (SchemaTypeOpts<any> | Schema | SchemaType) & {
  ref?: string;
  slug?: any;
  validator?: RuleItem;
  arrayValdator?: RuleItem;
  cascade?: boolean;
  cascadeOnCreate?: boolean;
  cascadeOnUpdate?: boolean;
  cascadeOnDelete?: boolean;
};

export interface RepositoryInject {
  connection?: any;
  name?: string;
  model?: any;
  schema?: any;
}

interface IndexOptions {
  background?: boolean;
  expireAfterSeconds?: number;
  hidden?: boolean;
  name?: string;
  partialFilterExpression?: any;
  sparse?: boolean;
  storageEngine?: any;
  unique?: boolean;
  // text index
  weights?: number;
  default_language?: string;
  language_override?: string;
  textIndexVersion?: string;
}

export interface IndexSetting<E> {
  fields: { [K in keyof E]?: 1 | -1 | "text" };
  options?: IndexOptions;
}

export interface CustomSchema extends Schema {
  __options?: EntityOptions;
  __schemaDefinition?: { [x: string]: FieldType };
}

export interface EntityOptions<E = any> extends SchemaOptions {
  virtualId?: boolean;
  indexes?: IndexSetting<E>[];
  owner?: boolean;
}
