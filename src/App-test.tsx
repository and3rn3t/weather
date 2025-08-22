function App() {
  return (
    <div
      style={{
        padding: '20px',
        backgroundColor: '#282c34',
        color: 'white',
        minHeight: '100vh',
        textAlign: 'center',
        fontSize: '24px',
      }}
    >
      <h1>✅ WEATHER APP IS LOADING!</h1>
      <p>React is working!</p>
      <p>Time: {new Date().toLocaleTimeString()}</p>
      <button
        onClick={() => alert('Horror effects available!')}
        style={{
          padding: '10px 20px',
          fontSize: '16px',
          backgroundColor: '#667eea',
          color: 'white',
          border: 'none',
          borderRadius: '5px',
          cursor: 'pointer',
        }}
      >
        Test Horror Effects
      </button>
    </div>
  );
}

export default App;
