import { Connection, Document, Model, Schema } from "mongoose";
import { ContextCreate, ContextCreateMany, ContextUpdate, ListResponse, RepositoryContext } from "./interface";
export declare class Repository<E extends Document> {
    #private;
    name: string;
    connection: Connection;
    schema: Schema;
    model: Model<E>;
    constructor(connection?: Connection);
    private get softDeletePaths();
    private get hasSoftDelete();
    private get ignoreSoftDeleteQuery();
    private get onlySoftDeleteQuery();
    private makeDefaultContextList;
    private makeDefaultContextFindOne;
    private makeDefaultContextUpdate;
    list(context?: RepositoryContext<E>): Promise<ListResponse<E>>;
    find(context?: RepositoryContext<E>): Promise<Document<E>[]>;
    findOne(context?: RepositoryContext<E>): Promise<Document<E>>;
    create(context: ContextCreate<E>): Promise<E>;
    createMany(context?: ContextCreateMany<E>): Promise<E[]>;
    update(context: ContextUpdate<E>): Promise<E[]>;
    updateOne(context: ContextUpdate<E>): Promise<E>;
    delete(context: RepositoryContext<E>): import("mongoose").Query<any, E>;
    softDelete(context: RepositoryContext<E>): import("mongoose").Query<any, E>;
    restoreSoftDelete(context: RepositoryContext<E>): import("mongoose").Query<any, E>;
    protected coreBeforeCreate(context: RepositoryContext<E>): void;
    static populate(query: any, populate: any): any;
    static buildPopulate(populate: any): PopulateItem[];
}
interface PopulateItem {
    path?: string;
    select?: string;
    model?: string;
}
export {};
