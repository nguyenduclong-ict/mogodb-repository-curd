import { Reference } from "interface";
import { Document, SchemaTypes } from "mongoose";
import { validateEntity } from "../validate";
import {
  createConnection,
  createSchema,
  Entity,
  Field,
  Inject,
  Repository,
} from "../index";

const connection = createConnection({
  dbName: "demo",
  user: "demo2",
  pass: "123456",
  authSource: "admin",
});

@Entity({ timestamps: true })
class Post extends Document {
  @Field({ type: String, required: true })
  title: string;

  @Field({ type: String, required: true })
  content: string;
}

@Entity({ timestamps: true })
class User extends Document {
  @Field({ type: String, required: true })
  username: string;

  @Field({ type: String, required: true })
  text?: string;

  @Field({
    type: [{ type: SchemaTypes.ObjectId, ref: Post.name }],
    default: [],
  })
  post: Reference<Post>[];
}

const userSchema = createSchema(User);
const postSchema = createSchema(Post);

@Inject({ connection, schema: userSchema })
class UserRepository extends Repository<User> {}

@Inject({ connection, schema: postSchema })
class PostRepository extends Repository<Post> {}

(async () => {
  const postRepository = new PostRepository();
  const userRepository = new UserRepository();

  const post = await postRepository.create({
    data: {
      title: `good morning ${Math.floor(Math.random() * 1000)}!`,
      content: "A good day",
    },
  });

  const userData = {
    username: "longnd-" + Math.floor(Math.random() * 1000),
    post: [post.id, post.id, post.id, "123"],
  };

  const validate = await validateEntity(User, userData);
  console.log(validate);

  if (validate.valid) {
    const user = await userRepository.create({ data: userData });
    console.log(post, user);
    console.log(
      await userRepository.findOne({
        query: { _id: user.id },
        populates: ["post"],
      })
    );
  }
})();
