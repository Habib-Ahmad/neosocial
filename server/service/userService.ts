import { session } from "../db/neo4j";

export const getFriendsByUserId = async (userId: string) => {
  const result = await session.run("MATCH (u:User {id: $userId})-[:KNOWS]->(f:User) RETURN f", {
    userId,
  });

  return result.records.map((r) => r.get("f").properties);
};
