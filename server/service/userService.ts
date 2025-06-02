import { driver } from "../db/neo4j";
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
      status: "active",
    }
  );

  const createdUser = result.records[0].get("u").properties;
  return createdUser;
};

export const getUserByIdService = async (id: string) => {
  const session = driver.session();
  const result = await session.run(
    `
    MATCH (u:User {id: $id})
    OPTIONAL MATCH (u)-[:FRIENDS_WITH]-(f:User)
    OPTIONAL MATCH (u)-[:POSTED]->(p:Post)
    RETURN u, count(DISTINCT f) AS friend_count, count(DISTINCT p) AS post_count
    `,
    { id }
  );

  if (result.records.length === 0) {
    return null;
  }

  const record = result.records[0];
  const user = record.get("u").properties;
  const friendCount = record.get("friend_count").toNumber();
  const postCount = record.get("post_count").toNumber();

  return {
    ...user,
    friend_count: friendCount,
    post_count: postCount,
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

export const suggestFriendsService = async (userId: string): Promise<any[]> => {
  const session = driver.session();

  try {
    const result = await session.run(
      `
      MATCH (u:User {id: $userId})-[:FRIENDS_WITH]->(:User)-[:FRIENDS_WITH]->(suggested:User)
      WHERE NOT (u)-[:FRIENDS_WITH]-(suggested)
        AND NOT (u)-[:REQUESTED]->(suggested)
        AND NOT (suggested)-[:REQUESTED]->(u)
        AND u.id <> suggested.id
        AND suggested.privacy_level = 'public'
      
      WITH suggested, count(*) AS mutual_friends
      RETURN suggested, mutual_friends
      ORDER BY mutual_friends DESC
      LIMIT 20
      `,
      { userId }
    );

    return result.records.map((record) => {
      const user = record.get("suggested").properties;
      const mutualFriends = record.get("mutual_friends").toNumber();

      return {
        id: user.id,
        first_name: user.first_name,
        last_name: user.last_name,
        email: user.email,
        profile_picture: user.profile_picture || "",
        mutual_friends: mutualFriends,
      };
    });
  } finally {
    await session.close();
  }
};
