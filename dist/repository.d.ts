import { Connection, Document, DocumentDefinition, Model, Schema, UpdateQuery } from "mongoose";
import { ListResponse, RepositoryContext } from "./interface";
export declare class Repository<E extends Document> {
    name: string;
    connection: Connection;
    schema: Schema;
    model: Model<E>;
    vitualId: boolean;
    constructor(connection?: Connection);
    private makeDefaultContextList;
    private makeDefaultContextUpdate;
    list(context?: RepositoryContext<E>): Promise<ListResponse<E>>;
    find(context?: RepositoryContext<E>): Promise<Document<E>[]>;
    findOne(context: RepositoryContext<E>): Promise<Document<E>>;
    create(context?: RepositoryContext<E> & {
        data?: DocumentDefinition<E> | Array<DocumentDefinition<E>>;
    }): Promise<E | E[]>;
    update(context?: RepositoryContext<E> & {
        data?: UpdateQuery<E>;
    }): Promise<E[]>;
    updateOne(context?: RepositoryContext<E> & {
        data?: UpdateQuery<E>;
    }): Promise<E>;
    delete(context?: RepositoryContext<E>): import("mongoose").Query<any, E>;
    softDelete(context?: RepositoryContext<E>): import("mongoose").Query<any, E>;
    restoreSoftDelete(context?: RepositoryContext<E>): import("mongoose").Query<any, E>;
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
