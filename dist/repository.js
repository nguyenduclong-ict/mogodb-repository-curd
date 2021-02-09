"use strict";
var __decorate = (this && this.__decorate) || function (decorators, target, key, desc) {
    var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
    if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);
    else for (var i = decorators.length - 1; i >= 0; i--) if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
    return c > 3 && r && Object.defineProperty(target, key, r), r;
};
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.Repository = exports.getObjectId = exports.repositoryLocator = void 0;
const mongoose_1 = require("mongoose");
const decorator_1 = require("./decorator");
const utils_1 = require("./utils");
const lodash_1 = __importDefault(require("./utils/lodash"));
class RepositoryLocator {
    constructor() {
        this.repositories = new Map();
    }
    registerRepository(respository) {
        const locator = this.repositories.get(respository.name) ||
            this.repositories.set(respository.name, new Map()).get(respository.name);
        locator.set(respository.connection, respository);
    }
    getRepository(name, connection) {
        return this.repositories.get(name)?.get(connection);
    }
}
exports.repositoryLocator = new RepositoryLocator();
function getObjectId(value) {
    if (mongoose_1.isValidObjectId(value))
        return value;
    if (mongoose_1.isValidObjectId(value?.id))
        return value.id;
    if (mongoose_1.isValidObjectId(value?._id))
        return value._id;
    return false;
}
exports.getObjectId = getObjectId;
class Repository {
    constructor(connection) {
        this.hooks = {
            before: {},
            after: {},
        };
        this.connection = connection || this.connection;
        if (!this.name) {
            this.name = this.constructor.name.replace(/Repository$/, "");
        }
        this.model =
            this.connection.models[this.name] ||
                this.connection.model(this.name, this.schema);
        this.#cached = {
            softDeletePaths: lodash_1.default.memoize((shema) => {
                return lodash_1.default.pickBy(this.schema.paths, (value) => lodash_1.default.get(value, "options.columnType") === "deleteDate");
            }),
            ignoreSoftDeleteQuery: lodash_1.default.memoize((schema) => {
                const queryIgnore = {};
                const deleteDatePaths = lodash_1.default.pickBy(schema.paths, (value) => lodash_1.default.get(value, "options.columnType") === "deleteDate");
                Object.keys(deleteDatePaths).forEach((key) => {
                    lodash_1.default.set(queryIgnore, key, null);
                });
                return queryIgnore;
            }),
            onlySoftDeleteQuery: lodash_1.default.memoize((schema) => {
                const queryOnly = {};
                const deleteDatePaths = lodash_1.default.pickBy(this.schema.paths, (value) => lodash_1.default.get(value, "options.columnType") === "deleteDate");
                Object.keys(deleteDatePaths).forEach((key) => {
                    lodash_1.default.set(queryOnly, key, { $type: "date" });
                });
                return queryOnly;
            }),
        };
        exports.repositoryLocator.registerRepository(this);
    }
    #cached;
    // Soft delete query
    get softDeletePaths() {
        return this.#cached.softDeletePaths(this.schema);
    }
    get hasSoftDelete() {
        return !lodash_1.default.isEmpty(this.softDeletePaths);
    }
    get ignoreSoftDeleteQuery() {
        return this.#cached.ignoreSoftDeleteQuery(this.schema);
    }
    get onlySoftDeleteQuery() {
        return this.#cached.onlySoftDeleteQuery(this.schema);
    }
    handleQuerySoftDelete(context) {
        if (!this.hasSoftDelete)
            return context;
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
        return context;
    }
    makeDefaultContextList(context = {}) {
        context.page = context.page || 1;
        context.pageSize = context.pageSize || 100;
        context.limit = context.limit || context.pageSize;
        context.skip = context.skip || context.limit * (context.page - 1);
    }
    setOwnerOnUpdate(context, path = "data") {
        if (this.schema.__options.owner &&
            this.model.schema.path("updatedBy") &&
            lodash_1.default.has(context, "meta.user")) {
            lodash_1.default.set(context, path + ".updatedBy", context.meta.user.id);
        }
    }
    setOwnerOnCreate(context, path = "data") {
        if (this.schema.__options.owner &&
            this.model.schema.path("createdBy") &&
            lodash_1.default.has(context, "meta.user")) {
            lodash_1.default.set(context, path + ".createdBy", context.meta.user.id);
            lodash_1.default.set(context, path + ".updatedBy", context.meta.user.id);
        }
    }
    async cascadeCreateOrUpdate(ctx) {
        const data = ctx.data;
        const cascadeTasks = [];
        const getReferenceModel = async (options) => {
            if (options.ref)
                return options.ref;
            if (options.refPath) {
                let refPath = lodash_1.default.get(data, options.refPath);
                if (!refPath && getObjectId(data))
                    refPath = lodash_1.default.get(await this.model.findById(getObjectId(data)), options.refPath);
            }
        };
        const handleCascade = (path, options, fieldValue) => {
            const objectId = getObjectId(fieldValue);
            if (!(options.cascade ?? true))
                return; // ignore if cascade false
            if (getObjectId(data) && !(options.cascadeOnUpdate ?? true))
                return; // ignore cascade on update
            if (!getObjectId(data) && !(options.cascadeOnCreate ?? true))
                return; // ignore cascade on create
            if (mongoose_1.isValidObjectId(fieldValue))
                return; // ignore if fieldValue is ObjectIs
            if (getObjectId(fieldValue)) {
                // update sub document
                cascadeTasks.push(async () => {
                    const modelName = await getReferenceModel(options);
                    if (modelName) {
                        await exports.repositoryLocator
                            .getRepository(modelName, this.connection)
                            ?.updateOne({
                            query: { _id: objectId },
                            data: fieldValue,
                            ...lodash_1.default.pick(ctx, "meta", "session", "new"),
                        });
                        lodash_1.default.set(data, path, objectId);
                    }
                });
            }
            else {
                // create sub document
                cascadeTasks.push(async () => {
                    const modelName = await getReferenceModel(options);
                    if (modelName) {
                        const doc = await exports.repositoryLocator
                            .getRepository(modelName, this.connection)
                            ?.create({
                            data: fieldValue,
                            ...lodash_1.default.pick(ctx, "meta", "session"),
                        });
                        lodash_1.default.set(data, path, doc.id);
                    }
                });
            }
        };
        this.schema.eachPath((path, type) => {
            let fieldValue;
            if (type.instance === "ObjectID" && (fieldValue = lodash_1.default.get(data, path))) {
                if (type.options.cascade) {
                    handleCascade(path, type.options, fieldValue);
                }
                else {
                    lodash_1.default.set(data, path, getObjectId(fieldValue));
                }
                return;
            }
            // Array refs
            if (type.instance === "Array" &&
                type.caster.instance === "ObjectID" &&
                Array.isArray((fieldValue = lodash_1.default.get(data, path)))) {
                const options = { ...type.options, ...type.caster.options };
                if (options.cascade) {
                    fieldValue.forEach((item, index) => handleCascade(path + "." + index, options, item));
                }
                else {
                    fieldValue.forEach((item, index) => lodash_1.default.set(data, path + "." + index, getObjectId(item)));
                }
            }
        });
        await Promise.all(cascadeTasks.map((t) => t()));
        return data;
    }
    async cascadeDelete(entity, ctx) {
        const data = entity;
        const cascadeTasks = [];
        const getReferenceModel = async (options) => {
            if (options.ref)
                return options.ref;
            if (options.refPath) {
                let refPath = lodash_1.default.get(data, options.refPath);
                if (!refPath && getObjectId(data))
                    refPath = lodash_1.default.get(await this.model.findById(getObjectId(data)), options.refPath);
            }
        };
        const handleCascade = (options, fieldValue) => {
            if (!(options.cascade ?? true))
                return; // ignore if cascade false
            if (!(options.cascadeOnDelete ?? true))
                return; // ignore cascade on create
            if (!mongoose_1.isValidObjectId(fieldValue) && !Array.isArray(fieldValue))
                return; // ignore if fieldValue is not is ObjectId
            if (getObjectId(fieldValue)) {
                // update sub document
                cascadeTasks.push(async () => {
                    const modelName = await getReferenceModel(options);
                    if (modelName) {
                        return exports.repositoryLocator
                            .getRepository(modelName, this.connection)
                            ?.delete({
                            query: { _id: fieldValue },
                            ...lodash_1.default.pick(ctx, "meta", "session"),
                        });
                    }
                });
            }
        };
        this.schema.eachPath((path, type) => {
            let fieldValue;
            if (type.instance === "ObjectID" && (fieldValue = lodash_1.default.get(data, path))) {
                handleCascade(type, fieldValue);
                return;
            }
            // Array refs
            if (type.instance === "Array" &&
                type.caster.instance === "ObjectID" &&
                Array.isArray((fieldValue = lodash_1.default.get(data, path)))) {
                const options = { ...type.options, ...type.caster.options };
                handleCascade(options, fieldValue);
            }
        });
        await Promise.all(cascadeTasks.map((t) => t()));
        return data;
    }
    async list(context = {}) {
        utils_1.parseMongoQuery(context.query);
        this.handleQuerySoftDelete(context);
        this.makeDefaultContextList(context); // defaultContextList
        const queryBuilder = this.model.find(context.query, undefined, lodash_1.default.omitBy(lodash_1.default.pick(context, ["skip", "limit", "projection", "sort", "session"]), lodash_1.default.isNil));
        Repository.populate(queryBuilder, context.populates);
        if (context.select) {
            queryBuilder.select(context.select);
        }
        const [data, counts] = await Promise.all([
            queryBuilder.exec(),
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
        utils_1.parseMongoQuery(context.query);
        this.handleQuerySoftDelete(context);
        this.makeDefaultContextList(context); // defaultContextList
        const queryBuilder = this.model.find(context.query, undefined, lodash_1.default.omitBy(lodash_1.default.pick(context, ["skip", "limit", "projection", "sort", "session"]), lodash_1.default.isNil));
        Repository.populate(queryBuilder, context.populates);
        if (context.select) {
            queryBuilder.select(context.select);
        }
        return queryBuilder.exec();
    }
    findOne(context = {}) {
        utils_1.parseMongoQuery(context.query);
        this.handleQuerySoftDelete(context);
        const queryBuilder = this.model.findOne(context.query, undefined, lodash_1.default.omitBy(lodash_1.default.pick(context, ["projection", "session"]), lodash_1.default.isNil));
        Repository.populate(queryBuilder, context.populates);
        if (context.select) {
            queryBuilder.select(context.select);
        }
        return queryBuilder.exec();
    }
    async create(context) {
        let options = lodash_1.default.omitBy({ session: context.session }, lodash_1.default.isNil);
        options = lodash_1.default.isEmpty(options) ? undefined : options;
        this.setOwnerOnCreate(context);
        await this.cascadeCreateOrUpdate(context);
        return this.model.create(context.data, options).then((doc) => {
            if (context.populates?.length) {
                return Repository.populate(this.model.findById(doc.id), context.populates);
            }
            return doc;
        });
    }
    async createMany(context = {}) {
        let options = lodash_1.default.omitBy({ session: context.session }, lodash_1.default.isNil);
        options = lodash_1.default.isEmpty(options) ? undefined : options;
        const cascadeTasks = [];
        if (Array.isArray(context.data)) {
            context.data?.forEach((item, index) => {
                this.setOwnerOnCreate(context, `data.${index}`);
                cascadeTasks.push(this.cascadeCreateOrUpdate({ ...context, data: context.data[index] }));
            });
        }
        else {
            this.setOwnerOnCreate(context, "data");
            cascadeTasks.push(this.cascadeCreateOrUpdate(context));
        }
        await Promise.all(cascadeTasks);
        return this.model.create(context.data, options);
    }
    async update(context) {
        context.new = context.new ?? true;
        utils_1.parseMongoQuery(context.query);
        this.setOwnerOnUpdate(context);
        await this.cascadeCreateOrUpdate(context);
        if (context.new) {
            return this.model
                .find(context.query, undefined, { projection: "id" })
                .then((docs) => this.model
                .updateMany(context.query, context.data)
                .then(() => Repository.populate(this.model.find({
                _id: docs.map((doc) => doc.id),
            }, undefined, lodash_1.default.omitBy(lodash_1.default.pick(context, ["projection", "session", "new"]), lodash_1.default.isNil)), context.populates)));
        }
        else {
            return this.model.updateMany(context.query, context.data, lodash_1.default.omitBy({ session: context.session }, lodash_1.default.isNil));
        }
    }
    async updateOne(context) {
        context.new = context.new ?? true;
        utils_1.parseMongoQuery(context.query);
        this.setOwnerOnUpdate(context);
        await this.cascadeCreateOrUpdate(context);
        return Repository.populate(this.model.findOneAndUpdate(context.query, context.data, lodash_1.default.omitBy(lodash_1.default.pick(context, ["projecton", "session", "new"]), lodash_1.default.isNil)), context.populates);
    }
    async delete(context) {
        utils_1.parseMongoQuery(context.query);
        const entites = await this.model.find(context.query);
        const result = await this.model.deleteMany(context.query, lodash_1.default.omitBy({ session: context.session }, lodash_1.default.isNil));
        try {
            await Promise.all(entites.map((entity) => this.cascadeDelete(entity, context)));
        }
        catch (error) {
            console.log(this.name, "cascade delete error", error);
        }
        return result;
    }
    softDelete(context) {
        utils_1.parseMongoQuery(context.query);
        const deleteDatePaths = lodash_1.default.pickBy(this.schema.paths, (value) => lodash_1.default.get(value, "options.columnType") === "deleteDate");
        if (lodash_1.default.isEmpty(deleteDatePaths)) {
            throw new Error("Cannot find at least field typeof deleteDate");
        }
        const update = {};
        Object.keys(deleteDatePaths).forEach((key) => {
            lodash_1.default.set(update, "$currentDate." + key, true);
        });
        return this.model.updateMany(context.query, update, { new: true });
    }
    restoreSoftDelete(context) {
        utils_1.parseMongoQuery(context.query);
        const deleteDatePaths = lodash_1.default.pickBy(this.schema.paths, (value) => lodash_1.default.get(value, "options.columnType") === "deleteDate");
        if (lodash_1.default.isEmpty(deleteDatePaths)) {
            throw new Error("Cannot find at least field typeof deleteDate");
        }
        const update = {};
        Object.keys(deleteDatePaths).forEach((key) => {
            lodash_1.default.set(update, key, null);
        });
        return this.model.updateMany(context.query, update, { new: true });
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
                    return lodash_1.default.omitBy({ path, select, model }, lodash_1.default.isNil);
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
exports.Repository = Repository;
