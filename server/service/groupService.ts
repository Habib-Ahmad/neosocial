import { session, driver } from "../db/neo4j";
import { v4 as uuidv4 } from "uuid";
import neo4j from "neo4j-driver";

// Get all group names for uniqueness validation
export const getAllGroupNamesService = async (): Promise<string[]> => {
  const result = await session.run(`MATCH (g:Group) RETURN g.name as name`);
  return result.records.map((record) => record.get("name"));
};

export const createGroupService = async (creatorId: string, groupData: any) => {
  const groupId = `group-${uuidv4()}`;
  const now = new Date().toISOString();

  const { name, description, category, rules = "", cover_image = null } = groupData;

  const result = await session.run(
    `
    MATCH (u:User {id: $creatorId})
    CREATE (g:Group {
      id: $groupId,
      name: $name,
      description: $description,
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

export const submitJoinRequestService = async (userId: string, groupId: string) => {
  const now = new Date().toISOString();
  const requestId = `join-req-${uuidv4()}`;

  const groupResult = await session.run(`MATCH (g:Group {id: $groupId}) RETURN g`, { groupId });

  if (groupResult.records.length === 0) throw new Error("Group not found");

  const result = await session.run(
    `
    MATCH (u:User {id: $userId}), (g:Group {id: $groupId})
    CREATE (r:JoinRequest {
      id: $requestId,
      message: "",
      status: 'pending',
      created_at: datetime($now)
    })
    CREATE (u)-[:SUBMITTED {submitted_at: datetime($now)}]->(r)
    CREATE (r)-[:FOR_GROUP]->(g)
    RETURN r
    `,
    { userId, groupId, requestId, now }
  );
  return { request: result.records[0].get("r").properties };
};

export const getSentJoinRequestService = async (userId: string) => {
  const result = await session.run(
    `
    MATCH (u:User {id: $userId})-[:SUBMITTED]->(r:JoinRequest)-[:FOR_GROUP]->(g:Group)
    RETURN r, g
    ORDER BY r.created_at DESC
    `,
    { userId }
  );

  return result.records.map((record) => ({
    request: record.get("r").properties,
    group: record.get("g").properties,
  }));
};
export const getReceivedJoinRequestService = async (userId: string) => {
  const result = await session.run(
    `
    MATCH (admin:User {id: $userId})-[:ADMIN_OF]->(g:Group)
    MATCH (r:JoinRequest {status: 'pending'})-[:FOR_GROUP]->(g)
    MATCH (sender:User)-[:SUBMITTED]->(r)
    RETURN r, g, sender
    ORDER BY r.created_at ASC
    `,
    { userId }
  );

  return result.records.map((record) => ({
    request: record.get("r").properties,
    group: record.get("g").properties,
    sender: record.get("sender").properties,
  }));
};

export const cancelJoinRequestService = async (userId: string, requestId: string) => {
  const result = await session.run(
    `
    MATCH (u:User {id: $userId})-[:SUBMITTED]->(r:JoinRequest {id: $requestId})
    DETACH DELETE r
    RETURN r
    `,
    { userId, requestId }
  );

  if (result.records.length === 0) {
    throw new Error("Request not found or not owned by user");
  }

  return { success: true };
};
export const acceptJoinRequestService = async (reviewerId: string, requestId: string) => {
  const now = new Date().toISOString();

  const result = await session.run(
    `
    MATCH (r:JoinRequest {id: $requestId})-[:FOR_GROUP]->(g:Group)
    MATCH (reviewer:User {id: $reviewerId})
    OPTIONAL MATCH (sender:User)-[:SUBMITTED]->(r)

    // Update and review
    SET r.status = 'approved', r.reviewed_at = datetime($now), r.reviewed_by = $reviewerId
    CREATE (reviewer)-[:REVIEWED {reviewed_at: datetime($now), decision: "approved"}]->(r)

    // Membership
    CREATE (sender)-[:MEMBER_OF {joined_at: datetime($now), role: "member"}]->(g)

    // Delete request
    DETACH DELETE r

    RETURN g
    `,
    { reviewerId, requestId, now }
  );

  return result.records[0]?.get("g").properties;
};
export const rejectJoinRequestService = async (reviewerId: string, requestId: string) => {
  const now = new Date().toISOString();

  const result = await session.run(
    `
    MATCH (r:JoinRequest {id: $requestId})-[:FOR_GROUP]->(g:Group)
    MATCH (reviewer:User {id: $reviewerId})

    // Update and review
    SET r.status = 'rejected', r.reviewed_at = datetime($now), r.reviewed_by = $reviewerId
    CREATE (reviewer)-[:REVIEWED {reviewed_at: datetime($now), decision: "rejected"}]->(r)

    // Delete request
    DETACH DELETE r

    RETURN g
    `,
    { reviewerId, requestId, now }
  );

  return result.records[0]?.get("g").properties;
};
export const suggestGroupsService = async (userId: string, limit: number = 20): Promise<any[]> => {
  const convertProps = (obj: any) => {
    const props = obj.properties;
    const converted: any = {};
    for (const key in props) {
      converted[key] =
        typeof props[key]?.toNumber === "function" ? props[key].toNumber() : props[key];
    }
    return converted;
  };

  const result = await session.run(
    `
    MATCH (u:User {id: $userId})-[:FRIENDS_WITH]-(f:User)-[:MEMBER_OF]->(g:Group)
    WHERE NOT (u)-[:MEMBER_OF]->(g)
    OPTIONAL MATCH (g)<-[:MEMBER_OF]-(m:User)
    RETURN g, count(DISTINCT f) AS friendCount, count(DISTINCT m) AS memberCount
    ORDER BY friendCount DESC
    LIMIT $limit
    `,
    { userId, limit: neo4j.int(limit) }
  );

  const suggestedGroups = result.records.map((r) => {
    const group = convertProps(r.get("g"));
    const friend_count = r.get("friendCount").toNumber();
    const member_count = r.get("memberCount").toNumber();
    return { ...group, friend_count, member_count };
  });

  const excludedIds = suggestedGroups.map((g) => g.id);

  if (suggestedGroups.length < limit) {
    const fillerResult = await session.run(
      `
      MATCH (g:Group)
      WHERE NOT (:User {id: $userId})-[:MEMBER_OF]->(g)
        AND NOT g.id IN $excludedIds
      RETURN g, g.member_count AS memberCount
      ORDER BY rand()
      LIMIT $fill
      `,
      {
        userId,
        excludedIds,
        fill: neo4j.int(limit - suggestedGroups.length),
      }
    );

    const filler = fillerResult.records.map((r) => {
      const group = convertProps(r.get("g"));
      const member_count =
        typeof r.get("memberCount")?.toNumber === "function" ? r.get("memberCount").toNumber() : 0;
      return { ...group, friend_count: 0, member_count };
    });

    return [...suggestedGroups, ...filler];
  }

  return suggestedGroups;
};

export const searchGroupsService = async (query: string) => {
  const result = await session.run(
    `
    MATCH (g:Group)
    WHERE (
      toLower(g.name) CONTAINS toLower($query) OR
      toLower(g.description) CONTAINS toLower($query) OR
      toLower(g.category) CONTAINS toLower($query)
    )
    OPTIONAL MATCH (g)<-[:MEMBER_OF]-(m:User)
    RETURN g, COUNT(m) AS memberCount
    ORDER BY g.member_count DESC
    LIMIT 20
    `,
    { query }
  );

  return result.records.map((r) => {
    const group = r.get("g").properties;
    const member_count = r.get("memberCount").toNumber();
    return { ...group, member_count };
  });
};

export const getGroupDetailsService = async (groupId: string, userId: string) => {
  const session = driver.session();

  const result = await session.run(
    `
    MATCH (g:Group {id: $groupId})
    OPTIONAL MATCH (u:User {id: $userId})

    OPTIONAL MATCH (u)-[:MEMBER_OF]->(g)
    WITH g, u, EXISTS((u)-[:MEMBER_OF]->(g)) AS isMember

    OPTIONAL MATCH (u)-[:ADMIN_OF]->(g)
    WITH g, u, isMember, EXISTS((u)-[:ADMIN_OF]->(g)) AS isAdmin

    OPTIONAL MATCH (u)-[:SUBMITTED]->(r:JoinRequest)-[:FOR_GROUP]->(g)
    WHERE r.status = 'pending'
    WITH g, u, isMember, isAdmin, r, EXISTS((u)-[:SUBMITTED]->(r)) AS hasRequested

    OPTIONAL MATCH (mUser:User)-[m:MEMBER_OF]->(g)
    WITH g, u, r, isMember, isAdmin, hasRequested,
         COLLECT({ user: mUser, membership: m }) AS members,
         COUNT(mUser) AS memberCount

    OPTIONAL MATCH (u)-[:FRIENDS_WITH]-(f:User)-[:MEMBER_OF]->(g)
    WITH g, r, members, memberCount,
         COUNT(DISTINCT f) AS friendCount,
         isAdmin, isMember, hasRequested

    OPTIONAL MATCH (author:User)-[:POSTED]->(p:Post)-[:POSTED_IN]->(g)
    WITH g, r, members, memberCount, friendCount, isAdmin, isMember, hasRequested,
         COLLECT({ post: p, author: author }) AS postsWithAuthors

    RETURN g, members, postsWithAuthors, isAdmin, isMember, hasRequested,
           memberCount, friendCount,
           r.id AS joinRequestId
    `,
    { groupId, userId }
  );

  if (result.records.length === 0) throw new Error("Group not found");

  const record = result.records[0];

  const group = record.get("g").properties;

  const members = record.get("members").map((entry: any) => ({
    user: entry.user.properties,
    membership: entry.membership.properties,
  }));

  const postsWithAuthors = record.get("postsWithAuthors") || [];
  const posts = postsWithAuthors
    .map((entry: any) => {
      const p = entry.post?.properties;
      const a = entry.author?.properties;
      if (!p || !a) return null;

      return {
        id: p.id,
        content: p.content,
        category: p.category,
        created_at: p.created_at.toString(),
        updated_at: p.updated_at,
        media_urls: p.media_urls || [],
        is_deleted: p.is_deleted,
        post_type: p.post_type || "group",
        likes_count: neo4j.integer.toNumber(p.likes_count),
        comments_count: neo4j.integer.toNumber(p.comments_count),
        reposts_count: neo4j.integer.toNumber(p.reposts_count),
        author: {
          id: a.id,
          name: `${a.first_name} ${a.last_name}`,
          email: a.email,
          profile_picture: a.profile_picture || "",
        },
      };
    })
    .filter(Boolean); // removes nulls

  const isAdmin = record.get("isAdmin");
  const isMember = record.get("isMember");
  const hasRequested = record.get("hasRequested");
  const memberCount = record.get("memberCount").toNumber();
  const friendCount = record.get("friendCount").toNumber();
  const joinRequestId = record.has("joinRequestId") ? record.get("joinRequestId") : null;

  await session.close();

  return {
    group,
    members,
    posts,
    isAdmin,
    isMember,
    hasRequested,
    memberCount,
    friendCount,
    joinRequestId,
  };
};

export const leaveGroupService = async (userId: string, groupId: string) => {
  const result = await session.run(
    `
    MATCH (u:User {id: $userId})-[r:MEMBER_OF]->(g:Group {id: $groupId})
    DELETE r
    SET g.member_count = g.member_count - 1
    RETURN g
    `,
    { userId, groupId }
  );

  if (result.records.length === 0) {
    throw new Error("User is not a member of this group or group not found");
  }

  return result.records[0].get("g").properties;
};
export const removeMemberService = async (groupId: string, memberId: string, adminId: string) => {
  const session = driver.session();

  const result = await session.run(
    `
    MATCH (admin:User {id: $adminId})-[:ADMIN_OF]->(g:Group {id: $groupId})
    MATCH (member:User {id: $memberId})-[rel:MEMBER_OF]->(g)
    DELETE rel
    RETURN member
    `,
    { groupId, memberId, adminId }
  );

  await session.close();

  if (result.records.length === 0) {
    throw new Error("Unauthorized or member not found");
  }
};
export const updateGroupService = async (groupId: string, userId: string, updates: any) => {
  const setClauses = Object.entries(updates)
    .map(([key, value]) => `g.${key} = $${key}`)
    .join(", ");

  const session = driver.session();

  try {
    const result = await session.run(
      `
      MATCH (admin:User {id: $userId})-[:ADMIN_OF]->(g:Group {id: $groupId})
      SET ${setClauses}
      RETURN g
      `,
      { groupId, userId, ...updates }
    );

    if (result.records.length === 0) {
      return null;
    }

    return result.records[0].get("g").properties;
  } finally {
    await session.close();
  }
};
