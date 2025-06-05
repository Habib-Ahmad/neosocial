import { driver, session } from "../db/neo4j";
import neo4j from "neo4j-driver";
import { User } from "../models/User";
export const createUser = async (user: User) => {
  const session = driver.session();

  const result = await session.run(
    `
    CREATE (u:User {
      id: $id,
      email: $email,
      password_hash: $password_hash,
      first_name: $first_name,
      last_name: $last_name,
      profile_picture: $profile_picture,
      created_at: datetime(),
      status: $status
    })
    RETURN u
    `,
    {
      id: user.id,
      email: user.email,
      password_hash: user.password,
      first_name: user.first_name,
      last_name: user.last_name,
      profile_picture: user.profile_picture || "", // Default to empty if undefined
      status: "active",
    }
  );

  const createdUser = result.records[0].get("u").properties;
  return createdUser;
};

export const getUserByIdService = async (id: string, currentUserId?: string) => {
  const session = driver.session();
  const result = await session.run(
    `
    MATCH (u:User {id: $id})
    OPTIONAL MATCH (u)-[:FRIENDS_WITH]-(f:User)
    OPTIONAL MATCH (u)-[:POSTED]->(p:Post)

    OPTIONAL MATCH (me:User {id: $currentUserId})
    OPTIONAL MATCH (me)-[fr:FRIENDS_WITH]-(u)
    OPTIONAL MATCH (me)-[sent:SENT_FRIEND_REQUEST]->(u)
    OPTIONAL MATCH (u)-[received:SENT_FRIEND_REQUEST]->(me)

    RETURN u,
           count(DISTINCT f) AS friend_count,
           count(DISTINCT p) AS post_count,
           fr IS NOT NULL AS is_friend,
           sent IS NOT NULL AS sent_request,
           received IS NOT NULL AS received_request
    `,
    { id, currentUserId }
  );

  if (result.records.length === 0) return null;

  const record = result.records[0];
  const user = record.get("u").properties;

  return {
    ...user,
    friend_count: record.get("friend_count").toNumber(),
    post_count: record.get("post_count").toNumber(),
    is_friend: record.get("is_friend"),
    sent_request: record.get("sent_request"),
    received_request: record.get("received_request"),
  };
};

export const getUserByEmail = async (email: string) => {
  const session = driver.session();
  const result = await session.run(
    `
    MATCH (u:User {email: $email})
    RETURN u
    `,
    { email }
  );

  if (result.records.length === 0) {
    return null;
  }

  return result.records[0].get("u").properties;
};

export const updateUser = async (id: string, updates: Partial<User>) => {
  const setClauses = Object.entries(updates)
    .map(([key, value]) => `u.${key} = $${key}`)
    .join(", ");

  const session = driver.session();
  const result = await session.run(
    `
    MATCH (u:User {id: $id})
    SET ${setClauses}
    RETURN u
    `,
    { id, ...updates }
  );

  if (result.records.length === 0) {
    return null;
  }

  return result.records[0].get("u").properties;
};

export const sendFriendRequestService = async (fromId: string, toId: string): Promise<boolean> => {
  const session = driver.session();
  const check = await session.run(
    `
    MATCH (from:User {id: $fromId})-[r]->(to:User {id: $toId})
    WHERE type(r) IN ['SENT_FRIEND_REQUEST', 'FRIENDS_WITH']
    RETURN r
    `,
    { fromId, toId }
  );

  if (check.records.length > 0) return false;

  await session.run(
    `
    MATCH (from:User {id: $fromId}), (to:User {id: $toId})
    CREATE (from)-[:SENT_FRIEND_REQUEST]->(to)
    `,
    { fromId, toId }
  );

  return true;
};

export const acceptFriendRequestService = async (
  fromId: string,
  toId: string
): Promise<boolean> => {
  const session = driver.session();

  const result = await session.run(
    `
    MATCH (from:User {id: $fromId})-[r:SENT_FRIEND_REQUEST]->(to:User {id: $toId})
    DELETE r
    MERGE (from)-[:FRIENDS_WITH]->(to)
    MERGE (to)-[:FRIENDS_WITH]->(from)
    RETURN from.id
    `,
    { fromId, toId }
  );

  return result.records.length > 0;
};

