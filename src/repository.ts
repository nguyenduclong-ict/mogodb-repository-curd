import { Connection, Document, isValidObjectId, Model, Schema } from "mongoose";
import { RepoAction } from "./decorator";
import {
  ContextCreate,
  ContextCreateMany,
  ContextUpdate,
  CustomSchema,
  ListResponse,
  RepositoryContext,
} from "./interface";
import { parseMongoQuery } from "./utils";
import _ from "./utils/lodash";

class RepositoryLocator {
  repositories: Map<string, Map<Connection, Repository<any>>>;
  constructor() {
    this.repositories = new Map();
  }
  registerRepository(respository: Repository<any>) {
    const locator =
      this.repositories.get(respository.name) ||
      this.repositories.set(respository.name, new Map()).get(respository.name);
    locator.set(respository.connection, respository);
  }

  getRepository(name: string, connection: Connection) {
    return this.repositories.get(name)?.get(connection);
  }
}

export const repositoryLocator = new RepositoryLocator();

export function getObjectId(value: any): any {
  if (isValidObjectId(value)) return value;
  if (isValidObjectId(value?.id)) return value.id;
  if (isValidObjectId(value?._id)) return value._id;
  return false;
}

export class Repository<E extends Document> {
  name: string;
  connection: Connection;
  schema: CustomSchema;
  model: Model<E>;
  #cached: any;

  constructor(connection?: Connection) {
    this.connection = connection || this.connection;

    if (!this.name) {
      this.name = this.constructor.name.replace(/Repository$/, "");
    }

    this.model =
      this.connection.models[this.name] ||
      this.connection.model<E>(this.name, this.schema);

    this.#cached = {
      softDeletePaths: _.memoize((shema: Schema) => {
        return _.pickBy(
          this.schema.paths,
          (value) => _.get(value, "options.columnType") === "deleteDate"
        );
      }),
      ignoreSoftDeleteQuery: _.memoize((schema: Schema) => {
        const queryIgnore = {};

        const deleteDatePaths = _.pickBy(
          schema.paths,
          (value) => _.get(value, "options.columnType") === "deleteDate"
        );

        Object.keys(deleteDatePaths).forEach((key) => {
          _.set(queryIgnore, key, null);
        });

        return queryIgnore;
      }),
      onlySoftDeleteQuery: _.memoize((schema: Schema) => {
        const queryOnly = {};

        const deleteDatePaths = _.pickBy(
          this.schema.paths,
          (value) => _.get(value, "options.columnType") === "deleteDate"
        );

        Object.keys(deleteDatePaths).forEach((key) => {
          _.set(queryOnly, key, { $type: "date" });
        });

        return queryOnly;
      }),
    };

