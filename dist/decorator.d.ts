import { HookAction, RepositoryInject, Trigger } from "interface";
import "reflect-metadata";
export declare function getHooks(trigger: Trigger, action: HookAction, self: any): Function[];
export declare function Hook(trigger: Trigger, actions: HookAction[], priority?: number): (target: any, methodName: string) => void;
export declare function RepoAction(target: any, key: string, descriptor: any): void;
export declare function Inject<T = RepositoryInject>(inject: T): any;
