import { session } from "../db/neo4j";
import { v4 as uuidv4 } from "uuid";

export const createNotificationService = async ({
  recipientId,
  actorId,
  type,
  title,
  message,
  targetId,
  targetLabel,
  action,
  actionUrl,
  metadata,
}: {
  recipientId: string;
  actorId: string;
  type: string;
  title: string;
  message: string;
  targetId: string;
  targetLabel: string;
  action: string;
  actionUrl: string;
  metadata?: Record<string, any>;
}) => {
  const notifId = `notif-${uuidv4()}`;
  const now = new Date().toISOString();

  const result = await session.run(
    `
    MATCH (recipient:User {id: $recipientId})
    MATCH (actor:User {id: $actorId})
    MATCH (target:${targetLabel} {id: $targetId})
    CREATE (n:Notification {
      id: $notifId,
      type: $type,
      title: $title,
      message: $message,
      is_read: false,
      created_at: datetime($now),
      action_url: $actionUrl,
      metadata: $metadata
    })
    CREATE (recipient)-[:RECEIVES]->(n)
    CREATE (actor)-[:TRIGGERED {action: $action, triggered_at: datetime($now)}]->(n)
    CREATE (n)-[:ABOUT {target_type: $targetLabel}]->(target)
    RETURN n
    `,
    {
      notifId,
      recipientId,
      actorId,
      type,
      title,
      message,
      targetId,
      targetLabel,
      action,
      actionUrl,
      metadata: metadata ? JSON.stringify(metadata) : null,
      now,
    }
  );

  return result.records[0].get("n").properties;
};

export const getUserNotificationsService = async (userId: string) => {
  const result = await session.run(
    `
    MATCH (:User {id: $userId})-[:RECEIVES]->(n:Notification)
    RETURN n ORDER BY n.created_at DESC
    LIMIT 100
    `,
    { userId }
  );
  return result.records.map((r) => r.get("n").properties);
};

export const markNotificationAsReadService = async (notifId: string) => {
  await session.run(
    `
    MATCH (n:Notification {id: $notifId})
    SET n.is_read = true
    `
  );
};
