import { driver, session } from "../db/neo4j";
import { v4 as uuidv4 } from "uuid";
import { timestampToDate } from "../utils/neo4j";

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

export const getOrCreatePrivateConversationService = async (user1: string, user2: string) => {
  const session = driver.session();
  const now = new Date().toISOString();
  const conversationId = `conv-${uuidv4()}`;

  try {
    // 1. Try to find existing conversation
    const existing = await session.run(
      `
      MATCH (u1:User {id: $user1})-[:PARTICIPANT_IN]->(c:Conversation)<-[:PARTICIPANT_IN]-(u2:User {id: $user2})
      WITH c
      MATCH (c)<-[:PARTICIPANT_IN]-(p:User)
      WITH c, COLLECT(p) AS participants
      WHERE SIZE(participants) = 2
      RETURN c, [p IN participants WHERE p.id <> $user1][0] AS other
      LIMIT 1
      `,
      { user1, user2 }
    );

    if (existing.records.length > 0) {
      const record = existing.records[0];
      const c = record.get("c").properties;
      const other = record.get("other").properties;

      // Count unread messages
      const unreadRes = await session.run(
        `
        MATCH (m:Message)-[:IN_CONVERSATION]->(:Conversation {id: $conversationId})
        WHERE NOT $user1 IN m.read_by
        RETURN COUNT(m) AS unreadCount
        `,
        { conversationId: c.id, user1 }
      );

      const unreadCount = unreadRes.records[0].get("unreadCount").toInt();

      return {
        id: c.id,
        participantId: other.id,
        participantName: other.first_name + " " + other.last_name,
        participantAvatar: other.profile_picture || null,
        lastMessage: c.last_message || null,
        lastMessageTime: timestampToDate(c.last_message_at),
        unreadCount,
      };
    }

    // 2. Create conversation node
    await session.run(
      `
      CREATE (c:Conversation {
        id: $conversationId,
        created_at: datetime($now),
        last_message_at: datetime($now)
      })
      `,
      { conversationId, now }
    );

    // 3. Link both users
    for (const id of [user1, user2]) {
      await session.run(
        `
        MATCH (u:User {id: $id}), (c:Conversation {id: $conversationId})
        CREATE (u)-[:PARTICIPANT_IN {joined_at: datetime($now)}]->(c)
        `,
        { id, conversationId, now }
      );
    }

    // 4. Fetch the other user's info to shape the response
    const result = await session.run(
      `
      MATCH (u:User {id: $user2})
      RETURN u LIMIT 1
      `,
      { user2 }
    );

    const other = result.records[0].get("u").properties;

    return {
      id: conversationId,
      participantId: other.id,
      participantName: other.name,
      participantAvatar: other.avatar,
      lastMessage: null,
      lastMessageTime: null,
      unreadCount: 0,
    };
  } finally {
    await session.close();
  }
};

export const sendMessageService = async (
  senderId: string,
  conversationId: string,
  content: string
) => {
  const session = driver.session();
  const messageId = `msg-${uuidv4()}`;
  const now = new Date().toISOString();

  try {
    await session.run(
      `
      MATCH (u:User {id: $senderId}), (c:Conversation {id: $conversationId})
      CREATE (m:Message {
        id: $messageId,
        content: $content,
        created_at: datetime($now),
        read_by: $emptyList
      })
      CREATE (u)-[:SENT]->(m)-[:IN_CONVERSATION]->(c)
      SET c.last_message = $content, c.last_message_at = datetime($now)
      `,
      {
        senderId,
        conversationId,
        content,
        messageId,
        now,
        emptyList: [],
      }
    );

    // Get receiverId
    const receiverRes = await session.run(
      `
      MATCH (c:Conversation {id: $conversationId})<-[:PARTICIPANT_IN]-(u:User)
      WHERE u.id <> $senderId
      RETURN u.id AS receiverId
      `,
      { conversationId, senderId }
    );

    const receiverId = receiverRes.records[0]?.get("receiverId");

    return {
      message: {
        id: messageId,
        senderId,
        conversationId,
        content,
        createdAt: now,
        read_by: [],
      },
      receiverId,
    };
  } finally {
    await session.close();
  }
};

export const getMessagesService = async (conversationId: string, userId: string) => {
  const session = driver.session();

  try {
    const result = await session.run(
      `
      MATCH (m:Message)-[:IN_CONVERSATION]->(c:Conversation {id: $conversationId})
      MATCH (sender:User)-[:SENT]->(m)
      WITH m, sender, c
      MATCH (c)<-[:PARTICIPANT_IN]-(participant:User)
      WITH m, sender, COLLECT(participant.id) AS participantIds
      RETURN m, sender, participantIds
      ORDER BY m.created_at ASC
      `,
      { conversationId }
    );

    return result.records.map((record) => {
      const m = record.get("m").properties;
      const sender = record.get("sender").properties;
      const participantIds = record.get("participantIds");

      const receiverId = participantIds.find((id: string) => id !== sender.id);

      return {
        id: m.id,
        senderId: sender.id,
        receiverId,
        content: m.content,
        createdAt: timestampToDate(m.created_at),
        read: m.read,
      };
    });
  } finally {
    await session.close();
  }
};

export const getUserConversationsService = async (
  userId: string,
  onlineUsers: Record<string, string>
) => {
  const session = driver.session();

  const result = await session.run(
    `
    MATCH (u:User {id: $userId})-[:PARTICIPANT_IN]->(c:Conversation)<-[:PARTICIPANT_IN]-(other:User)
    WHERE other.id <> $userId

    OPTIONAL MATCH (c)<-[:IN_CONVERSATION]-(m:Message)
    
    WITH c, other, 
         MAX(m.created_at) AS lastMessageTime, 
         LAST(collect(m)) AS lastMessage,
         COUNT(CASE WHEN NOT $userId IN m.read_by THEN 1 ELSE NULL END) AS unreadCount

    RETURN 
      c, 
      other, 
      lastMessage.content AS lastMessageContent, 
      coalesce(lastMessageTime, c.last_message_at) AS resolvedLastMessageTime,
      unreadCount
    ORDER BY resolvedLastMessageTime DESC
    `,
    { userId }
  );

  return result.records.map((record) => {
    const c = record.get("c").properties;
    const other = record.get("other").properties;
    const lastMessageContent = record.get("lastMessageContent") || null;
    const lastMessageTime = record.get("resolvedLastMessageTime") || null;
    const unreadCount = record.get("unreadCount").toInt();

    return {
      id: c.id,
      participantId: other.id,
      participantName: `${other.first_name} ${other.last_name}`,
      participantAvatar: other.profile_picture || null,
      lastMessage: lastMessageContent,
      lastMessageTime: lastMessageTime ? timestampToDate(lastMessageTime) : null,
      unreadCount,
      online: !!onlineUsers[other.id],
    };
  });
};

export const markMessagesAsReadService = async (conversationId: string, userId: string) => {
  const session = driver.session();
  await session.run(
    `
      MATCH (m:Message)-[:IN_CONVERSATION]->(:Conversation {id: $conversationId})
      WHERE NOT $userId IN m.read_by
      SET m.read_by = coalesce(m.read_by, []) + $userId
      RETURN count(m) AS marked
      `,
    { conversationId, userId }
  );
};
