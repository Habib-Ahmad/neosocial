import { session } from "../db/neo4j";
import { v4 as uuidv4 } from "uuid";
import { Post } from "../models/Post";

export const createGroupService = async (creatorId: string, groupData: any) => {
  const groupId = `group-${uuidv4()}`;
  const now = new Date().toISOString();

  const {
    name,
    description,
    privacy,
    category,
    rules = "", // default empty string if undefined
    cover_image = null, // null if not provided
  } = groupData;

  const result = await session.run(
    `
    MATCH (u:User {id: $creatorId})
    CREATE (g:Group {
      id: $groupId,
      name: $name,
      description: $description,
      privacy: $privacy,
      category: $category,
      cover_image: $cover_image,
      created_at: datetime($now),
      member_count: 1,
      rules: $rules,
      is_active: true
    })
    CREATE (u)-[:CREATED {created_at: datetime($now)}]->(g)
    CREATE (u)-[:ADMIN_OF {appointed_at: datetime($now)}]->(g)
    CREATE (u)-[:MEMBER_OF {joined_at: datetime($now), role: 'admin'}]->(g)
    RETURN g
    `,
    {
      creatorId,
      groupId,
      now,
      name,
      description,
      privacy,
      category,
      cover_image,
      rules,
    }
  );

  return result.records[0].get("g").properties;
};

export const getGroupMembersService = async (groupId: string) => {
  const result = await session.run(
    `
    MATCH (u:User)-[m:MEMBER_OF]->(g:Group {id: $groupId})
    RETURN u, m
    `,
    { groupId }
  );

  return result.records.map((r) => ({
    user: r.get("u").properties,
    membership: r.get("m").properties,
  }));
};

export const submitJoinRequestService = async (
  userId: string,
  groupId: string,
  message: string
) => {
  const now = new Date().toISOString();
  const requestId = `join-req-${uuidv4()}`;

  const groupResult = await session.run(
    `MATCH (g:Group {id: $groupId}) RETURN g.privacy AS privacy`,
    { groupId }
  );

  if (groupResult.records.length === 0) throw new Error("Group not found");

  const privacy = groupResult.records[0].get("privacy");

  if (privacy === "public") {
    const result = await session.run(
      `
      MATCH (u:User {id: $userId}), (g:Group {id: $groupId})
      CREATE (u)-[:MEMBER_OF {joined_at: datetime($now), role: 'member'}]->(g)
      SET g.member_count = coalesce(g.member_count, 0) + 1
      RETURN g
      `,
      { userId, groupId, now }
    );
    return { autoJoined: true, group: result.records[0].get("g").properties };
  } else {
    const result = await session.run(
      `
      MATCH (u:User {id: $userId}), (g:Group {id: $groupId})
      CREATE (r:JoinRequest {
        id: $requestId,
        message: $message,
        status: 'pending',
        created_at: datetime($now)
      })
      CREATE (u)-[:SUBMITTED {submitted_at: datetime($now)}]->(r)
      CREATE (r)-[:FOR_GROUP]->(g)
      RETURN r
      `,
      { userId, groupId, requestId, message, now }
    );
    return { autoJoined: false, request: result.records[0].get("r").properties };
  }
};

export const getPendingRequestsService = async (groupId: string) => {
  const result = await session.run(
    `
    MATCH (r:JoinRequest)-[:FOR_GROUP]->(g:Group {id: $groupId})
    WHERE r.status = 'pending'
    RETURN r
    ORDER BY r.created_at ASC
    `,
    { groupId }
  );
  return result.records.map((r) => r.get("r").properties);
};

export const reviewJoinRequestService = async (
  reviewerId: string,
  requestId: string,
  decision: "approved" | "rejected"
) => {
  const now = new Date().toISOString();

  const result = await session.run(
    `
    MATCH (r:JoinRequest {id: $requestId})-[:FOR_GROUP]->(g:Group)
    MATCH (u:User {id: $reviewerId})
    SET r.status = $decision, r.reviewed_at = datetime($now), r.reviewed_by = $reviewerId
    CREATE (u)-[:REVIEWED {reviewed_at: datetime($now), decision: $decision}]->(r)
    WITH r, g
    OPTIONAL MATCH (u2:User)-[:SUBMITTED]->(r)
    FOREACH (_ IN CASE WHEN $decision = "approved" THEN [1] ELSE [] END |
      CREATE (u2)-[:MEMBER_OF {joined_at: datetime($now), role: "member"}]->(g)
    )
    RETURN r
    `,
    { reviewerId, requestId, decision, now }
  );

  return result.records[0]?.get("r").properties;
};
export const searchGroupsService = async (
  query: string,
  privacy: string | null = null,
  isActive: boolean | null = null,
  limit: number = 20,
  offset: number = 0
) => {
  const result = await session.run(
    `
    MATCH (g:Group)
    WHERE (
      toLower(g.name) CONTAINS toLower($query) OR
      toLower(g.description) CONTAINS toLower($query) OR
      toLower(g.category) CONTAINS toLower($query)
    )
    AND ($privacy IS NULL OR g.privacy = $privacy)
    AND ($isActive IS NULL OR g.is_active = $isActive)
    RETURN g
    ORDER BY g.member_count DESC
    SKIP $offset LIMIT $limit
    `,
    { query, privacy, isActive, limit: Number(limit), offset: Number(offset) }
  );

  return result.records.map((r) => r.get("g").properties);
};

export const createGroupPostService = async (
  userId: string,
  groupId: string,
  content: string
): Promise<Post> => {
  const now = new Date().toISOString();
  const postId = `post-${uuidv4()}`;

  // Validate that user is a member of the group
  const membershipCheck = await session.run(
    `
    MATCH (u:User {id: $userId})-[:MEMBER_OF]->(g:Group {id: $groupId})
    RETURN g
    `,
    { userId, groupId }
  );

  if (membershipCheck.records.length === 0) {
    throw new Error("User is not a member of this group");
  }

  const result = await session.run(
    `
    MATCH (u:User {id: $userId}), (g:Group {id: $groupId})
    CREATE (p:Post {
      id: $postId,
      content: $content,
      created_at: datetime($now),
      updated_at: datetime($now),
      is_deleted: false,
      likes_count: 0,
      comments_count: 0,
      reposts_count: 0,
      post_type: "group"
    })
    CREATE (u)-[:POSTED]->(p)
    CREATE (p)-[:POSTED_IN]->(g)
    RETURN p
    `,
    {
      userId,
      groupId,
      content,
      postId,
      now,
    }
  );

  return result.records[0].get("p").properties;
};
