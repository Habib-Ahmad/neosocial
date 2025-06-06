import { driver } from "../db/neo4j";
import { v4 as uuidv4 } from "uuid";
import { Post } from "../models/Post";
import { timestampToDate, toNumber } from "../utils/neo4j";
import neo4j from "neo4j-driver";

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
      media_urls: $mediaUrls
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
      mediaUrls: body.mediaUrls || [],
    }
  );

  return result.records[0].get("p").properties;
};
export const createGroupPostService = async (
  userId: string,
  groupId: string,
  body: any
): Promise<Post> => {
  const postId = uuidv4();
  const now = new Date().toISOString();

  const session = driver.session();

  // Check if user is a member of the group
  const membershipCheck = await session.run(
    `
    MATCH (u:User {id: $userId})-[:MEMBER_OF]->(g:Group {id: $groupId})
    RETURN g
    `,
    { userId, groupId }
  );

  if (membershipCheck.records.length === 0) {
    await session.close();
    throw new Error("User is not a member of this group");
  }

  const result = await session.run(
    `
    MATCH (u:User {id: $userId}), (g:Group {id: $groupId})
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
      media_urls: $mediaUrls,
      post_type: "group"
    })
    CREATE (u)-[:POSTED]->(p)
    CREATE (p)-[:POSTED_IN]->(g)
    RETURN p
    `,
    {
      userId,
      groupId,
      postId,
      now,
      content: body.content,
      category: body.category || "",
      mediaUrls: body.mediaUrls || [],
    }
  );

  await session.close();
  return result.records[0].get("p").properties;
};

