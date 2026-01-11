import { driver } from "../db/neo4j";
import { v4 as uuidv4 } from "uuid";

export const createNotificationService = async ({
  userId,
  actorId,
  type,
  postId,
}: {
  userId: string;
  actorId: string;
  type: string;
  postId?: string;
}) => {
  const session = driver.session();
  try {
    const notifId = `notif-${uuidv4()}`;
    const now = new Date().toISOString();

    const result = await session.run(
      `
      MATCH (recipient:User {id: $userId})
      MATCH (actor:User {id: $actorId})
      CREATE (n:Notification {
        id: $notifId,
        type: $type,
        post_id: $postId,
        is_read: false,
        created_at: datetime($now)
      })
      CREATE (recipient)-[:RECEIVES]->(n)
      CREATE (actor)-[:TRIGGERED]->(n)
      RETURN n, actor.first_name AS actor_first_name, actor.last_name AS actor_last_name
      `,
      {
        notifId,
        userId,
        actorId,
        type,
        postId: postId || null,
        now,
      }
    );

    const record = result.records[0];
    return {
      ...record.get("n").properties,
      actor_name: `${record.get("actor_first_name")} ${record.get("actor_last_name")}`,
    };
  } finally {
    await session.close();
  }
};

export const getUserNotificationsService = async (userId: string) => {
  const session = driver.session();
  try {
    const result = await session.run(
      `
      MATCH (u:User {id: $userId})-[:RECEIVES]->(n:Notification)
      MATCH (actor:User)-[:TRIGGERED]->(n)
      RETURN n, actor.first_name AS actor_first_name, actor.last_name AS actor_last_name, actor.id AS actor_id
      ORDER BY n.created_at DESC
      LIMIT 100
      `,
      { userId }
    );

    return result.records.map((r) => ({
      ...r.get("n").properties,
      actor_name: `${r.get("actor_first_name")} ${r.get("actor_last_name")}`,
      actor_id: r.get("actor_id"),
      created_at: r.get("n").properties.created_at,
    }));
  } finally {
    await session.close();
  }
};

export const markNotificationAsReadService = async (notifId: string) => {
  const session = driver.session();
  try {
    await session.run(
      `
      MATCH (n:Notification {id: $notifId})
      SET n.is_read = true
      RETURN n
      `,
      { notifId }
    );
  } finally {
    await session.close();
  }
};

