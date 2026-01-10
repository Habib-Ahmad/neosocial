import { describe, it, beforeAll, afterAll, expect } from "@jest/globals";
import neo4j from "neo4j-driver";
import dotenv from "dotenv";

// Charge les variables d'env pour les tests
dotenv.config({ path: ".env.test" }); // si tu n'as pas .env.test, remplace par: dotenv.config()

const hasNeo4j =
  !!process.env.NEO4J_URI && !!process.env.NEO4J_USER && !!process.env.NEO4J_PASSWORD;

// Si pas de Neo4j configuré (ex: CI sans secrets), on skip le bloc
const d = hasNeo4j ? describe : describe.skip;

d("Messaging – send message (friends vs not friends)", () => {
  const driver = neo4j.driver(
    process.env.NEO4J_URI!,
    neo4j.auth.basic(process.env.NEO4J_USER!, process.env.NEO4J_PASSWORD!)
  );

  afterAll(async () => {
    await driver.close();
  });

  it("✅ Friends: User A can send a message to User B", async () => {
    const session = driver.session();

    // Reset DB for this test
    await session.run("MATCH (n) DETACH DELETE n");

    // Create users + friendship
    await session.run(`
      CREATE (a:User {id: 'userA', email: 'a@test.com'})
      CREATE (b:User {id: 'userB', email: 'b@test.com'})
      CREATE (a)-[:FRIENDS_WITH]->(b)
    `);

    // Create message ONLY IF friends relation exists
    await session.run(`
      MATCH (a:User {id:'userA'})-[:FRIENDS_WITH]->(b:User {id:'userB'})
      CREATE (m:Message {
        id: 'msg_friends',
        content: 'Hello B',
        createdAt: datetime()
      })
      CREATE (a)-[:SENT]->(m)-[:TO]->(b)
    `);

    const result = await session.run(`
      MATCH (:User {id:'userA'})-[:SENT]->(m:Message)-[:TO]->(:User {id:'userB'})
      RETURN m.content AS content
    `);

    await session.close();

    expect(result.records.length).toBe(1);
    expect(result.records[0].get("content")).toBe("Hello B");
  });

  it("🚫 Not friends: User A cannot send a message to User B", async () => {
    const session = driver.session();

    // Reset DB for this test
    await session.run("MATCH (n) DETACH DELETE n");

    // Create users WITHOUT friendship
    await session.run(`
      CREATE (a:User {id: 'userA', email: 'a@test.com'})
      CREATE (b:User {id: 'userB', email: 'b@test.com'})
    `);

    // Attempt to create message ONLY IF friends relation exists
    // -> Since there is NO FRIENDS_WITH, this MATCH finds nothing, so nothing is created.
    await session.run(`
      MATCH (a:User {id:'userA'})-[:FRIENDS_WITH]->(b:User {id:'userB'})
      CREATE (m:Message {
        id: 'msg_notfriends',
        content: 'Hi',
        createdAt: datetime()
      })
      CREATE (a)-[:SENT]->(m)-[:TO]->(b)
    `);

    const result = await session.run(`
      MATCH (:User {id:'userA'})-[:SENT]->(m:Message)-[:TO]->(:User {id:'userB'})
      RETURN m
    `);

    await session.close();

    expect(result.records.length).toBe(0);
  });
});
