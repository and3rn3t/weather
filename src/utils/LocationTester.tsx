import React, { useState } from 'react';
import { useLocationServices } from './useLocationServices';

export const LocationTester: React.FC = () => {
  const { 
    isLoading, 
    isPermissionGranted, 
    location, 
    error, 
    getCurrentLocation, 
    checkPermissionStatus 
  } = useLocationServices();
  const [testResults, setTestResults] = useState<string[]>([]);

  const addResult = (message: string) => {
    setTestResults(prev => [...prev, `${new Date().toLocaleTimeString()}: ${message}`]);
    console.log(message);
  };

  const runLocationTest = async () => {
    addResult('🚀 Starting location test...');
    setTestResults([]);
    
    try {
      // Check permission status
      const permission = await checkPermissionStatus();
      addResult(`📋 Permission status: ${permission}`);
      
      // Test location acquisition
      addResult('📍 Requesting location...');
      const location = await getCurrentLocation({ includeAddress: true });
      
      if (location) {
        addResult(`✅ Location acquired: ${location.latitude}, ${location.longitude}`);
        addResult(`🏙️ City: ${location.city || 'Unknown'}`);
        addResult(`🌍 Country: ${location.country || 'Unknown'}`);
        addResult(`📐 Accuracy: ${location.accuracy}m`);
      } else {
        addResult('❌ Failed to get location');
      }
    } catch (error) {
      addResult(`❌ Test error: ${error}`);
    }
  };

  const clearResults = () => {
    setTestResults([]);
  };

  return (
    <div style={{ 
      margin: '20px', 
      padding: '20px', 
      border: '2px solid #007acc', 
      borderRadius: '8px',
      backgroundColor: '#f8f9fa',
      fontFamily: 'monospace'
    }}>
      <h3>🧪 Location Services Tester</h3>
      
      <div style={{ marginBottom: '15px' }}>
        <button 
          onClick={runLocationTest}
          disabled={isLoading}
          style={{
            padding: '10px 15px',
            marginRight: '10px',
            backgroundColor: '#007acc',
            color: 'white',
            border: 'none',
            borderRadius: '4px',
            cursor: 'pointer'
          }}
        >
          {isLoading ? '⏳ Testing...' : '🧪 Run Location Test'}
        </button>
        
        <button 
          onClick={clearResults}
          style={{
            padding: '10px 15px',
            backgroundColor: '#6c757d',
            color: 'white',
            border: 'none',
            borderRadius: '4px',
            cursor: 'pointer'
          }}
        >
          🧹 Clear Results
        </button>
      </div>

      <div style={{ 
        backgroundColor: '#ffffff', 
        padding: '15px', 
        borderRadius: '4px',
        border: '1px solid #dee2e6',
        maxHeight: '300px',
        overflowY: 'auto'
      }}>
        <h4>Current State:</h4>
        <p>Loading: {isLoading ? '✅' : '❌'}</p>
        <p>Permission: {(() => {
          if (isPermissionGranted === null) return '❓';
          return isPermissionGranted ? '✅' : '❌';
        })()}</p>
        <p>Location: {location ? `${location.latitude}, ${location.longitude}` : '❌'}</p>
        <p>Error: {error?.userFriendlyMessage || 'None'}</p>
        
        <h4>Test Results:</h4>
        {testResults.length === 0 ? (
          <p style={{ color: '#6c757d' }}>No tests run yet</p>
        ) : (
          <div>
            {testResults.map((result, index) => {
              const backgroundColor = (() => {
                if (result.includes('❌')) return '#ffe6e6';
                if (result.includes('✅')) return '#e6ffe6';
                return '#f8f9fa';
              })();
              
              return (
                <div key={`test-${index}-${result.slice(0, 10)}`} style={{ 
                  marginBottom: '5px',
                  padding: '5px',
                  backgroundColor
                }}>
                  {result}
                </div>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
};
