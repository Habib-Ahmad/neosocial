import { driver } from "../db/neo4j";
import { v4 as uuidv4 } from "uuid";
import { Post } from "../models/Post";
import { timestampToDate, toNumber } from "../utils/neo4j";

export const createPostService = async (userId: string, body: any): Promise<Post> => {
  const postId = uuidv4();
  const now = new Date().toISOString();

  const session = driver.session();
  const result = await session.run(
    `
    MATCH (u:User {id: $userId})
    CREATE (p:Post {
      id: $postId,
      content: $content,
      category: $category,
      created_at: datetime($now),
      updated_at: datetime($now),
      is_deleted: false,
      likes_count: 0,
      comments_count: 0,
      reposts_count: 0,
      media_urls: [],
    })
    CREATE (u)-[:POSTED]->(p)
    RETURN p
    `,
    {
      userId,
      postId,
      now,
      content: body.content,
      category: body.category || "",
    }
  );

  return result.records[0].get("p").properties;
};

export const getUserFeedService = async (userId: string): Promise<Post[]> => {
  const session = driver.session();
  const result = await session.run(`
    MATCH (p:Post)
    WHERE p.privacy_level = 'public' AND p.is_deleted = false
    RETURN p
    ORDER BY p.created_at DESC
    LIMIT 50
  `);

  return result.records.map((r) => r.get("p").properties as Post);
};

export const getAllPostsService = async (viewerId: string): Promise<any[]> => {
  const session = driver.session();
  const result = await session.run(
    `
    MATCH (u:User)-[:POSTED]->(p:Post)
    OPTIONAL MATCH (viewer:User {id: $viewerId})-[:LIKES]->(p)
    WHERE p.is_deleted = false
    RETURN p, u, viewer IS NOT NULL AS liked_by_me
    ORDER BY p.created_at DESC
    LIMIT 100
    `,
    { viewerId }
  );

  return result.records.map((record) => {
    const rawPost = record.get("p").properties;
    const rawUser = record.get("u").properties;
    const likedByMe = record.get("liked_by_me");

    return {
      ...rawPost,
      likes_count: toNumber(rawPost.likes_count),
      comments_count: toNumber(rawPost.comments_count),
      reposts_count: toNumber(rawPost.reposts_count),
      created_at: timestampToDate(rawPost.created_at),
      updated_at: timestampToDate(rawPost.updated_at),
      liked_by_me: likedByMe,
      author: {
        id: rawUser.id,
        name: `${rawUser.first_name} ${rawUser.last_name}`,
        email: rawUser.email,
        profile_picture: rawUser.profile_picture || "",
      },
    };
  });
};

export const getPostsByUserIdService = async (userId: string, viewerId: string): Promise<any[]> => {
  const session = driver.session();
  const result = await session.run(
    `
    MATCH (author:User {id: $userId})-[:POSTED]->(p:Post)
    OPTIONAL MATCH (viewer:User {id: $viewerId})-[:LIKES]->(p)
    WHERE p.is_deleted = false
    RETURN p, author, viewer IS NOT NULL AS liked_by_me
    ORDER BY p.created_at DESC
    `,
    { userId, viewerId }
  );

  return result.records.map((record) => {
    const rawPost = record.get("p").properties;
    const rawUser = record.get("author").properties;
    const likedByMe = record.get("liked_by_me");

    return {
      ...rawPost,
      likes_count: toNumber(rawPost.likes_count),
      comments_count: toNumber(rawPost.comments_count),
      reposts_count: toNumber(rawPost.reposts_count),
      created_at: timestampToDate(rawPost.created_at),
      updated_at: timestampToDate(rawPost.updated_at),
      liked_by_me: likedByMe,
      author: {
        id: rawUser.id,
        name: `${rawUser.first_name} ${rawUser.last_name}`,
        email: rawUser.email,
        profile_picture: rawUser.profile_picture || "",
      },
    };
  });
};

export const getPostByIdService = async (id: string, viewerId: string): Promise<Post | null> => {
  const session = driver.session();
  const result = await session.run(
    `
    MATCH (u:User)-[:POSTED]->(p:Post {id: $id})
    OPTIONAL MATCH (p)-[:HAS_COMMENT]->(c:Comment)<-[:COMMENTED]-(cu:User)
    OPTIONAL MATCH (viewer:User {id: $viewerId})-[:LIKES]->(p)
    RETURN p, u, viewer IS NOT NULL AS liked_by_me,
      collect({
        id: c.id,
        content: c.content,
        created_at: c.created_at,
        author: {
          id: cu.id,
          name: cu.first_name + ' ' + cu.last_name,
          email: cu.email,
          profile_picture: coalesce(cu.profile_picture, '')
        }
      }) AS comments
    LIMIT 1
    `,
    { id, viewerId }
  );

  if (result.records.length === 0) return null;

  const record = result.records[0];
  const rawPost = record.get("p").properties;
  const rawUser = record.get("u").properties;
  const rawComments = record.get("comments") || [];
  const likedByMe = record.get("liked_by_me");

  return {
    ...rawPost,
    likes_count: toNumber(rawPost.likes_count),
    comments_count: toNumber(rawPost.comments_count),
    reposts_count: toNumber(rawPost.reposts_count),
    created_at: timestampToDate(rawPost.created_at),
    updated_at: timestampToDate(rawPost.updated_at),
    liked_by_me: likedByMe,
    author: {
      id: rawUser.id,
      name: `${rawUser.first_name} ${rawUser.last_name}`,
      email: rawUser.email,
      profile_picture: rawUser.profile_picture || "",
    },
    comments: rawComments
      .filter((c: any) => c.id && c.author?.id)
      .map((c: any) => ({
        id: c.id,
        content: c.content,
        created_at: timestampToDate(c.created_at),
        author: c.author,
      })),
  };
};

export const togglePostLikeService = async (userId: string, postId: string): Promise<Post> => {
  const session = driver.session();
  const result = await session.run(
    `
    MATCH (u:User {id: $userId}), (p:Post {id: $postId})
    OPTIONAL MATCH (u)-[r:LIKES]->(p)
    WITH u, p, r, 
        CASE WHEN r IS NOT NULL THEN true ELSE false END AS alreadyLiked
    FOREACH (_ IN CASE WHEN alreadyLiked THEN [1] ELSE [] END |
      DELETE r
      SET p.likes_count = coalesce(p.likes_count, 1) - 1
    )
    FOREACH (_ IN CASE WHEN NOT alreadyLiked THEN [1] ELSE [] END |
      CREATE (u)-[:LIKES]->(p)
      SET p.likes_count = coalesce(p.likes_count, 0) + 1
    )
    WITH p, NOT alreadyLiked AS liked_by_me
    RETURN p, liked_by_me
    `,
    { userId, postId }
  );

  const record = result.records[0];
  const rawPost = record.get("p").properties;
  const likedByMe = record.get("liked_by_me");

  return {
    ...rawPost,
    likes_count: toNumber(rawPost.likes_count),
    comments_count: toNumber(rawPost.comments_count),
    reposts_count: toNumber(rawPost.reposts_count),
    created_at: timestampToDate(rawPost.created_at),
    updated_at: timestampToDate(rawPost.updated_at),
    liked_by_me: likedByMe,
  };
};

export const updatePostService = async (
  userId: string,
  postId: string,
  updates: Partial<Post>
): Promise<Post | null> => {
  if (!updates.content || updates.content.trim() === "") {
    throw new Error("Post content is required");
  }

  const session = driver.session();
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
  const session = driver.session();
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
