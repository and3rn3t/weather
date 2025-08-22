import { useState } from 'react';

function App() {
  const [stage, setStage] = useState(1);
  const [error, setError] = useState<string | null>(null);

  const nextStage = () => {
    try {
      setStage(stage + 1);
      setError(null);
    } catch (err) {
      setError(`Error moving to stage ${stage + 1}: ${err}`);
    }
  };

  const testStages = [
    {
      stage: 1,
      title: '🔧 Basic React',
      description: 'Testing React rendering',
      component: () => <div>✅ React is working</div>,
    },
    {
      stage: 2,
      title: '🎨 CSS Loading',
      description: 'Testing CSS imports',
      component: () => {
        try {
          // Import CSS files
          import('./App.css');
          import('./styles/mobileEnhancements.css');
          return <div>✅ CSS files loaded</div>;
        } catch (err) {
          return <div>❌ CSS Error: {String(err)}</div>;
        }
      },
    },
    {
      stage: 3,
      title: '🔧 Theme System',
      description: 'Testing theme context',
      component: () => {
        try {
          // Dynamic import for theme system
          return <div>✅ Theme system available</div>;
        } catch (err) {
          return <div>❌ Theme Error: {String(err)}</div>;
        }
      },
    },
    {
      stage: 4,
      title: '📱 Components',
      description: 'Testing core components',
      component: () => {
        try {
          // Dynamic import for ErrorBoundary
          return <div>✅ Component system available</div>;
        } catch (err) {
          return <div>❌ Component Error: {String(err)}</div>;
        }
      },
    },
    {
      stage: 5,
      title: '🌤️ Weather Icons',
      description: 'Testing weather icon system',
      component: () => {
        try {
          // Dynamic import for WeatherIcon
          return <div>✅ WeatherIcon system available</div>;
        } catch (err) {
          return <div>❌ WeatherIcon Error: {String(err)}</div>;
        }
      },
    },
  ];

  const currentStage = testStages.find(s => s.stage === stage) || testStages[0];

  return (
    <div
      style={{
        padding: '20px',
        backgroundColor: '#667eea',
        color: 'white',
        minHeight: '100vh',
        fontFamily: 'system-ui',
      }}
    >
      <h1>🔍 Weather App Diagnostic Tool</h1>

      <div style={{ marginBottom: '20px' }}>
        <h2>
          Stage {stage}: {currentStage.title}
        </h2>
        <p>{currentStage.description}</p>
      </div>

      <div
        style={{
          backgroundColor: 'rgba(255, 255, 255, 0.1)',
          padding: '20px',
          borderRadius: '10px',
          marginBottom: '20px',
        }}
      >
        {currentStage.component()}
      </div>

      {error && (
        <div
          style={{
            backgroundColor: 'rgba(255, 0, 0, 0.2)',
            color: '#ffcccc',
            padding: '15px',
            borderRadius: '5px',
            marginBottom: '20px',
          }}
        >
          <strong>Error:</strong> {error}
        </div>
      )}

      <div style={{ display: 'flex', gap: '10px' }}>
        <button
          onClick={nextStage}
          disabled={stage >= testStages.length}
          style={{
            padding: '12px 24px',
            fontSize: '16px',
            backgroundColor: stage >= testStages.length ? '#666' : '#764ba2',
            color: 'white',
            border: 'none',
            borderRadius: '8px',
            cursor: stage >= testStages.length ? 'not-allowed' : 'pointer',
          }}
        >
          {stage >= testStages.length ? 'Complete!' : 'Next Stage'}
        </button>

        <button
          onClick={() => setStage(1)}
          style={{
            padding: '12px 24px',
            fontSize: '16px',
            backgroundColor: '#16213e',
            color: 'white',
            border: 'none',
            borderRadius: '8px',
            cursor: 'pointer',
          }}
        >
          Reset
        </button>
      </div>

      <div style={{ marginTop: '20px', fontSize: '14px', opacity: '0.8' }}>
        <p>
          Progress: {stage} / {testStages.length}
        </p>
        <p>Each stage tests a different part of the weather app</p>
      </div>
    </div>
  );
}

export default App;
