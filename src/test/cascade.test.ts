import {
  createConnection,
  createSchema,
  Document,
  Entity,
  Field,
  Inject,
  Reference,
  Repository,
  SchemaTypes,
} from "../index";

const connection = createConnection({
  dbName: "demo",
  user: "demo2",
  pass: "123456",
  authSource: "admin",
});

// Post
@Entity({ timestamps: true })
class Post extends Document {
  @Field({ type: String, required: true })
  title: string;

  @Field({ type: String, required: true })
  content: string;

  @Field({
    type: [{ type: SchemaTypes.ObjectId, ref: "Comment" }],
    default: [],
    cascade: true,
  })
  comments: Reference<Comment>[];
}
const postSchema = createSchema(Post);
@Inject({ connection, schema: postSchema })
class PostRepository extends Repository<Post> {}

@Entity({ timestamps: true })
class Comment extends Document {
  @Field({ type: String, required: true })
  commentBy: string;

  @Field({ type: String, required: true })
  content: string;
}
const commentSchema = createSchema(Comment);
@Inject({ connection, schema: commentSchema })
class CommentRepository extends Repository<Comment> {}

(async () => {
  const postRepository = new PostRepository();
  const commentRepository = new CommentRepository();

  const post = await postRepository.create({
    data: {
      title: "Post demo 2123345",
      content: "My love",
      comments: [{ commentBy: "NguyenDucLong", content: "HIHI" }],
    },
    populates: ["comments"],
  });

  console.log("create post", post);

  post.comments.push({
    commentBy: "Jimy",
    content: "Content 2",
  });

  const update = await postRepository.updateOne({
    query: { id: post.id },
    data: post,
    populates: ["comments"],
  });

  // Delete post
  await postRepository.delete({ query: { id: post.id } });
})();
