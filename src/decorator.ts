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

export function Hook(trigger: Trigger, actions: HookAction[], priority = 1) {
  return function (target: any, methodName: string) {
    actions.forEach((action) => {
      const key = `${trigger}${action}`;
      let hooks: HookItem[] = Reflect.getMetadata(key, target) || [];

      hooks.push({ handler: methodName, priority });
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
      ...getHooks("before", key, target).map((item: any) => () =>
        target[item.handler].call(this, context)
      ),
      () => originalMethod.call(this, context, ...args),
      ...getHooks("after", key, target).map((item: any) => (response: any) =>
        target[item.handler].call(this, context, response)
      ),
    ]);
  };
}

export function Inject<T = any>(inject: Partial<T> = {}): any {
  return function (constructor: any) {
    Object.assign(constructor.prototype, inject);
  };
}
