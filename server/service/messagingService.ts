import { session } from "../db/neo4j";
import { v4 as uuidv4 } from "uuid";

export const createConversationService = async (
  userId: string,
  participantIds: string[],
  type: "private" | "group",
  name?: string
) => {
  const conversationId = `conv-${uuidv4()}`;
  const now = new Date().toISOString();

  const result = await session.run(
    `
    CREATE (c:Conversation {
      id: $conversationId,
      type: $type,
      name: $name,
      created_at: datetime($now),
      last_message_at: datetime($now),
      is_archived: false
    })
    RETURN c
    `,
    { conversationId, type, name: name || null, now }
  );

  for (const id of [userId, ...participantIds]) {
    await session.run(
      `
      MATCH (u:User {id: $id}), (c:Conversation {id: $conversationId})
      CREATE (u)-[:PARTICIPANT_IN {joined_at: datetime($now)}]->(c)
      `,
      { id, conversationId, now }
    );
  }

  return result.records[0].get("c").properties;
};

export const sendMessageService = async (
  senderId: string,
  conversationId: string,
  content: string
) => {
  const messageId = `msg-${uuidv4()}`;
  const now = new Date().toISOString();

  const result = await session.run(
    `
    MATCH (u:User {id: $senderId}), (c:Conversation {id: $conversationId})
    CREATE (m:Message {
      id: $messageId,
      content: $content,
      created_at: datetime($now),
      type: 'text',
      is_read: false,
      is_deleted: false
    })
    CREATE (u)-[:SENT {sent_at: datetime($now)}]->(m)
    CREATE (m)-[:IN_CONVERSATION]->(c)
    SET c.last_message_at = datetime($now)
    RETURN m
    `,
    { senderId, conversationId, content, messageId, now }
  );

  return result.records[0].get("m").properties;
};

export const getMessagesService = async (conversationId: string) => {
  const result = await session.run(
    `
    MATCH (c:Conversation {id: $conversationId})<-[:IN_CONVERSATION]-(m:Message)
    WHERE m.is_deleted = false
    RETURN m ORDER BY m.created_at ASC
    `,
    { conversationId }
  );
  return result.records.map((r) => r.get("m").properties);
};

export const getUserConversationsService = async (userId: string) => {
  const result = await session.run(
    `
    MATCH (u:User {id: $userId})-[:PARTICIPANT_IN]->(c:Conversation)
    RETURN c ORDER BY c.last_message_at DESC
    `,
    { userId }
  );
  return result.records.map((r) => r.get("c").properties);
};
