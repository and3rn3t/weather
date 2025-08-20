const SimpleTest = () => {
  return (
    <div
      style={{
        padding: '20px',
        background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
        minHeight: '100vh',
        color: 'white',
        fontFamily: 'Arial, sans-serif',
      }}
    >
      <h1>Simple Test Component</h1>
      <p>If you can see this, React is working correctly.</p>
      <div
        style={{
          background: 'rgba(255, 255, 255, 0.1)',
          padding: '20px',
          borderRadius: '12px',
          marginTop: '20px',
        }}
      >
        <h2>Component Status: ✅ Working</h2>
        <p>Date: {new Date().toLocaleString()}</p>
      </div>
    </div>
  );
};

export default SimpleTest;