export const createCommentForPostService = async (
  userId: string,
  postId: string,
  content: string
) => {
  const commentId = `comment-${uuidv4()}`;
  const timestamp = new Date().toISOString();
  const session = driver.session();

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
    RETURN c, u
    `,
    {
      userId,
      postId,
      content,
      commentId,
      timestamp,
    }
  );

  const record = result.records[0];
  const c = record.get("c").properties;
  const u = record.get("u").properties;

  return {
    id: c.id,
    content: c.content,
    created_at: new Date(c.created_at.toString()).toISOString(),
    updated_at: new Date(c.updated_at.toString()).toISOString(),
    likes_count: neo4j.integer.toNumber(c.likes_count),
    is_deleted: c.is_deleted,
    author: {
      id: u.id,
      name: `${u.first_name} ${u.last_name}`,
      email: u.email,
      profile_picture: u.profile_picture || "",
    },
  };
};

export const getCommentsForPostService = async (postId: string, userId: string) => {
  const session = driver.session();

  const result = await session.run(
    `
    MATCH (p:Post {id: $postId})-[:HAS_COMMENT]->(c:Comment)
    OPTIONAL MATCH (u:User {id: $userId})-[:LIKES]->(c)
    WHERE c.is_deleted = false
    RETURN c, COUNT(u) > 0 AS liked
    ORDER BY c.created_at ASC
    `,
    { postId, userId }
  );

  await session.close();

  return result.records.map((record) => {
    const c = record.get("c").properties;

    return {
      id: c.id,
      content: c.content,
      likes_count: neo4j.integer.toNumber(c.likes_count),
      is_deleted: c.is_deleted,
      created_at: timestampToDate(c.created_at),
      updated_at: timestampToDate(c.updated_at),
      liked_by_user: record.get("liked"),
    };
  });
};

export const getDiscoverFeedService = async (userId: string): Promise<Post[]> => {
  const session = driver.session();
  try {
    const result = await session.run(
      `
      MATCH (u:User {id: $userId})

      OPTIONAL MATCH (u)-[:LIKED]->(:Post)-[:IN_CATEGORY]->(c:Category)
      WITH u, collect(DISTINCT c.name) AS likedCategories

      MATCH (author:User)-[:POSTED]->(p:Post)-[:IN_CATEGORY]->(pc:Category)
      WHERE pc.name IN likedCategories AND author.privacy_level = 'public' AND p.is_deleted = false

      OPTIONAL MATCH (u)-[:FRIENDS_WITH]-(f:User)-[:LIKED]->(fLiked:Post)<-[:POSTED]-(fAuthor:User)
      WHERE fLiked.is_deleted = false AND fAuthor.privacy_level = 'public'

      WITH collect(p) + collect(fLiked) AS allPosts, u
      UNWIND allPosts AS post
      WITH DISTINCT post, u

      OPTIONAL MATCH (u)-[:LIKED]->(post)
      MATCH (author:User)-[:POSTED]->(post)

      RETURN post, author, EXISTS((u)-[:LIKED]->(post)) AS liked_by_me
      ORDER BY post.created_at DESC
      LIMIT 50
      `,
      { userId }
    );

    return result.records.map((record) => {
      const rawPost = record.get("post").properties;
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
  } finally {
    await session.close();
  }
};

export const getLatestFeedService = async (viewerId: string): Promise<any[]> => {
  const session = driver.session();
  try {
    const result = await session.run(
      `
      MATCH (viewer:User {id: $viewerId})
      OPTIONAL MATCH (viewer)-[:FRIENDS_WITH]-(f:User)
      WITH viewer, collect(f) + [viewer] AS users
      UNWIND users AS u

      OPTIONAL MATCH (u)-[:POSTED]->(p:Post)
      WHERE p.is_deleted = false

      OPTIONAL MATCH (u)-[:LIKED]->(liked:Post)
      WHERE liked.is_deleted = false

      OPTIONAL MATCH (u)-[:REPOSTED]->(reposted:Post)
      WHERE reposted.is_deleted = false

      WITH viewer, collect(p) + collect(liked) + collect(reposted) AS allPosts
      UNWIND allPosts AS post
      WITH DISTINCT viewer, post

      OPTIONAL MATCH (viewer)-[:LIKED]->(l:Post)
      WHERE l = post

      MATCH (author:User)-[:POSTED]->(post)

      RETURN post,
             author,
             l IS NOT NULL AS liked_by_me,
             COUNT { (post)-[:HAS_COMMENT]->(:Comment) } AS comments_count
      ORDER BY post.created_at DESC
      LIMIT 100
      `,
      { viewerId }
    );

    return result.records.map((record) => {
      const rawPost = record.get("post").properties;
      const rawUser = record.get("author").properties;
      const likedByMe = record.get("liked_by_me");
      const commentsCount = record.get("comments_count").toInt();

      return {
        ...rawPost,
        likes_count: toNumber(rawPost.likes_count),
        comments_count: commentsCount,
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
  } finally {
    await session.close();
  }
};

export const getPostsByUserIdService = async (userId: string, viewerId: string): Promise<any[]> => {
  const session = driver.session();
  const result = await session.run(
    `
    MATCH (author:User {id: $userId})-[:POSTED]->(p:Post)
    OPTIONAL MATCH (p)-[:POSTED_IN]->(g:Group)
    OPTIONAL MATCH (viewer:User {id: $viewerId})
    WITH p, author, g.name AS group_name, viewer, EXISTS((viewer)-[:LIKED]->(p)) AS liked_by_me
    WHERE p.is_deleted = false
    RETURN p, author, liked_by_me, group_name
    ORDER BY p.created_at DESC
    `,
    { userId, viewerId }
  );

  return result.records.map((record) => {
    const rawPost = record.get("p").properties;
    const rawUser = record.get("author").properties;
    const likedByMe = record.get("liked_by_me");
    const groupName = record.has("group_name") ? record.get("group_name") : null;

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
      group_name: groupName,
    };
  });
};

export const getPostByIdService = async (id: string, viewerId: string): Promise<Post | null> => {
  const session = driver.session();

  const result = await session.run(
    `
    MATCH (u:User)-[:POSTED]->(p:Post {id: $id})
    WHERE p.is_deleted = false

    OPTIONAL MATCH (p)-[:HAS_COMMENT]->(c:Comment)<-[:COMMENTED]-(cu:User)
    OPTIONAL MATCH (v:User {id: $viewerId})
    OPTIONAL MATCH (v)-[lp:LIKED]->(p)
    OPTIONAL MATCH (v)-[l:LIKES]->(c)

    WHERE c IS NULL OR c.is_deleted = false

    WITH p, u, c, cu,
         lp IS NOT NULL AS liked_by_me,
         l IS NOT NULL AS liked_by_user

    RETURN p, u, liked_by_me,
      collect({
        id: c.id,
        content: c.content,
        created_at: c.created_at,
        likes_count: c.likes_count,
        liked_by_user: liked_by_user,
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

  if (result.records.length === 0) {
    await session.close();
    return null;
  }

  const record = result.records[0];
  const rawPost = record.get("p").properties;
  const rawUser = record.get("u").properties;
  const rawComments = record.get("comments") || [];
  const likedByMe = record.get("liked_by_me");

  await session.close();

  return {
    ...rawPost,
    likes_count: toNumber(rawPost.likes_count),
    comments_count: toNumber(rawPost.comments_count),
    reposts_count: toNumber(rawPost.reposts_count),
    created_at: timestampToDate(rawPost.created_at),
    updated_at: timestampToDate(rawPost.updated_at),
    media_urls: rawPost.media_urls || [],
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
        likes_count: toNumber(c.likes_count ?? 0),
        liked_by_user: c.liked_by_user ?? false,
        author: c.author,
      })),
  };
};

