function App() {
  return (
    <div
      style={{
        padding: '20px',
        backgroundColor: '#667eea',
        color: 'white',
        minHeight: '100vh',
        textAlign: 'center',
        fontSize: '20px',
        position: 'relative',
        zIndex: 2147483645,
      }}
      data-allow-overlay="true"
    >
      <h1>🌤️ Weather App - Loading Main Components...</h1>
      <div style={{ marginTop: '20px' }}>
        <p>✅ React is working</p>
        <p>✅ Main App component loaded</p>
        <p>⏳ Loading weather features...</p>
      </div>

      <div style={{ marginTop: '30px' }}>
        <button
          onClick={() => {
            console.log('Testing console...');
            alert('App is responsive!');
          }}
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
          🧪 Test Functionality
        </button>
      </div>

      <div style={{ marginTop: '30px', fontSize: '14px', opacity: '0.8' }}>
        <p>Server time: {new Date().toLocaleString()}</p>
        <p>Status: Ready for full app loading</p>
      </div>
    </div>
  );
}

export default App;
