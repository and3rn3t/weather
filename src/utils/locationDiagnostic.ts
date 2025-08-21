/**
 * Location Diagnostic Tool
 * Helps debug location service issues
 */

import { locationService } from './locationService';

export class LocationDiagnostic {
  /**
   * Run complete location diagnostic
   */
  public static async runDiagnostic(): Promise<{
    summary: string;
    details: Array<{
      check: string;
      status: 'pass' | 'fail' | 'warning';
      message: string;
    }>;
    recommendations: string[];
  }> {
    const details: Array<{
      check: string;
      status: 'pass' | 'fail' | 'warning';
      message: string;
    }> = [];
    const recommendations: string[] = [];

    // Check 1: Browser support
    if (locationService.isSupported()) {
      details.push({
        check: 'Browser Support',
        status: 'pass',
        message: 'Geolocation API is supported',
      });
    } else {
      details.push({
        check: 'Browser Support',
        status: 'fail',
        message: 'Geolocation API is not supported in this browser',
      });
      recommendations.push(
        'Use a modern browser that supports geolocation (Chrome, Firefox, Safari, Edge)',
      );
    }

    // Check 2: Secure context
    if (locationService.isSecureContext()) {
      details.push({
        check: 'Secure Context',
        status: 'pass',
        message: 'Running in secure context (HTTPS or localhost)',
      });
    } else {
      details.push({
        check: 'Secure Context',
        status: 'fail',
        message: 'Not running in secure context - location may not work',
      });
      recommendations.push(
        'Access the site via HTTPS for location services to work',
      );
    }

    // Check 3: Permissions
    try {
      const permission = await locationService.checkPermissions();
      switch (permission) {
        case 'granted':
          details.push({
            check: 'Permissions',
            status: 'pass',
            message: 'Location permission granted',
          });
          break;
        case 'denied':
          details.push({
            check: 'Permissions',
            status: 'fail',
            message: 'Location permission denied',
          });
          recommendations.push(
            'Enable location permissions in browser settings',
          );
          recommendations.push('Refresh the page after enabling permissions');
          break;
        case 'prompt':
          details.push({
            check: 'Permissions',
            status: 'warning',
            message: 'Location permission not yet requested',
          });
          recommendations.push(
            'Click the location button to request permission',
          );
          break;
        default:
          details.push({
            check: 'Permissions',
            status: 'warning',
            message: `Permission state: ${permission}`,
          });
      }
    } catch (error) {
      details.push({
        check: 'Permissions',
        status: 'warning',
        message: 'Could not check permission status',
      });
    }

    // Check 4: Network connectivity (basic check)
    try {
      await fetch('https://nominatim.openstreetmap.org/', {
        method: 'HEAD',
        mode: 'no-cors',
      });
      details.push({
        check: 'Network Connectivity',
        status: 'pass',
        message: 'Can reach geocoding service',
      });
    } catch (error) {
      details.push({
        check: 'Network Connectivity',
        status: 'warning',
        message: 'May have network connectivity issues',
      });
      recommendations.push('Check your internet connection');
    }

    // Check 5: Environment details
    const userAgent = navigator.userAgent;
    const isIOS = /iPad|iPhone|iPod/.test(userAgent);
    const isAndroid = /Android/.test(userAgent);
    const isMobile = isIOS || isAndroid || /Mobile/.test(userAgent);

    details.push({
      check: 'Environment',
      status: 'pass',
      message: `Device: ${isMobile ? 'Mobile' : 'Desktop'}, Platform: ${
        isIOS ? 'iOS' : isAndroid ? 'Android' : 'Other'
      }`,
    });

    if (isMobile) {
      recommendations.push(
        'On mobile devices, make sure location services are enabled in device settings',
      );
    }

    // Generate summary
    const failedChecks = details.filter(d => d.status === 'fail').length;
    const warningChecks = details.filter(d => d.status === 'warning').length;

    let summary: string;
    if (failedChecks === 0 && warningChecks === 0) {
      summary = 'All checks passed - location should work properly';
    } else if (failedChecks === 0) {
      summary = `${warningChecks} warning(s) - location may work with user interaction`;
    } else {
      summary = `${failedChecks} critical issue(s) preventing location access`;
    }

    return {
      summary,
      details,
      recommendations: [...new Set(recommendations)], // Remove duplicates
    };
  }

  /**
   * Log diagnostic results to console
   */
  public static async logDiagnostic(): Promise<void> {
    console.group('📍 Location Service Diagnostic');

    try {
      const result = await this.runDiagnostic();

      console.log('📋 Summary:', result.summary);
      console.log('');

      console.group('✅ Detailed Checks');
      result.details.forEach(detail => {
        const icon =
          detail.status === 'pass'
            ? '✅'
            : detail.status === 'fail'
            ? '❌'
            : '⚠️';
        console.log(`${icon} ${detail.check}: ${detail.message}`);
      });
      console.groupEnd();

      if (result.recommendations.length > 0) {
        console.log('');
        console.group('💡 Recommendations');
        result.recommendations.forEach((rec, index) => {
          console.log(`${index + 1}. ${rec}`);
        });
        console.groupEnd();
      }
    } catch (error) {
      console.error('Failed to run diagnostic:', error);
    }

    console.groupEnd();
  }

  /**
   * Test location acquisition with detailed logging
   */
  public static async testLocationAcquisition(): Promise<void> {
    console.group('🧪 Location Acquisition Test');

    try {
      console.log('Starting location test...');

      const startTime = performance.now();
      const result = await locationService.getCurrentLocation();
      const endTime = performance.now();

      console.log('✅ Location acquired successfully!');
      console.log(`📍 Coordinates: ${result.latitude}, ${result.longitude}`);
      console.log(
        `🎯 Accuracy: ${
          result.accuracy ? `${Math.round(result.accuracy)}m` : 'Unknown'
        }`,
      );
      console.log(`🏙️ City: ${result.cityName || 'Not determined'}`);
      console.log(`⏱️ Time taken: ${Math.round(endTime - startTime)}ms`);
    } catch (error: any) {
      console.error('❌ Location test failed:', error);
      console.log('Error details:', {
        code: error.code,
        message: error.message,
        userMessage: error.userMessage,
      });

      // Run diagnostic for troubleshooting
      console.log('');
      console.log('Running diagnostic for troubleshooting...');
      await this.logDiagnostic();
    }

    console.groupEnd();
  }
}

// Expose diagnostic tools globally in development
if (process.env.NODE_ENV === 'development') {
  (window as any).locationDiagnostic = LocationDiagnostic;
  console.log('📍 Location diagnostic tools available:');
  console.log('- locationDiagnostic.logDiagnostic() - Run diagnostic checks');
  console.log(
    '- locationDiagnostic.testLocationAcquisition() - Test location acquisition',
  );
}
