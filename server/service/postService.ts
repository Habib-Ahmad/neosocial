import { session } from "../db/neo4j";
import { v4 as uuidv4 } from "uuid";
import { Post } from "../models/Post";

export const createPostService = async (userId: string, body: any): Promise<Post> => {
  const postId = uuidv4();
  const now = new Date().toISOString();

  const result = await session.run(
    `
    MATCH (u:User {id: $userId})
    CREATE (p:Post {
      id: $postId,
      content: $content,
      created_at: datetime($now),
      updated_at: datetime($now),
      is_deleted: false,
      likes_count: 0,
      comments_count: 0,
      reposts_count: 0
    })
    CREATE (u)-[:POSTED]->(p)
    RETURN p
    `,
    {
      userId,
      postId,
      location,
      now,
    }
  );

  return result.records[0].get("p").properties;
};
export const createCommentForPostService = async (
  userId: string,
  postId: string,
  content: string
) => {
  const commentId = `comment-${uuidv4()}`;
  const timestamp = new Date().toISOString();

  const result = await session.run(
    `
    MATCH (u:User {id: $userId}), (p:Post {id: $postId})
    CREATE (c:Comment {
      id: $commentId,
      content: $content,
      created_at: datetime($timestamp),
      updated_at: datetime($timestamp),
      likes_count: 0,
      is_deleted: false
    })
    CREATE (u)-[:COMMENTED {commented_at: datetime($timestamp)}]->(c)
    CREATE (p)-[:HAS_COMMENT]->(c)
    RETURN c
    `,
    {
      userId,
      postId,
      content,
      commentId,
      timestamp,
    }
  );

  return result.records[0].get("c").properties;
};

export const getCommentsForPostService = async (postId: string) => {
  const result = await session.run(
    `
    MATCH (:Post {id: $postId})-[:HAS_COMMENT]->(c:Comment)
    WHERE c.is_deleted = false
    RETURN c
    ORDER BY c.created_at ASC
    `,
    { postId }
  );

  return result.records.map((r) => r.get("c").properties);
};
export const getUserFeedService = async (userId: string): Promise<Post[]> => {
  const result = await session.run(`
    MATCH (p:Post)
    WHERE p.privacy_level = 'public' AND p.is_deleted = false
    RETURN p
    ORDER BY p.created_at DESC
    LIMIT 50
  `);

  return result.records.map((r) => r.get("p").properties as Post);
};

export const getAllPostsService = async (): Promise<Post[]> => {
  const result = await session.run(`
    MATCH (p:Post)
    WHERE p.is_deleted = false
    RETURN p
    ORDER BY p.created_at DESC
    LIMIT 100
  `);
  return result.records.map((r) => r.get("p").properties as Post);
};

export const getPostByIdService = async (id: string): Promise<Post | null> => {
  const result = await session.run("MATCH (p:Post {id: $id}) RETURN p LIMIT 1", { id });

  const post = result.records[0]?.get("p")?.properties || null;
  return post as Post | null;
};

export const togglePostLikeService = async (userId: string, postId: string): Promise<Post> => {
  const result = await session.run(
    `
    MATCH (u:User {id: $userId})-[r:LIKES]->(p:Post {id: $postId})
    WITH u, p, r
    OPTIONAL MATCH (u)-[r2:LIKES]->(p)
    DELETE r
    SET p.likes_count = p.likes_count - 1
    RETURN p
    UNION
    MATCH (u:User {id: $userId}), (p:Post {id: $postId})
    CREATE (u)-[:LIKES]->(p)
    SET p.likes_count = p.likes_count + 1
    RETURN p
    `,
    { userId, postId }
  );

  return result.records[0].get("p").properties as Post;
};

export const updatePostService = async (
  userId: string,
  postId: string,
  updates: Partial<Post>
): Promise<Post | null> => {
  if (!updates.content || updates.content.trim() === "") {
    throw new Error("Post content is required");
  }

  const result = await session.run(
    `
    MATCH (u:User {id: $userId})-[:POSTED]->(p:Post {id: $postId})
    SET p.content = $content,
        p.updated_at = datetime()
    RETURN p
    `,
    {
      userId,
      postId,
      content: updates.content,
    }
  );

  const record = result.records[0]?.get("p")?.properties;
  if (!record) {
    return null;
  }
  return {
    ...record,
    updated_at: new Date(record.updated_at).toISOString(),
    created_at: new Date(record.created_at).toISOString(),
  };
};

export const deletePostService = async (userId: string, postId: string): Promise<boolean> => {
  const result = await session.run(
    `
    MATCH (u:User {id: $userId})-[:POSTED]->(p:Post {id: $postId})
    WHERE p.is_deleted = false
    SET p.is_deleted = true,
        p.updated_at = datetime()
    RETURN p.id AS id
    `,
    { userId, postId }
  );

  return result.records.length > 0;
};