export const rejectFriendRequestService = async (
  fromId: string,
  toId: string
): Promise<boolean> => {
  const session = driver.session();

  const result = await session.run(
    `
    MATCH (from:User {id: $fromId})-[r:SENT_FRIEND_REQUEST]->(to:User {id: $toId})
    DELETE r
    RETURN from.id
    `,
    { fromId, toId }
  );

  return result.records.length > 0;
};

export const cancelFriendRequestService = async (
  fromId: string,
  toId: string
): Promise<boolean> => {
  const session = driver.session();

  const result = await session.run(
    `
    MATCH (from:User {id: $fromId})-[r:SENT_FRIEND_REQUEST]->(to:User {id: $toId})
    DELETE r
    RETURN from.id
    `,
    { fromId, toId }
  );

  return result.records.length > 0;
};
export const searchUsersService = async (
  query: string,
  status: string | null = null,
  limit: number = 20,
  offset: number = 0,
  currentUserId: string
) => {
  const session = driver.session();

  const result = await session.run(
    `
    MATCH (u:User)
    WHERE (
      toLower(u.username) CONTAINS toLower($query) OR
      toLower(u.first_name) CONTAINS toLower($query) OR
      toLower(u.last_name) CONTAINS toLower($query) OR
      toLower(u.email) CONTAINS toLower($query)
    )
    AND u.id <> $currentUserId
    AND ($status IS NULL OR u.status = $status)

    OPTIONAL MATCH (u)-[:FRIENDS_WITH]-(mutual:User)-[:FRIENDS_WITH]-(me:User {id: $currentUserId})
    WHERE mutual.id <> u.id AND mutual.id <> $currentUserId

    RETURN u, count(DISTINCT mutual) AS mutual_friends_count
    ORDER BY u.last_active DESC
    SKIP $offset LIMIT $limit
    `,
    {
      query,
      currentUserId,
      status,
      limit: neo4j.int(limit),
      offset: neo4j.int(offset),
    }
  );

  return result.records.map((r) => {
    const { password_hash, ...user } = r.get("u").properties;
    return {
      ...user,
      mutual_friends_count: r.get("mutual_friends_count").toInt(),
    };
  });
};

export const getUserFriendsService = async (userId: string): Promise<any[]> => {
  const session = driver.session();

  const result = await session.run(
    `
    MATCH (u:User {id: $userId})-[:FRIENDS_WITH]-(friend:User)
    
    OPTIONAL MATCH (u)-[:FRIENDS_WITH]-(mutual:User)-[:FRIENDS_WITH]-(friend)
    WHERE mutual.id <> friend.id AND mutual.id <> u.id
    
    RETURN DISTINCT friend, count(DISTINCT mutual) AS mutualCount
    ORDER BY friend.first_name, friend.last_name
    `,
    { userId }
  );

  return result.records.map((record) => {
    const friend = record.get("friend").properties;
    const mutualCount = record.get("mutualCount").toInt();

    return {
      id: friend.id,
      first_name: friend.first_name,
      last_name: friend.last_name,
      email: friend.email,
      profile_picture: friend.profile_picture || "",
      mutual_friends_count: mutualCount,
    };
  });
};

