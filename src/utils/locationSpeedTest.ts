/**
 * Location Speed Test
 *
 * Quick test to verify the location optimizations are working
 */

import { useFastLocation } from '../utils/fastLocationService';
import { useLocationServices } from '../utils/useLocationServices';

export async function testLocationSpeed() {
  console.log('🧪 Testing Location Speed Optimizations...');

  // Test 1: Fast Location Service
  console.log('\n1️⃣ Testing Fast Location Service');
  try {
    const fastService = useFastLocation();
    const startTime = Date.now();

    const result = await fastService.getFastLocation({
      prioritizeSpeed: true,
      includeCityName: true,
      useCache: false, // Force fresh request for accurate timing
    });

    const duration = Date.now() - startTime;
    console.log(`✅ Fast Location completed in ${duration}ms`);
    console.log('📊 Result:', {
      city: result?.city,
      accuracy: result?.accuracy,
      fromCache: result?.fromCache,
    });

    return { fastLocationTime: duration, result };
  } catch (error) {
    console.error('❌ Fast Location failed:', error);
    return { fastLocationTime: null, error };
  }
}

export async function testTraditionalLocation() {
  console.log('\n2️⃣ Testing Traditional Location Service (for comparison)');

  try {
    // Simulate the old settings
    const locationServices = useLocationServices();
    const startTime = Date.now();

    const result = await locationServices.getCurrentLocation({
      enableHighAccuracy: true, // Old setting
      timeout: 15000, // Old timeout
      includeAddress: true,
    });

    const duration = Date.now() - startTime;
    console.log(`🐌 Traditional Location completed in ${duration}ms`);
    console.log('📊 Result:', {
      city: result?.city,
      accuracy: result?.accuracy,
    });

    return { traditionalTime: duration, result };
  } catch (error) {
    console.error('❌ Traditional Location failed:', error);
    return { traditionalTime: null, error };
  }
}

export async function runLocationSpeedComparison() {
  console.log('🏁 Running Location Speed Comparison Test');
  console.log('='.repeat(50));

  const fastTest = await testLocationSpeed();
  await new Promise(resolve => setTimeout(resolve, 2000)); // Brief pause
  const traditionalTest = await testTraditionalLocation();

  console.log('\n📊 COMPARISON RESULTS:');
  console.log('='.repeat(30));

  if (fastTest.fastLocationTime && traditionalTest.traditionalTime) {
    const speedImprovement =
      traditionalTest.traditionalTime - fastTest.fastLocationTime;
    const percentImprovement = (
      (speedImprovement / traditionalTest.traditionalTime) *
      100
    ).toFixed(1);

    console.log(`⚡ Fast Location: ${fastTest.fastLocationTime}ms`);
    console.log(`🐌 Traditional: ${traditionalTest.traditionalTime}ms`);
    console.log(
      `🚀 Speed Improvement: ${speedImprovement}ms (${percentImprovement}% faster)`
    );

    if (fastTest.fastLocationTime < 5000) {
      console.log('✅ SUCCESS: Fast location under 5 seconds!');
    } else if (fastTest.fastLocationTime < 8000) {
      console.log('⚠️  ACCEPTABLE: Location under 8 seconds');
    } else {
      console.log('❌ SLOW: Location still taking >8 seconds');
    }
  } else {
    console.log('❌ Could not complete comparison due to errors');
  }

  return { fastTest, traditionalTest };
}

// Browser console helper
if (typeof window !== 'undefined') {
  (window as any).testLocationSpeed = runLocationSpeedComparison;
  console.log(
    '💡 Run testLocationSpeed() in browser console to test optimizations'
  );
}
