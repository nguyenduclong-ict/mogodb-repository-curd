"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.Inject = exports.RepoAction = exports.Hook = exports.getHooks = void 0;
require("reflect-metadata");
const repository_1 = require("./repository");
const utils_1 = require("./utils");
function getHooks(trigger, action, self) {
    const key = `${trigger}:${action}`;
    const parent = Reflect.getOwnMetadata(key, repository_1.Repository.prototype) || [];
    const own = Reflect.getOwnMetadata(key, self) || [];
    return parent.concat(own);
}
exports.getHooks = getHooks;
function Hook(trigger, actions, priority = 0) {
    return function (target, methodName) {
        actions.forEach((action) => {
            const key = `${trigger}:${action}`;
            let hooks = Reflect.getOwnMetadata(key, target) || [];
            hooks.push({ handler: methodName, priority: priority || hooks.length });
            hooks.sort((a, b) => a.priority - b.priority);
            Reflect.defineMetadata(key, hooks, target);
        });
    };
}
exports.Hook = Hook;
function RepoAction(target, key, descriptor) {
    const originalMethod = descriptor.value;
    descriptor.value = function (context = {}, ...args) {
        const self = this.__proto__;
        return utils_1.waterFallPromises([
            ...getHooks("before", key, self).map((item) => () => this[item.handler].call(this, context)),
            () => originalMethod.call(this, context, ...args),
            ...getHooks("after", key, self).map((item) => (response) => this[item.handler].call(this, context, response)),
        ]);
    };
}
exports.RepoAction = RepoAction;
function Inject(inject = {}) {
    return function (constructor) {
        Object.assign(constructor.prototype, inject);
    };
}
exports.Inject = Inject;
