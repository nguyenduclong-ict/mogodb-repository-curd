"use strict";
var __createBinding = (this && this.__createBinding) || (Object.create ? (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    Object.defineProperty(o, k2, { enumerable: true, get: function() { return m[k]; } });
}) : (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    o[k2] = m[k];
}));
var __setModuleDefault = (this && this.__setModuleDefault) || (Object.create ? (function(o, v) {
    Object.defineProperty(o, "default", { enumerable: true, value: v });
}) : function(o, v) {
    o["default"] = v;
});
var __decorate = (this && this.__decorate) || function (decorators, target, key, desc) {
    var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
    if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);
    else for (var i = decorators.length - 1; i >= 0; i--) if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
    return c > 3 && r && Object.defineProperty(target, key, r), r;
};
var __importStar = (this && this.__importStar) || function (mod) {
    if (mod && mod.__esModule) return mod;
    var result = {};
    if (mod != null) for (var k in mod) if (k !== "default" && Object.prototype.hasOwnProperty.call(mod, k)) __createBinding(result, mod, k);
    __setModuleDefault(result, mod);
    return result;
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.Repository = void 0;
const decorator_1 = require("./decorator");
const _ = __importStar(require("./utils/lodash"));
class Repository {
    constructor(connection) {
        this.connection = connection || this.connection;
        if (!this.name) {
            this.name = this.constructor.name.replace(/Repository$/, "");
        }
        if (this.connection.modelNames().includes(this.name)) {
            this.connection.deleteModel(this.name);
        }
        this.model = this.connection.model(this.name, this.schema);
        this.#cached = {
            softDeletePaths: _.memoize((shema) => {
                return _.pickBy(this.schema.paths, (value) => _.get(value, "options.columnType") === "deleteDate");
            }),
            ignoreSoftDeleteQuery: _.memoize((schema) => {
                const queryIgnore = {};
                const deleteDatePaths = _.pickBy(schema.paths, (value) => _.get(value, "options.columnType") === "deleteDate");
                Object.keys(deleteDatePaths).forEach((key) => {
                    _.set(queryIgnore, key, null);
                });
                return queryIgnore;
            }),
            onlySoftDeleteQuery: _.memoize((schema) => {
                const queryOnly = {};
                const deleteDatePaths = _.pickBy(this.schema.paths, (value) => _.get(value, "options.columnType") === "deleteDate");
                Object.keys(deleteDatePaths).forEach((key) => {
                    _.set(queryOnly, key, { $type: "date" });
                });
                return queryOnly;
            }),
        };
    }
    #cached;
    // Soft delete query
    get softDeletePaths() {
        return this.#cached.softDeletePaths(this.schema);
    }
    get hasSoftDelete() {
        return !_.isEmpty(this.softDeletePaths);
    }
    get ignoreSoftDeleteQuery() {
        return this.#cached.ignoreSoftDeleteQuery(this.schema);
    }
    get onlySoftDeleteQuery() {
        return this.#cached.onlySoftDeleteQuery(this.schema);
    }
    // End soft delete only
    makeDefaultContextList(context = {}) {
        context.page = context.page || 1;
        context.pageSize = context.pageSize || 100;
        context.limit = context.limit || context.pageSize;
        context.skip = context.skip || context.limit * (context.page - 1);
        context.softDelete = this.hasSoftDelete
            ? context.softDelete ?? "ignore"
            : undefined;
    }
    makeDefaultContextFindOne(context = {}) {
        context.softDelete = this.hasSoftDelete
            ? context.softDelete ?? "ignore"
            : undefined;
    }
    makeDefaultContextUpdate(context = {}) {
        context.new = context.new ?? true;
    }
    async list(context = {}) {
        // Ignore soft delete document
        if (context.softDelete === "ignore") {
            context.query = {
                $and: [context.query || {}, this.ignoreSoftDeleteQuery],
            };
        }
        if (context.softDelete === "only") {
            context.query = {
                $and: [context.query || {}, this.onlySoftDeleteQuery],
            };
        }
        const [data, counts] = await Promise.all([
            Repository.populate(this.model.find(context.query, undefined, _.pick(context, [
                "skip",
                "limit",
                "projection",
                "sort",
                "session",
            ])), context.populates),
            this.model.countDocuments(context.query),
        ]);
        return {
            data,
            limit: context.limit,
            skip: context.skip,
            page: context.page,
            totalPages: Math.ceil(counts / (context.limit || 10)),
            pageSize: context.pageSize,
            total: counts,
        };
    }
    async find(context = {}) {
        // Ignore soft delete document
        if (context.softDelete === "ignore") {
            context.query = {
                $and: [context.query || {}, this.ignoreSoftDeleteQuery],
            };
        }
        if (context.softDelete === "only") {
            context.query = {
                $and: [context.query || {}, this.onlySoftDeleteQuery],
            };
        }
        return this.model.find(context.query, undefined, _.omitBy(_.pick(context, [
            "populate",
            "skip",
            "limit",
            "projection",
            "sort",
            "session",
        ]), _.isNil));
    }
    findOne(context = {}) {
        // Ignore soft delete document
        if (context.softDelete === "ignore") {
            context.query = {
                $and: [context.query || {}, this.ignoreSoftDeleteQuery],
            };
        }
        if (context.softDelete === "only") {
            context.query = {
                $and: [context.query || {}, this.onlySoftDeleteQuery],
            };
        }
        return Repository.populate(this.model.findOne(context.query, undefined, _.omitBy(_.pick(context, ["projection", "session"]), _.isNil)), context.populates);
    }
    create(context) {
        let options = _.omitBy({ session: context.session }, _.isNil);
        options = _.isEmpty(options) ? undefined : options;
        return this.model.create(context.data, options);
    }
    createMany(context = {}) {
        let options = _.omitBy({ session: context.session }, _.isNil);
        options = _.isEmpty(options) ? undefined : options;
        return this.model.create(context.data, options);
    }
    update(context) {
        if (context.new) {
            return this.model
                .find(context.query, undefined, { projection: "id" })
                .then((docs) => this.model
                .updateMany(context.query, context.data)
                .then(() => Repository.populate(this.model.find({
                _id: docs.map((doc) => doc.id),
            }, undefined, _.omitBy(_.pick(context, ["projection", "session", "new"]), _.isNil)), context.populates)));
        }
        else {
            return this.model.updateMany(context.query, context.data, _.omitBy({ session: context.session }, _.isNil));
        }
    }
    updateOne(context) {
        return Repository.populate(this.model.findOneAndUpdate(context.query, context.data, _.omitBy(_.pick(context, ["projecton", "session", "new"]), _.isNil)), context.populates);
    }
    delete(context) {
        return this.model.deleteMany(context.query, _.omitBy({ session: context.session }, _.isNil));
    }
    softDelete(context) {
        const deleteDatePaths = _.pickBy(this.schema.paths, (value) => _.get(value, "options.columnType") === "deleteDate");
        if (_.isEmpty(deleteDatePaths)) {
            throw new Error("Cannot find at least field typeof deleteDate");
        }
        const update = {};
        Object.keys(deleteDatePaths).forEach((key) => {
            _.set(update, "$currentDate." + key, true);
        });
        return this.model.updateMany(context.query, update, { new: true });
    }
    restoreSoftDelete(context) {
        const deleteDatePaths = _.pickBy(this.schema.paths, (value) => _.get(value, "options.columnType") === "deleteDate");
        if (_.isEmpty(deleteDatePaths)) {
            throw new Error("Cannot find at least field typeof deleteDate");
        }
        const update = {};
        Object.keys(deleteDatePaths).forEach((key) => {
            _.set(update, key, null);
        });
        return this.model.updateMany(context.query, update, { new: true });
    }
    coreBeforeCreate(context) {
        if (this.model.schema.path("createdBy") && _.has(context, "meta.user")) {
            _.set(context, "data.createdBy", context.meta.user.id);
            _.set(context, "data.updatedBy", context.meta.user.id);
        }
    }
    static populate(query, populate) {
        if (populate) {
            const populateData = this.buildPopulate(populate);
            populateData.forEach((item) => {
                query.populate(item);
            });
        }
        return query;
    }
    static buildPopulate(populate) {
        if (!Array.isArray(populate)) {
            populate = populate.split(",");
        }
        populate = populate.map((item) => {
            if (typeof item === "string") {
                let [path, select, model] = item.split(":");
                path = path || undefined;
                select = select || undefined;
                model = model || undefined;
                if (path.includes(".")) {
                    const subs = path.split(".");
                    item = {};
                    subs.reduce((e, key, index) => {
                        e.path = key;
                        if (index < subs.length - 1) {
                            e.populate = {};
                            return e.populate;
                        }
                        else {
                            if (select) {
                                e.select = select;
                            }
                            if (model) {
                                e.model = model;
                            }
                            return e;
                        }
                    }, item);
                    return item;
                }
                else {
                    return _.omitBy({ path, select, model }, _.isNil);
                }
            }
            else {
                return item;
            }
        });
        return populate;
    }
}
__decorate([
    decorator_1.Hook("before", ["list", "find"], -1)
], Repository.prototype, "makeDefaultContextList", null);
__decorate([
    decorator_1.Hook("before", ["findOne"], -1)
], Repository.prototype, "makeDefaultContextFindOne", null);
__decorate([
    decorator_1.Hook("before", ["update", "updateOne"], -1)
], Repository.prototype, "makeDefaultContextUpdate", null);
__decorate([
    decorator_1.RepoAction
], Repository.prototype, "list", null);
__decorate([
    decorator_1.RepoAction
], Repository.prototype, "find", null);
__decorate([
    decorator_1.RepoAction
], Repository.prototype, "findOne", null);
__decorate([
    decorator_1.RepoAction
], Repository.prototype, "create", null);
__decorate([
    decorator_1.RepoAction
], Repository.prototype, "createMany", null);
__decorate([
    decorator_1.RepoAction
], Repository.prototype, "update", null);
__decorate([
    decorator_1.RepoAction
], Repository.prototype, "updateOne", null);
__decorate([
    decorator_1.RepoAction
], Repository.prototype, "delete", null);
__decorate([
    decorator_1.RepoAction
], Repository.prototype, "softDelete", null);
__decorate([
    decorator_1.RepoAction
], Repository.prototype, "restoreSoftDelete", null);
__decorate([
    decorator_1.Hook("before", ["create"], -1)
], Repository.prototype, "coreBeforeCreate", null);
exports.Repository = Repository;
