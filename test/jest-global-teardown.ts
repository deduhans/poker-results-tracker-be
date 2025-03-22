/**
 * Global teardown for Jest tests
 * This runs once after all tests
 */
module.exports = async () => {
  console.log('\n🧹 Cleaning up test environment...');
  
  // You can add any global teardown here, such as:
  // - Database cleanup
  // - Stopping services
  // - Removing temporary files
  
  console.log('✅ Test environment cleanup complete\n');
};
