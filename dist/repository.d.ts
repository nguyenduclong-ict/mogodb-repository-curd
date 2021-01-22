import { Connection, Document, Model } from "mongoose";
import { ContextCreate, ContextCreateMany, ContextUpdate, CustomSchema, ListResponse, RepositoryContext } from "./interface";
declare class RepositoryLocator {
    repositories: Map<string, Map<Connection, Repository<any>>>;
    constructor();
    registerRepository(respository: Repository<any>): void;
    getRepository(name: string, connection: Connection): Repository<any>;
}
export declare const repositoryLocator: RepositoryLocator;
export declare function getObjectId(value: any): any;
export declare class Repository<E extends Document> {
    #private;
    name: string;
    connection: Connection;
    schema: CustomSchema;
    model: Model<E>;
    constructor(connection?: Connection);
    protected get softDeletePaths(): any;
    protected get hasSoftDelete(): boolean;
    protected get ignoreSoftDeleteQuery(): any;
    protected get onlySoftDeleteQuery(): any;
    protected handleQuerySoftDelete(context: any): any;
    protected makeDefaultContextList(context?: RepositoryContext<E>): void;
    protected setOwnerOnUpdate(context: ContextCreate<E>, path?: string): void;
    protected setOwnerOnCreate(context: any, path?: string): void;
    protected cascadeCreateOrUpdate(ctx: ContextCreate): Promise<any>;
    protected cascadeDelete(entity: any, ctx: ContextCreate): Promise<any>;
    list(context?: RepositoryContext<E>): Promise<ListResponse<E>>;
    find(context?: RepositoryContext<E>): Promise<E[]>;
    findOne(context?: RepositoryContext<E>): Promise<E>;
    create(context: ContextCreate<E>): Promise<E>;
    createMany(context?: ContextCreateMany<E>): Promise<E[]>;
    update(context: ContextUpdate<E>): Promise<E[]>;
    updateOne(context: ContextUpdate<E>): Promise<E>;
    delete(context: RepositoryContext<E>): Promise<any>;
    softDelete(context: RepositoryContext<E>): import("mongoose").Query<any, E>;
    restoreSoftDelete(context: RepositoryContext<E>): import("mongoose").Query<any, E>;
    static populate(query: any, populate: any): any;
    static buildPopulate(populate: any): PopulateItem[];
}
interface PopulateItem {
    path?: string;
    select?: string;
    model?: string;
}
export {};
