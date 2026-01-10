import { driver } from "../db/neo4j";
import { v4 as uuidv4 } from "uuid";
import { Post } from "../models/Post";
import { timestampToDate, toNumber } from "../utils/neo4j";
import neo4j from "neo4j-driver";

export const createPostService = async (userId: string, body: any): Promise<Post> => {
  const postId = uuidv4();
  const now = new Date().toISOString();

  const session = driver.session();
  try {
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

    if (result.records.length === 0) {
      throw new Error("User not found");
    }

    return result.records[0].get("p").properties;
  } finally {
    await session.close();
  }
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
export const getDiscoverFeedService = async (userId: string): Promise<any[]> => {
  const session = driver.session();

  try {
    // Step 1: Count how many posts the user has liked per category
    const likedCategoriesResult = await session.run(
      `
      MATCH (:User {id: $userId})-[:LIKED]->(p:Post)
      WHERE p.category IS NOT NULL
      RETURN p.category AS category, COUNT(p) AS likeCount
      ORDER BY likeCount DESC
      `,
      { userId }
    );

    const likedCategories = likedCategoriesResult.records.map((r) => ({
      category: r.get("category"),
      count: r.get("likeCount").toNumber(),
    }));

    let personalizedPosts: any[] = [];

    // Step 2: If there is a top liked category, fetch posts from it
    if (likedCategories.length > 0) {
      const topCategory = likedCategories[0].category;

      const personalizedResult = await session.run(
        `
        MATCH (author:User)-[:POSTED]->(p:Post)
        WHERE p.category = $category
          AND author.privacy_level = 'public'
          AND p.is_deleted = false
        RETURN p, author
        ORDER BY p.created_at DESC
        LIMIT 12
        `,
        { category: topCategory }
      );

      personalizedPosts = personalizedResult.records.map((record) => {
        const rawPost = record.get("p").properties;
        const rawUser = record.get("author").properties;

        return {
          ...rawPost,
          likes_count: toNumber(rawPost.likes_count),
          comments_count: toNumber(rawPost.comments_count),
          reposts_count: toNumber(rawPost.reposts_count),
          created_at: timestampToDate(rawPost.created_at),
          updated_at: timestampToDate(rawPost.updated_at),
          author: {
            id: rawUser.id,
            name: `${rawUser.first_name} ${rawUser.last_name}`,
            email: rawUser.email,
            profile_picture: rawUser.profile_picture || "",
          },
        };
      });
    }

    const fetchedIds = personalizedPosts.map((p) => p.id);

    // Step 3: Fill the rest with random public posts not from friends or already fetched
    const fillerCount = 20 - personalizedPosts.length;

    const fillerResult = await session.run(
      `
      MATCH (s:User)-[:POSTED]->(p:Post)
      WHERE s.id <> $userId
        AND s.privacy_level = 'public'
        AND p.is_deleted = false
        AND NOT (s)-[:FRIENDS_WITH]-(:User {id: $userId})
        AND NOT (s)<-[:SENT_FRIEND_REQUEST]-(:User {id: $userId})
        AND NOT (s)-[:SENT_FRIEND_REQUEST]->(:User {id: $userId})
        AND NOT p.id IN $fetchedIds
      RETURN p, s
      ORDER BY rand()
      LIMIT $fillerCount
      `,
      {
        userId,
        fillerCount: neo4j.int(fillerCount),
        fetchedIds,
      }
    );

    const fillerPosts = fillerResult.records.map((record) => {
      const rawPost = record.get("p").properties;
      const rawUser = record.get("s").properties;

      return {
        ...rawPost,
        likes_count: toNumber(rawPost.likes_count),
        comments_count: toNumber(rawPost.comments_count),
        reposts_count: toNumber(rawPost.reposts_count),
        created_at: timestampToDate(rawPost.created_at),
        updated_at: timestampToDate(rawPost.updated_at),
        author: {
          id: rawUser.id,
          name: `${rawUser.first_name} ${rawUser.last_name}`,
          email: rawUser.email,
          profile_picture: rawUser.profile_picture || "",
        },
      };
    });

    return [...personalizedPosts, ...fillerPosts].slice(0, 20);
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

      // Fetch posts from the user's own posts
      OPTIONAL MATCH (viewer)-[:POSTED]->(ownPost:Post)
      WHERE ownPost.is_deleted = false

      // Fetch posts from the user's friends (friends with the viewer)
      OPTIONAL MATCH (viewer)-[:FRIENDS_WITH]-(f:User)-[:POSTED]->(friendPost:Post)
      WHERE friendPost.is_deleted = false

      // Fetch posts from the groups the user is a member of
      OPTIONAL MATCH (viewer)-[:MEMBER_OF]->(g:Group)-[:POSTED_IN]->(groupPost:Post)
      WHERE groupPost.is_deleted = false

      // Check if the viewer has liked these posts
      OPTIONAL MATCH (viewer)-[:LIKED]->(likedPost:Post)
      WHERE likedPost.is_deleted = false

      // Combine all posts (own, friends', and group posts)
      WITH viewer, collect(ownPost) + collect(friendPost) + collect(groupPost) AS allPosts

      // Remove duplicates and unwind all posts
      UNWIND allPosts AS post
      WITH DISTINCT post, viewer

      // Check if the viewer has liked this post
      OPTIONAL MATCH (viewer)-[:LIKED]->(liked:Post)
      WHERE liked = post

      // Fetch the post's author
      MATCH (author:User)-[:POSTED]->(post)

      // Fetch group if the post is associated with one
      OPTIONAL MATCH (post)-[:POSTED_IN]->(g:Group)

      // Return post details, author, like status, and group name if applicable
      RETURN post,
             author,
             liked IS NOT NULL AS liked_by_me,
             COUNT { (post)-[:HAS_COMMENT]->(:Comment) } AS comments_count,
             g.name AS group_name
      ORDER BY post.created_at DESC  // Ensure chronological order by creation date
      LIMIT 20
      `,
      { viewerId }
    );

    // Process the results
    return result.records.map((record) => {
      const rawPost = record.get("post").properties;
      const rawUser = record.get("author").properties;
      const likedByMe = record.get("liked_by_me");
      const commentsCount = record.get("comments_count").toInt();
      const groupName = record.has("group_name") ? record.get("group_name") : null;

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
        group_name: groupName, // Include group name if applicable
      };
    });
  } finally {
    await session.close();
  }
};

export const repostPostService = async (userId: string, postId: string) => {
  const session = driver.session();
  const now = new Date().toISOString();

  try {
    // Check if the user has already reposted the post
    const result = await session.run(
      `
      MATCH (u:User {id: $userId}), (p:Post {id: $postId})
      OPTIONAL MATCH (u)-[r:REPOSTED]->(p)
      RETURN r
      `,
      { userId, postId }
    );

    // If the user has already reposted the post, prevent reposting again
    if (result.records.length > 0 && result.records[0].get("r")) {
      throw new Error("You have already reposted this post.");
    }

    // Create a new REPOSTED relationship between the user and the post
    const repostResult = await session.run(
      `
      MATCH (u:User {id: $userId}), (p:Post {id: $postId})
      CREATE (u)-[:REPOSTED {reposted_at: datetime($now)}]->(p)
      SET p.reposts_count = coalesce(p.reposts_count, 0) + 1
      RETURN p
      `,
      { userId, postId, now }
    );

    // Return success message or the updated post if necessary
    return { message: "Post reposted successfully." };
  } finally {
    await session.close();
  }
};
export const getRepostedPostsByUserIdService = async (
  userId: string,
  viewerId: string
): Promise<any[]> => {
  const session = driver.session();

  const result = await session.run(
    `
    MATCH (user:User {id: $userId})-[:REPOSTED]->(repostedPost:Post)
    OPTIONAL MATCH (repostedPost)-[:POSTED_IN]->(group:Group)
    OPTIONAL MATCH (viewer:User {id: $viewerId})
    OPTIONAL MATCH (viewer)-[:REPOSTED]->(repostedPost) // Check if viewer reposted the post
    WITH repostedPost, user, group, viewer, EXISTS((viewer)-[:LIKED]->(repostedPost)) AS liked_by_me, EXISTS((viewer)-[:REPOSTED]->(repostedPost)) AS reposted_by_me
    WHERE repostedPost.is_deleted = false
    RETURN repostedPost, user, liked_by_me, reposted_by_me, group.name AS group_name
    ORDER BY repostedPost.created_at DESC
    `,
    { userId, viewerId }
  );

  // Ensure we return the posts with all relevant properties, including reposted_by_me flag
  return result.records.map((record) => {
    const rawPost = record.get("repostedPost").properties;
    const rawUser = record.get("user").properties;
    const likedByMe = record.get("liked_by_me");
    const repostedByMe = record.get("reposted_by_me");
    const groupName = record.has("group_name") ? record.get("group_name") : null;

    return {
      ...rawPost,
      likes_count: toNumber(rawPost.likes_count),
      comments_count: toNumber(rawPost.comments_count),
      reposts_count: toNumber(rawPost.reposts_count),
      created_at: timestampToDate(rawPost.created_at),
      updated_at: timestampToDate(rawPost.updated_at),
      liked_by_me: likedByMe,
      reposted_by_me: repostedByMe, // Include reposted_by_me flag
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

export const getPostsByUserIdService = async (userId: string, viewerId: string): Promise<any[]> => {
  const session = driver.session();

  const result = await session.run(
    `
    MATCH (author:User {id: $userId})-[:POSTED]->(p:Post)
    OPTIONAL MATCH (p)-[:POSTED_IN]->(g:Group)
    OPTIONAL MATCH (viewer:User {id: $viewerId})
    OPTIONAL MATCH (viewer)-[:REPOSTED]->(p) // Check if the viewer has reposted the post
    WITH p, author, g.name AS group_name, viewer, EXISTS((viewer)-[:LIKED]->(p)) AS liked_by_me, EXISTS((viewer)-[:REPOSTED]->(p)) AS reposted_by_me
    WHERE p.is_deleted = false
    RETURN p, author, liked_by_me, reposted_by_me, group_name
    ORDER BY p.created_at DESC
    `,
    { userId, viewerId }
  );

  return result.records.map((record) => {
    const rawPost = record.get("p").properties;
    const rawUser = record.get("author").properties;
    const likedByMe = record.get("liked_by_me");
    const repostedByMe = record.get("reposted_by_me"); // Check if the viewer has reposted the post
    const groupName = record.has("group_name") ? record.get("group_name") : null;

    return {
      ...rawPost,
      likes_count: toNumber(rawPost.likes_count),
      comments_count: toNumber(rawPost.comments_count),
      reposts_count: toNumber(rawPost.reposts_count),
      created_at: timestampToDate(rawPost.created_at),
      updated_at: timestampToDate(rawPost.updated_at),
      liked_by_me: likedByMe,
      reposted_by_me: repostedByMe, // Add the reposted_by_me flag
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

  try {
    // Mark the post as deleted by setting `is_deleted` to true
    const result = await session.run(
      `
      MATCH (u:User {id: $userId})-[:POSTED]->(p:Post {id: $postId})
      WHERE p.is_deleted = false
      SET p.is_deleted = true,
          p.updated_at = datetime()  // Update the timestamp when deleted
      RETURN p.id AS id
      `,
      { userId, postId }
    );

    // Return `true` if the post was found and marked as deleted
    return result.records.length > 0;
  } finally {
    await session.close();
  }
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
