import mongoose from "mongoose";
import { RepositoryContext } from "./interface";
export declare function waterFallPromises(promises: any[]): any;
interface UriOption {
    host?: string;
    port?: string | number;
    dbName?: string;
    user?: string;
    pass?: string;
    authSource?: string;
}
export declare function createMongoUri(options: UriOption | string): string;
export declare function createConnection(uri: string | UriOption, options?: mongoose.ConnectionOptions): mongoose.Connection & Promise<mongoose.Connection>;
export declare function transformContext<T = any, M = any>(context: any): RepositoryContext<T, M>;
export {};
