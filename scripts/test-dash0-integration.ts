/**
 * Quick Dash0 Integration Test
 *
 * This script tests the Dash0 telemetry integration to ensure
 * it's working correctly in fallback mode.
 */

import { useDash0Telemetry } from '../src/dash0/hooks/useDash0Telemetry';

// Test the telemetry hook
const telemetry = useDash0Telemetry();

// Test user interaction tracking
console.log('🧪 Testing Dash0 integration...');

telemetry.trackUserInteraction({
  action: 'test_activation',
  component: 'Dash0Test',
  metadata: {
    test_type: 'integration_verification',
    timestamp: new Date().toISOString(),
  },
});

// Test metric tracking
telemetry.trackMetric({
  name: 'test_metric',
  value: 42,
  tags: {
    test_environment: 'development',
    integration_status: 'active',
  },
});

// Test performance tracking
telemetry.trackPerformance({
  name: 'test_performance',
  value: 123.45,
  tags: {
    metric_type: 'response_time',
    unit: 'milliseconds',
  },
});

// Test operation tracking
const testOperation = async () => {
  await new Promise(resolve => setTimeout(resolve, 100));
  return { success: true, message: 'Test operation completed' };
};

telemetry.trackOperation('test_operation', testOperation).then(result => {
  console.log('✅ Test operation result:', result);
  console.log('🎉 Dash0 integration test completed!');
});

export {};