    repositoryLocator.registerRepository(this);
  }

  // Soft delete query
  protected get softDeletePaths() {
    return this.#cached.softDeletePaths(this.schema);
  }

  protected get hasSoftDelete() {
    return !_.isEmpty(this.softDeletePaths);
  }

  protected get ignoreSoftDeleteQuery() {
    return this.#cached.ignoreSoftDeleteQuery(this.schema);
  }

  protected get onlySoftDeleteQuery() {
    return this.#cached.onlySoftDeleteQuery(this.schema);
  }

  protected handleQuerySoftDelete(context: any) {
    if (!this.hasSoftDelete) return context;
    // Ignore soft delete document
    if (context.softDelete === "ignore") {
      context.query = {
        $and: [context.query || {}, this.ignoreSoftDeleteQuery],
      } as any;
    }

    if (context.softDelete === "only") {
      context.query = {
        $and: [context.query || {}, this.onlySoftDeleteQuery],
      } as any;
    }
    return context;
  }

  protected makeDefaultContextList(context: RepositoryContext<E> = {}) {
    context.page = context.page || 1;
    context.pageSize = context.pageSize || 100;
    context.limit = context.limit || context.pageSize;
    context.skip = context.skip || context.limit * (context.page - 1);
  }

  protected setOwnerOnUpdate(context: ContextCreate<E>, path = "data") {
    if (
      this.schema.__options.owner &&
      this.model.schema.path("updatedBy") &&
      _.has(context, "meta.user")
    ) {
      _.set(context, path + ".updatedBy", context.meta.user.id);
    }
  }

  protected setOwnerOnCreate(context: any, path = "data") {
    if (
      this.schema.__options.owner &&
      this.model.schema.path("createdBy") &&
      _.has(context, "meta.user")
    ) {
      _.set(context, path + ".createdBy", context.meta.user.id);
      _.set(context, path + ".updatedBy", context.meta.user.id);
    }
  }

  protected async cascadeCreateOrUpdate(ctx: ContextCreate): Promise<any> {
    const data = ctx.data;
    const cascadeTasks: any[] = [];

    const getReferenceModel = async (options: any) => {
      if (options.ref) return options.ref;
      if (options.refPath) {
        let refPath = _.get(data, options.refPath);
        if (!refPath && getObjectId(data))
          refPath = _.get(
            await this.model.findById(getObjectId(data)),
            options.refPath
          );
      }
    };

    const handleCascade = (path: string, options: any, fieldValue: any) => {
      const objectId = getObjectId(fieldValue);
      if (!(options.cascade ?? true)) return; // ignore if cascade false
      if (getObjectId(data) && !(options.cascadeOnUpdate ?? true)) return; // ignore cascade on update
      if (!getObjectId(data) && !(options.cascadeOnCreate ?? true)) return; // ignore cascade on create
      if (isValidObjectId(fieldValue)) return; // ignore if fieldValue is ObjectIs

      if (getObjectId(fieldValue)) {
        // update sub document
        cascadeTasks.push(async () => {
          const modelName = await getReferenceModel(options);
          if (modelName) {
            await repositoryLocator
              .getRepository(modelName, this.connection)
              ?.updateOne({
                query: { _id: objectId },
                data: fieldValue,
                ..._.pick(ctx, "meta", "session", "new"),
              });
            _.set(data, path, objectId);
          }
        });
      } else {
        // create sub document
        cascadeTasks.push(async () => {
          const modelName = await getReferenceModel(options);
          if (modelName) {
            const doc = await repositoryLocator
              .getRepository(modelName, this.connection)
              ?.create({
                data: fieldValue,
                ..._.pick(ctx, "meta", "session"),
              });
            _.set(data, path, doc.id);
          }
        });
      }
    };

    this.schema.eachPath((path, type: any) => {
      let fieldValue: any;
      if (type.instance === "ObjectID" && (fieldValue = _.get(data, path))) {
        if (type.options.cascade) {
          handleCascade(path, type.options, fieldValue);
        } else {
          _.set(data, path, getObjectId(fieldValue));
        }
        return;
      }
      // Array refs
      if (
        type.instance === "Array" &&
        type.caster.instance === "ObjectID" &&
        Array.isArray((fieldValue = _.get(data, path)))
      ) {
        const options = { ...type.options, ...type.caster.options };
        if (options.cascade) {
          fieldValue.forEach((item, index) =>
            handleCascade(path + "." + index, options, item)
          );
        } else {
          fieldValue.forEach((item, index) =>
            _.set(data, path + "." + index, getObjectId(item))
          );
        }
      }
    });

    await Promise.all(cascadeTasks.map((t) => t()));
    return data;
  }

  protected async cascadeDelete(entity: any, ctx: ContextCreate): Promise<any> {
    const data = entity;
    const cascadeTasks: any[] = [];

    const getReferenceModel = async (options: any) => {
      if (options.ref) return options.ref;
      if (options.refPath) {
        let refPath = _.get(data, options.refPath);
        if (!refPath && getObjectId(data))
          refPath = _.get(
            await this.model.findById(getObjectId(data)),
            options.refPath
          );
      }
    };

    const handleCascade = (options: any, fieldValue: any) => {
      if (!(options.cascade ?? true)) return; // ignore if cascade false
      if (!(options.cascadeOnDelete ?? true)) return; // ignore cascade on create
      if (!isValidObjectId(fieldValue) && !Array.isArray(fieldValue)) return; // ignore if fieldValue is not is ObjectId

      if (getObjectId(fieldValue)) {
        // update sub document
        cascadeTasks.push(async () => {
          const modelName = await getReferenceModel(options);
          if (modelName) {
            return repositoryLocator
              .getRepository(modelName, this.connection)
              ?.delete({
                query: { _id: fieldValue },
                ..._.pick(ctx, "meta", "session"),
              });
          }
        });
      }
    };

    this.schema.eachPath((path, type: any) => {
      let fieldValue: any;
      if (type.instance === "ObjectID" && (fieldValue = _.get(data, path))) {
        handleCascade(type, fieldValue);
        return;
      }
      // Array refs
      if (
        type.instance === "Array" &&
        type.caster.instance === "ObjectID" &&
        Array.isArray((fieldValue = _.get(data, path)))
      ) {
        const options = { ...type.options, ...type.caster.options };
        handleCascade(options, fieldValue);
      }
    });

    await Promise.all(cascadeTasks.map((t) => t()));
    return data;
  }

  @RepoAction
  async list(context: RepositoryContext<E> = {}): Promise<ListResponse<E>> {
    parseMongoQuery(context.query);
    this.handleQuerySoftDelete(context);
    this.makeDefaultContextList(context); // defaultContextList
    const queryBuilder = this.model.find(
      context.query as any,
      undefined,
      _.omitBy(
        _.pick(context, ["skip", "limit", "projection", "sort", "session"]),
        _.isNil
      )
    );
    Repository.populate(queryBuilder, context.populates);
    if (context.select) {
      queryBuilder.select(context.select);
    }

    const [data, counts] = await Promise.all([
      queryBuilder.exec(),
      this.model.countDocuments(context.query as any),
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

  @RepoAction
  async find(context: RepositoryContext<E> = {}): Promise<E[]> {
    parseMongoQuery(context.query);
    this.handleQuerySoftDelete(context);
    this.makeDefaultContextList(context); // defaultContextList
    const queryBuilder = this.model.find(
      context.query as any,
      undefined,
      _.omitBy(
        _.pick(context, ["skip", "limit", "projection", "sort", "session"]),
        _.isNil
      )
    );
    Repository.populate(queryBuilder, context.populates);
    if (context.select) {
      queryBuilder.select(context.select);
    }

    return queryBuilder.exec();
  }

  @RepoAction
  findOne(context: RepositoryContext<E> = {}): Promise<E> {
    parseMongoQuery(context.query);
    this.handleQuerySoftDelete(context);
    const queryBuilder = this.model.findOne(
      context.query as any,
      undefined,
      _.omitBy(_.pick(context, ["projection", "session"]), _.isNil)
    );
    Repository.populate(queryBuilder, context.populates);
    if (context.select) {
      queryBuilder.select(context.select);
    }
    return queryBuilder.exec();
  }

  @RepoAction
  async create(context: ContextCreate<E>): Promise<E> {
    let options: any = _.omitBy({ session: context.session }, _.isNil);
    options = _.isEmpty(options) ? undefined : options;
    this.setOwnerOnCreate(context);
    await this.cascadeCreateOrUpdate(context);
    return this.model.create(context.data as any, options).then((doc: any) => {
      if (context.populates?.length) {
        return Repository.populate(
          this.model.findById(doc.id),
          context.populates
        );
      }
      return doc;
    });
  }

  @RepoAction
  async createMany(context: ContextCreateMany<E> = {}): Promise<E[]> {
    let options: any = _.omitBy({ session: context.session }, _.isNil);
    options = _.isEmpty(options) ? undefined : options;
    const cascadeTasks: any[] = [];
    if (Array.isArray(context.data)) {
      context.data?.forEach((item, index) => {
        this.setOwnerOnCreate(context, `data.${index}`);
        cascadeTasks.push(
          this.cascadeCreateOrUpdate({ ...context, data: context.data[index] })
        );
      });
    } else {
      this.setOwnerOnCreate(context, "data");
      cascadeTasks.push(this.cascadeCreateOrUpdate(context));
    }
    await Promise.all(cascadeTasks);
    return this.model.create(context.data as any, options) as any;
  }

  @RepoAction
  async update(context: ContextUpdate<E>): Promise<E[]> {
    context.new = context.new ?? true;
    parseMongoQuery(context.query);
    this.setOwnerOnUpdate(context);
    await this.cascadeCreateOrUpdate(context);
    if (context.new) {
      return this.model
        .find(context.query as any, undefined, { projection: "id" })
        .then((docs) =>
          this.model
            .updateMany(context.query as any, context.data as any)
            .then(() =>
              Repository.populate(
                this.model.find(
                  {
                    _id: docs.map((doc) => doc.id),
                  } as any,
                  undefined,
                  _.omitBy(
                    _.pick(context, ["projection", "session", "new"]),
                    _.isNil
                  ) as any
                ),
                context.populates
              )
            )
        );
    } else {
      return this.model.updateMany(
        context.query as any,
        context.data as any,
        _.omitBy({ session: context.session }, _.isNil)
      ) as any;
    }
  }

  @RepoAction
  async updateOne(context: ContextUpdate<E>): Promise<E> {
    context.new = context.new ?? true;
    parseMongoQuery(context.query);
    this.setOwnerOnUpdate(context);
    await this.cascadeCreateOrUpdate(context);
    return Repository.populate(
      this.model.findOneAndUpdate(
        context.query as any,
        context.data as any,
        _.omitBy(_.pick(context, ["projecton", "session", "new"]), _.isNil)
      ),
      context.populates
    );
  }

  @RepoAction
  async delete(context: RepositoryContext<E>) {
    parseMongoQuery(context.query);
    const entites = await this.model.find(context.query);
    const result = await this.model.deleteMany(
      context.query as any,
      _.omitBy({ session: context.session }, _.isNil)
    );
    try {
      await Promise.all(
        entites.map((entity) => this.cascadeDelete(entity, context))
      );
    } catch (error) {
      console.log(this.name, "cascade delete error", error);
    }
    return result;
  }

  @RepoAction
  softDelete(context: RepositoryContext<E>) {
    parseMongoQuery(context.query);
    const deleteDatePaths = _.pickBy(
      this.schema.paths,
      (value) => _.get(value, "options.columnType") === "deleteDate"
    );

    if (_.isEmpty(deleteDatePaths)) {
      throw new Error("Cannot find at least field typeof deleteDate");
    }

    const update = {};

    Object.keys(deleteDatePaths).forEach((key) => {
      _.set(update, "$currentDate." + key, true);
    });

    return this.model.updateMany(context.query as any, update, { new: true });
  }

  @RepoAction
  restoreSoftDelete(context: RepositoryContext<E>) {
    parseMongoQuery(context.query);
    const deleteDatePaths = _.pickBy(
      this.schema.paths,
      (value) => _.get(value, "options.columnType") === "deleteDate"
    );

    if (_.isEmpty(deleteDatePaths)) {
      throw new Error("Cannot find at least field typeof deleteDate");
    }

    const update = {};

    Object.keys(deleteDatePaths).forEach((key) => {
      _.set(update, key, null);
    });

    return this.model.updateMany(context.query as any, update, { new: true });
  }

  static populate(query: any, populate: any) {
    if (populate) {
      const populateData: PopulateItem[] = this.buildPopulate(populate);
      populateData.forEach((item) => {
        query.populate(item);
      });
    }
    return query;
  }

  static buildPopulate(populate: any): PopulateItem[] {
    if (!Array.isArray(populate)) {
      populate = populate.split(",");
    }

    populate = populate.map((item: any) => {
      if (typeof item === "string") {
        let [path, select, model] = item.split(":");
        path = path || undefined;
        select = select || undefined;
        model = model || undefined;
        if (path.includes(".")) {
          const subs = path.split(".");
          item = {};
          subs.reduce((e: any, key, index) => {
            e.path = key;
            if (index < subs.length - 1) {
              e.populate = {};
              return e.populate;
            } else {
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
        } else {
          return _.omitBy({ path, select, model }, _.isNil);
        }
      } else {
        return item;
      }
    });

    return populate;
  }
}

interface PopulateItem {
  path?: string;
  select?: string;
  model?: string;
}
