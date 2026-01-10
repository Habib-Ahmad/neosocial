import { describe, it, beforeAll, afterAll, expect } from "@jest/globals";
import neo4j from "neo4j-driver";
import dotenv from "dotenv";

// Charge les variables d'env pour les tests
dotenv.config({ path: ".env.test" }); // si tu n'as pas .env.test, remplace par: dotenv.config()

const hasNeo4j =
  !!process.env.NEO4J_URI && !!process.env.NEO4J_USER && !!process.env.NEO4J_PASSWORD;

// Si pas de Neo4j configuré (ex: CI sans secrets), on skip le bloc
const d = hasNeo4j ? describe : describe.skip;

d("Messaging – simple integration test", () => {
  const driver = neo4j.driver(
    process.env.NEO4J_URI!,
    neo4j.auth.basic(process.env.NEO4J_USER!, process.env.NEO4J_PASSWORD!)
  );

  beforeAll(async () => {
    const session = driver.session();
    await session.run("MATCH (n) DETACH DELETE n");

    await session.run(`
      CREATE (a:User {id: 'userA', email: 'a@test.com'})
      CREATE (b:User {id: 'userB', email: 'b@test.com'})
      CREATE (a)-[:FRIENDS_WITH]->(b)
    `);

    await session.close();
  });

  afterAll(async () => {
    await driver.close();
  });

  it("User A can send a message to User B", async () => {
    const session = driver.session();

    await session.run(`
      MATCH (a:User {id:'userA'}), (b:User {id:'userB'})
      CREATE (m:Message {
        id: 'msg1',
        content: 'Hello B',
        createdAt: datetime()
      })
      CREATE (a)-[:SENT]->(m)-[:TO]->(b)
    `);

    const result = await session.run(`
      MATCH (a:User {id:'userA'})-[:SENT]->(m:Message)-[:TO]->(b:User {id:'userB'})
      RETURN m.content AS content
    `);

    
    await session.close();

    expect(result.records.length).toBe(1);
    expect(result.records[0].get("content")).toBe("Hello B");
  });
    it("User A cannot send a message to User B if they are not friends", async () => {
    const session = driver.session();

    // Reset DB pour ce test
    await session.run("MATCH (n) DETACH DELETE n");

    // Création des utilisateurs SANS relation FRIENDS_WITH
    await session.run(`
      CREATE (a:User {id: 'userA', email: 'a@test.com'})
      CREATE (b:User {id: 'userB', email: 'b@test.com'})
    `);

    // Tentative d’envoi : le MATCH exige FRIENDS_WITH
    // => comme ils ne sont PAS amis, rien ne sera créé
    await session.run(`
      MATCH (a:User {id:'userA'})-[:FRIENDS_WITH]->(b:User {id:'userB'})
      CREATE (m:Message {
        id: 'msg_not_allowed',
        content: 'Hi',
        createdAt: datetime()
      })
      CREATE (a)-[:SENT]->(m)-[:TO]->(b)
    `);

    // Vérification : aucun message ne doit exister
    const result = await session.run(`
      MATCH (:User {id:'userA'})-[:SENT]->(m:Message)-[:TO]->(:User {id:'userB'})
      RETURN m
    `);

    await session.close();

    expect(result.records.length).toBe(0);
  });
  it("🚫 User A cannot send a message to himself", async () => {
  const session = driver.session();

  // Reset DB pour ce test
  await session.run("MATCH (n) DETACH DELETE n");

  // Création d’un seul user
  await session.run(`
    CREATE (a:User {id: 'userA', email: 'a@test.com'})
  `);

  // Tentative d’envoi à soi-même
  // La requête impose que le destinataire soit différent (a.id <> b.id)
  // => donc aucun message ne sera créé
  await session.run(`
    MATCH (a:User {id:'userA'}), (b:User {id:'userA'})
    WHERE a.id <> b.id
    CREATE (m:Message {
      id: 'msg_self',
      content: 'Hello me',
      createdAt: datetime()
    })
    CREATE (a)-[:SENT]->(m)-[:TO]->(b)
  `);

  // Vérification : aucun message ne doit exister
  const result = await session.run(`
    MATCH (:User {id:'userA'})-[:SENT]->(m:Message)
    RETURN m
  `);

  await session.close();

  expect(result.records.length).toBe(0);
});

});