export const togglePostLikeService = async (userId: string, postId: string): Promise<Post> => {
  const session = driver.session();
  try {
    const result = await session.run(
      `
      MATCH (u:User {id: $userId}), (p:Post {id: $postId})
      OPTIONAL MATCH (u)-[r:LIKED]->(p)
      WITH u, p, r,
           CASE WHEN r IS NOT NULL THEN true ELSE false END AS alreadyLiked
      FOREACH (_ IN CASE WHEN alreadyLiked THEN [1] ELSE [] END |
        DELETE r
        SET p.likes_count = coalesce(p.likes_count, 1) - 1
      )
      FOREACH (_ IN CASE WHEN NOT alreadyLiked THEN [1] ELSE [] END |
        CREATE (u)-[:LIKED]->(p)
        SET p.likes_count = coalesce(p.likes_count, 0) + 1
      )
      WITH u, p
      OPTIONAL MATCH (u)-[r2:LIKED]->(p)
      RETURN p, r2 IS NOT NULL AS liked_by_me
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
  } finally {
    await session.close();
  }
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
export const toggleCommentLikeService = async (userId: string, commentId: string) => {
  const session = driver.session();
  const result = await session.run(
    `
    MATCH (u:User {id: $userId}), (c:Comment {id: $commentId})
    OPTIONAL MATCH (u)-[r:LIKES]->(c)
    WITH u, c, r, 
        CASE WHEN r IS NOT NULL THEN true ELSE false END AS alreadyLiked
    FOREACH (_ IN CASE WHEN alreadyLiked THEN [1] ELSE [] END |
      DELETE r
      SET c.likes_count = coalesce(c.likes_count, 1) - 1
    )
    FOREACH (_ IN CASE WHEN NOT alreadyLiked THEN [1] ELSE [] END |
      CREATE (u)-[:LIKES]->(c)
      SET c.likes_count = coalesce(c.likes_count, 0) + 1
    )
    RETURN c
    `,
    { userId, commentId }
  );

  const record = result.records[0];
  const c = record.get("c").properties;

  return {
    id: c.id,
    content: c.content,
    likes_count: neo4j.integer.toNumber(c.likes_count),
    is_deleted: c.is_deleted,
    created_at: new Date(c.created_at.toString()).toISOString(),
    updated_at: new Date(c.updated_at.toString()).toISOString(),
  };
};
