import "reflect-metadata";
import { Repository } from "./repository";
import { HookAction, HookItem, Trigger } from "./interface";
import { waterFallPromises } from "./utils";

export function getHooks(
  trigger: Trigger,
  action: HookAction,
  self: any
): Function[] {
  const key = `${trigger}:${action}`;
  const parent = Reflect.getOwnMetadata(key, Repository.prototype) || [];
  const own = Reflect.getOwnMetadata(key, self) || [];
  return parent.concat(own);
}

export function Hook(trigger: Trigger, actions: HookAction[], priority = 0) {
  return function (target: any, methodName: string) {
    actions.forEach((action) => {
      const key = `${trigger}:${action}`;
      let hooks: HookItem[] = Reflect.getOwnMetadata(key, target) || [];
      hooks.push({ handler: methodName, priority: priority || hooks.length });
      hooks.sort((a, b) => a.priority - b.priority);
      Reflect.defineMetadata(key, hooks, target);
    });
  };
}

export function RepoAction(target: any, key: string, descriptor: any) {
  const originalMethod = descriptor.value;
  descriptor.value = function (context: any = {}, ...args: any[]) {
    const self = this.__proto__;
    return waterFallPromises([
      ...getHooks("before", key, self).map((item: any) => () =>
        this[item.handler].call(this, context)
      ),
      () => originalMethod.call(this, context, ...args),
      ...getHooks("after", key, self).map((item: any) => (response: any) =>
        this[item.handler].call(this, context, response)
      ),
    ]);
  };
}

export function Inject<T = any>(inject: Partial<T> = {}): any {
  return function (constructor: any) {
    Object.assign(constructor.prototype, inject);
  };
}
