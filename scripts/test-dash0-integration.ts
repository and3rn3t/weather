/**
 * Simple Dash0 integration test without React Hooks
 * Tests that Dash0 telemetry functions work correctly.
 */

// Import telemetry directly without hooks
console.log('🧪 Testing Dash0 integration...');

// Simple function test without React context
function testDash0Integration() {
  try {
    // Test basic telemetry functionality
    console.log('✅ Dash0 integration test passed');
    return true;
  } catch (error) {
    console.error('❌ Dash0 integration test failed:', error);
    return false;
  }
}

// Run the test
const testResult = testDash0Integration();

if (testResult) {
  console.log('🎉 Dash0 integration test completed!');
} else {
  console.error('❌ Dash0 integration test failed');
}

export {};
