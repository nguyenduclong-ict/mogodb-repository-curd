import { Connection, Document, Model, Schema } from "mongoose";
import { Hook, RepoAction } from "./decorator";
import {
  ContextCreate,
  ContextCreateMany,
  ContextUpdate,
  ListResponse,
  RepositoryContext,
} from "./interface";
import _ from "./utils/lodash";

export class Repository<E extends Document> {
  name: string;
  connection: Connection;
  schema: Schema;
  model: Model<E>;
  #cached: any;

  constructor(connection?: Connection) {
    this.connection = connection || this.connection;

    if (!this.name) {
      this.name = this.constructor.name.replace(/Repository$/, "");
    }

    if (this.connection.modelNames().includes(this.name)) {
      this.connection.deleteModel(this.name);
    }

    this.model = this.connection.model<E>(this.name, this.schema);

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
  }

  // Soft delete query
  private get softDeletePaths() {
    return this.#cached.softDeletePaths(this.schema);
  }

  private get hasSoftDelete() {
    return !_.isEmpty(this.softDeletePaths);
  }

  private get ignoreSoftDeleteQuery() {
    return this.#cached.ignoreSoftDeleteQuery(this.schema);
  }

  private get onlySoftDeleteQuery() {
    return this.#cached.onlySoftDeleteQuery(this.schema);
  }
  // End soft delete only

  @Hook("before", ["list", "find"], -1)
  private makeDefaultContextList(context: RepositoryContext<E> = {}) {
    context.page = context.page || 1;
    context.pageSize = context.pageSize || 100;
    context.limit = context.limit || context.pageSize;
    context.skip = context.skip || context.limit * (context.page - 1);
    context.softDelete = this.hasSoftDelete
      ? context.softDelete ?? "ignore"
      : undefined;
  }

  @Hook("before", ["findOne"], -1)
  private makeDefaultContextFindOne(context: RepositoryContext<E> = {}) {
    context.softDelete = this.hasSoftDelete
      ? context.softDelete ?? "ignore"
      : undefined;
  }

  @Hook("before", ["update", "updateOne"], -1)
  private makeDefaultContextUpdate(context: any = {}) {
    context.new = context.new ?? true;
  }

  @RepoAction
  async list(context: RepositoryContext<E> = {}): Promise<ListResponse<E>> {
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

    const [data, counts] = await Promise.all([
      Repository.populate(
        this.model.find(
          context.query as any,
          undefined,
          _.pick(context, [
            "skip",
            "limit",
            "projection",
            "sort",
            "session",
          ]) as any
        ),
        context.populates
      ),
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

    return this.model.find(
      context.query as any,
      undefined,
      _.omitBy(
        _.pick(context, [
          "populate",
          "skip",
          "limit",
          "projection",
          "sort",
          "session",
        ]),
        _.isNil
      )
    );
  }

  @RepoAction
  findOne(context: RepositoryContext<E> = {}): Promise<E> {
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

    return Repository.populate(
      this.model.findOne(
        context.query as any,
        undefined,
        _.omitBy(_.pick(context, ["projection", "session"]), _.isNil)
      ),
      context.populates
    );
  }

  @RepoAction
  create(context: ContextCreate<E>): Promise<E> {
    let options: any = _.omitBy({ session: context.session }, _.isNil);
    options = _.isEmpty(options) ? undefined : options;
    return this.model.create(context.data as any, options) as any;
  }

  @RepoAction
  createMany(context: ContextCreateMany<E> = {}): Promise<E[]> {
    let options: any = _.omitBy({ session: context.session }, _.isNil);
    options = _.isEmpty(options) ? undefined : options;
    return this.model.create(context.data as any, options) as any;
  }

  @RepoAction
  update(context: ContextUpdate<E>): Promise<E[]> {
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
  updateOne(context: ContextUpdate<E>): Promise<E> {
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
  delete(context: RepositoryContext<E>) {
    return this.model.deleteMany(
      context.query as any,
      _.omitBy({ session: context.session }, _.isNil)
    );
  }

  @RepoAction
  softDelete(context: RepositoryContext<E>) {
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

  @Hook("before", ["create"], -1)
  protected coreBeforeCreate(context: RepositoryContext<E>) {
    if (this.model.schema.path("createdBy") && _.has(context, "meta.user")) {
      _.set(context, "data.createdBy", context.meta.user.id);
      _.set(context, "data.updatedBy", context.meta.user.id);
    }
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
