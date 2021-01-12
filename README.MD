```bash
npm i --save mongodb-repository-crud
```

```bash
# CLI mrc-tool
npm i -g mongodb-repository-crud
mrc-tool --help

# create entity
mrc-tool entity entities User

# => generate
src/services/entities/User.schema.ts
src/services/entities/User.repository.ts

```

> New feature validate using [async-validator](https://www.npmjs.com/package/async-validator)

```typescript
// for validate entity with declare class
const validate = await validateEntity(<EntityClass>, entityData);

// return =>  {valid : boolean, errors, fields}

// for get async-validator schema
const validatorSchema = getValidatorOfEntity(<EntityClass>)

// example

const validate = await validateEntity(User, {username : '123'});

// using with Express middleware
route.use((req, res,next) => {
  const validate = await validateEntity(<EntityClass>, entityData);
  if(!validate.valid) {
    return next(new Error(validate.messages[0]))
  }
  next()
})
```

> Override async-validator setting with option `validator` in decorator `@Field`
>
> Check full [demo](https://github.com/nguyenduclong-ict/mogodb-repository-curd/blob/master/src/test/index.test.ts)

It project using create repository in typescript with suggestion in vscode

### Step 1 - Declare Entity and create Schema

```typescript
// user.schema.ts

import {
  createSchema,
  Entity,
  Field,
  DeleteDateColumn,
} from "mongodb-repository-crud";

@Entity({
  timestamps: true,
  indexs: [{ fields: { username: 1 } }, { fields: { name: "text" } }],
})
export class User extends Document {
  @Field()
  username: string;

  @Field()
  name: string;

  @Field(Number)
  age: string;

  @DeleteDateColumn()
  deletedAt: Date;

  createdAt?: Date;
  createdBy?: Date;
}

const userSchema = createSchema(User);

export { userSchema };
```

```typescript
// **** Add function validate entity
import { validateEntity } from "mongodb-repository-crud";

// use can add config to @Field({ validator : {...} })
// I use package async-validator, see more: https://github.com/yiminghe/async-validator

...
const validateResult = await validateEntity(User, { note: "" });
console.log(validateResult);
...
// result
{
  valid: false,
  errors: [
    { message: 'username is required', field: 'username' },
    { message: 'deletedAt fails', field: 'deletedAt' }
  ],
  fields: { username: [ [Object] ], deletedAt: [ [Object] ] }
}
```

> Default `@Field` generate field with type = `String`, option timestamps = true auto generate 2 filed `createdAt` and `updatedAt`, so declare 2 file in class for snippet when typing and not declare @Field for thems

> `@DeleteDateColumn` decorator will declare deleted column. After you can using `repository.softDelete` to softDelete document

Default action list, find, findOne only return document has not been softDeleted, set softDelete option on find, list, findOne to:

- softDelete = 'ignore' : only return document has not been softDeleted (default)
- softDelete = 'only' : only return document has been softDeleted
- softDelete = 'all' : return both deleted and not deleted

```typescript
// Example
...
repository.find({query : {score : 1}, softDelete : 'ignore'}) // return except softDeleted

repository.find({query : {score : 1}, softDelete : 'only'}) // return only softDeleted

repository.find({query : {score : 1}, softDelete : 'all'}) // return all document
...
```

### Step 2 - Create Repository

```typescript
// user.repository.ts

import { User, userSchema } from "./user.schema.ts";
import {
  createConnection,
  Repository,
  Inject,
  Hook,
  RepositoryContext,
  ListResponse,
} from "mongodb-repository-crud";

// Create mongoose connection
const connection = createConnection({
  dbName: "demo",
  user: "demo",
  pass: "123456",
});

@Inject({ connection, schema: userSchema })
export class UserRepository extends Repository<User> {
  @RepoAction
  demo() {
    return "demo";
  }

  @Hook("before", ["list", "find"])
  beforeList(context: RepositoryContext<User>) {
    // context.meta = {};
    // trigger before action list and find
  }

  @Hook("after", ["list"])
  beforeList(context: RepositoryContext<User>, response: ListResponse<User>) {
    // trigger after action list
    // context.meta = {};

    response.favorites = 10;
    return response;
  }
}
```

> Decorator `@RepoAction` will make function can trigger hook

### Step 3 - Use Repository

```typescript
// test.ts
import { UserRepository } from "./user.repository";
async function test() {
  // ...
  const userRepository = new UserRepository();
  const data = await userRepository.list();

  console.log(data);

  //   {
  //     data: [
  //       {
  //         _id: "5fef6d52e8ae0020ffe8c508",
  //         username: "nobita",
  //         deletedAt: null,
  //         createdAt: "2021-01-01T18:43:30.568Z",
  //         updatedAt: "2021-01-01T18:45:04.617Z",
  //         age: 10,
  //         __v: 0,
  //       },
  //     ],
  //     limit: 100,
  //     skip: 0,
  //     page: 1,
  //     totalPages: 1,
  //     pageSize: 100,
  //     total: 1,
  //   };
}
```

> Thanks for read
