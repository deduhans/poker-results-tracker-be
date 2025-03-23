/**
 * Global setup for Jest tests
 * This runs once before all tests
 */
module.exports = async () => {
  console.log('\n🚀 Setting up test environment...');

  // You can add any global setup here, such as:
  // - Database initialization
  // - Setting up test fixtures
  // - Starting required services

  // This is a good place to set up a clean test database
  // if you need something beyond what E2EService provides

  console.log('✅ Test environment setup complete\n');
};