export const getFriendRequestsService = async (userId: string): Promise<any[]> => {
  const session = driver.session();

  const receivedResult = await session.run(
    `
    MATCH (u:User {id: $userId})<-[:SENT_FRIEND_REQUEST]-(from:User)
    OPTIONAL MATCH (u)-[:FRIENDS_WITH]-(mutual:User)-[:FRIENDS_WITH]-(from)
    RETURN from, count(DISTINCT mutual) AS mutualCount
    `,
    { userId }
  );

  const received = receivedResult.records.map((record) => {
    const from = record.get("from").properties;
    const mutualCount = record.get("mutualCount").toNumber();
    return {
      id: from.id,
      first_name: from.first_name,
      last_name: from.last_name,
      email: from.email,
      profile_picture: from.profile_picture || "",
      type: "received",
      mutual_friends_count: mutualCount,
    };
  });

  const sentResult = await session.run(
    `
    MATCH (u:User {id: $userId})-[:SENT_FRIEND_REQUEST]->(to:User)
    OPTIONAL MATCH (u)-[:FRIENDS_WITH]-(mutual:User)-[:FRIENDS_WITH]-(to)
    RETURN to, count(DISTINCT mutual) AS mutualCount
    `,
    { userId }
  );

  const sent = sentResult.records.map((record) => {
    const to = record.get("to").properties;
    const mutualCount = record.get("mutualCount").toNumber();
    return {
      id: to.id,
      first_name: to.first_name,
      last_name: to.last_name,
      email: to.email,
      profile_picture: to.profile_picture || "",
      type: "sent",
      mutual_friends_count: mutualCount,
    };
  });

  return [...received, ...sent];
};

export const removeFriendService = async (userId: string, friendId: string): Promise<boolean> => {
  const session = driver.session();
  try {
    const result = await session.run(
      `
      MATCH (u:User {id: $userId})-[r1:FRIENDS_WITH]-(f:User {id: $friendId})
      DELETE r1
      `,
      { userId, friendId }
    );

    return result.summary.counters.updates().relationshipsDeleted > 0;
  } finally {
    await session.close();
  }
};

export const suggestFriendsService = async (userId: string, limit: number = 20): Promise<any[]> => {
  const session = driver.session();

  try {
    // Step 1: Get suggested users (friends of friends not already friends or requested)
    const result = await session.run(
      `
      MATCH (u:User {id: $userId})
      MATCH (u)-[:FRIENDS_WITH]->(:User)-[:FRIENDS_WITH]->(s:User)
      WHERE NOT (u)-[:FRIENDS_WITH]-(s)
        AND NOT (u)-[:SENT_FRIEND_REQUEST]->(s)
        AND NOT (s)-[:SENT_FRIEND_REQUEST]->(u)
        AND s.id <> $userId
      OPTIONAL MATCH (u)-[:FRIENDS_WITH]-(mutual:User)-[:FRIENDS_WITH]-(s)
      WITH s, count(DISTINCT mutual) AS mutualCount
      RETURN s, mutualCount
      ORDER BY mutualCount DESC
      LIMIT $limit
      `,
      { userId, limit: neo4j.int(limit) }
    );

    const suggestions = result.records.map((record) => {
      const user = record.get("s").properties;
      return {
        id: user.id,
        first_name: user.first_name,
        last_name: user.last_name,
        email: user.email,
        profile_picture: user.profile_picture || "",
        mutual_friends_count: record.get("mutualCount").toInt(),
      };
    });

    // Step 2: If fewer than limit, fill with random users not friends/requested
    if (suggestions.length < limit) {
      const fillerResult = await session.run(
        `
        MATCH (s:User)
        WHERE s.id <> $userId
          AND NOT (s)-[:FRIENDS_WITH]-(:User {id: $userId})
          AND NOT (s)<-[:SENT_FRIEND_REQUEST]-(:User {id: $userId})
          AND NOT (s)-[:SENT_FRIEND_REQUEST]->(:User {id: $userId})
        RETURN s
        ORDER BY rand()
        LIMIT $fill
        `,
        {
          userId,
          fill: neo4j.int(limit - suggestions.length),
        }
      );

      const filler = fillerResult.records.map((r) => {
        const user = r.get("s").properties;
        return {
          id: user.id,
          first_name: user.first_name,
          last_name: user.last_name,
          email: user.email,
          profile_picture: user.profile_picture || "",
          mutual_friends_count: 0,
        };
      });

      return [...suggestions, ...filler];
    }

    return suggestions;
  } finally {
    await session.close();
  }
};
export const getUserGroupsService = async (userId: string) => {
  const result = await session.run(
    `
    MATCH (u:User {id: $userId})-[:MEMBER_OF]->(g:Group)
    RETURN g ORDER BY g.created_at DESC
    `,
    { userId }
  );

  const groups = result.records.map((record) => record.get("g").properties);
  return groups;
};
