import { session } from "../db/neo4j";
import { User } from "../models/User";

export const createUser = async (user: User) => {
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

export const getUserById = async (id: string) => {
  const result = await session.run(
    `
    MATCH (u:User {id: $id})
    RETURN u
    `,
    { id }
  );
  if (result.records.length === 0) {
    return null;
  }
  return result.records[0].get("u").properties;
};

export const getUserByEmail = async (email: string) => {
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
  const check = await session.run(
    `
    MATCH (from:User {id: $fromId})-[r]->(to:User {id: $toId})
    WHERE type(r) IN ['REQUESTED', 'FRIENDS']
    RETURN r
    `,
    { fromId, toId }
  );
  if (check.records.length > 0) return false;

  const result = await session.run(
    `
    MATCH (from:User {id: $fromId}), (to:User {id: $toId})
    CREATE (from)-[:REQUESTED]->(to)
    `,
    { fromId: fromId, toId }
  );

  return result.records[0].get("success");
};

export const acceptFriendRequestService = async (
  fromId: string,
  toId: string
): Promise<boolean> => {
  const result = await session.run(
    `
    MATCH (from:User {id: $fromId})-[r:REQUESTED]->(to:User {id: $toId})
    DELETE r
    CREATE (from)-[:FRIENDS]->(to)
    CREATE (to)-[:FRIENDS]->(from)
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
  const result = await session.run(
    `
    MATCH (from:User {id: $fromId})-[r:REQUESTED]->(to:User {id: $toId})
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
  const result = await session.run(
    `
    MATCH (from:User {id: $fromId})-[r:REQUESTED]->(to:User {id: $toId})
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
  offset: number = 0
) => {
  const result = await session.run(
    `
    MATCH (u:User)
    WHERE (
      toLower(u.username) CONTAINS toLower($query) OR
      toLower(u.first_name) CONTAINS toLower($query) OR
      toLower(u.last_name) CONTAINS toLower($query) OR
      toLower(u.email) CONTAINS toLower($query)
    )
    AND ($status IS NULL OR u.status = $status)
    RETURN u
    ORDER BY u.last_active DESC
    SKIP $offset LIMIT $limit
    `,
    { query, status, limit: Number(limit), offset: Number(offset) }
  );

  return result.records.map((r) => {
    const { password_hash, ...user } = r.get("u").properties;
    return user;
  });
};
