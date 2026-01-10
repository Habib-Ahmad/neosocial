import { driver } from "../../db/neo4j";

/**
 * Clean up test data before/after integration tests
 */
export const cleanupTestData = async () => {
  const session = driver.session();
  try {
    // Delete all test posts first (to avoid orphan relationships)
    await session.run(`
      MATCH (p:Post)
      WHERE p.id CONTAINS 'test'
         OR p.content CONTAINS 'test'
      DETACH DELETE p
    `);

    // Delete all test users and their relationships
    await session.run(`
      MATCH (n)
      WHERE n.email CONTAINS 'test@'
         OR n.email CONTAINS 'integration@'
         OR n.email CONTAINS '@test.com'
         OR n.username CONTAINS 'test'
         OR n.id CONTAINS 'test'
         OR n.id CONTAINS 'friend-'
         OR n.id CONTAINS 'post-test'
      DETACH DELETE n
    `);

    // Delete all test groups
    await session.run(`
      MATCH (g:Group)
      WHERE g.name CONTAINS 'Test'
         OR g.name CONTAINS 'test'
         OR g.id CONTAINS 'test'
      DETACH DELETE g
    `);
  } finally {
    await session.close();
  }
};

/**
 * Create a test user directly in the database
 */
export const createTestUser = async (userData: {
  id?: string;
  email: string;
  password: string;
  first_name: string;
  last_name: string;
}) => {
  const session = driver.session();
  try {
    const result = await session.run(
      `
      MERGE (u:User {id: $id})
      ON CREATE SET
        u.email = $email,
        u.password_hash = $password,
        u.first_name = $first_name,
        u.last_name = $last_name,
        u.created_at = datetime()
      ON MATCH SET
        u.email = $email,
        u.password_hash = $password,
        u.first_name = $first_name,
        u.last_name = $last_name
      RETURN u
      `,
      {
        id: userData.id || `test-user-${Date.now()}`,
        email: userData.email,
        password: userData.password,
        first_name: userData.first_name,
        last_name: userData.last_name,
      }
    );

    return result.records[0].get("u").properties;
  } finally {
    await session.close();
  }
};

/**
 * Get a test user from the database
 */
export const getTestUser = async (email: string) => {
  const session = driver.session();
  try {
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
  } finally {
    await session.close();
  }
};
