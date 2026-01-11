import { cleanupTestUsers } from './helpers';

/**
 * Global teardown runs after all tests complete
 * Ensures test users are cleaned up even if tests fail or are cancelled
 */
async function globalTeardown() {
  console.log('\n Running global teardown...');
  await cleanupTestUsers();
  console.log('✅ Global teardown complete\n');
}

// Also cleanup on process termination (Ctrl+C, etc.)
process.on('SIGINT', async () => {
  console.log('\n Test run interrupted, cleaning up...');
  await cleanupTestUsers();
  process.exit(0);
});

process.on('SIGTERM', async () => {
  console.log('\n Test run terminated, cleaning up...');
  await cleanupTestUsers();
  process.exit(0);
});

export default globalTeardown;
