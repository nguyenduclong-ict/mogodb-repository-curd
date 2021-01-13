import "reflect-metadata";
import { HookAction, HookItem, Trigger } from "./interface";
import { waterFallPromises } from "./utils";

export function getHooks(
  trigger: Trigger,
  action: HookAction,
  self: any
): Function[] {
  const key = `${trigger}${action}`;
  return Reflect.getMetadata(key, self) || [];
}

export function Hook(trigger: Trigger, actions: HookAction[], priority = 0) {
  return function (target: any, methodName: string) {
    actions.forEach((action) => {
      const key = `${trigger}${action}`;
      let hooks: HookItem[] = Reflect.getMetadata(key, target) || [];

      hooks.push({ handler: methodName, priority: priority || hooks.length });
      hooks.sort((a, b) => a.priority - b.priority);

      if (!Reflect.hasMetadata(key, target)) {
        Reflect.defineMetadata(key, hooks, target);
      }
    });
  };
}

export function RepoAction(target: any, key: string, descriptor: any) {
  const originalMethod = descriptor.value;
  descriptor.value = function (context: any = {}, ...args: any[]) {
    return waterFallPromises([
      ...getHooks("before", key, this).map((item: any) => () =>
        this[item.handler].call(this, context)
      ),
      () => originalMethod.call(this, context, ...args),
      ...getHooks("after", key, this).map((item: any) => (response: any) =>
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
