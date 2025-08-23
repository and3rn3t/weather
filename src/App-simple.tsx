import './App.css';

function SimpleApp() {
  return (
    <div className="app-container">
      <h1>Weather App</h1>
      <p>Simple version for testing</p>
      <div>
        <p>Current time: {new Date().toLocaleString()}</p>
      </div>
    </div>
  );
}

export default SimpleApp;
