/**
 * ⚠️ LEGACY FILE - DO NOT USE ⚠️
 * 
 * This file causes blank screen issues when imported.
 * Use inline components in AppNavigator.tsx instead.
 * 
 * Kept for reference only.
 */

type NavigationProp = {
  navigate: (screenName: string) => void;
};

/**
 * HomeScreen component.
 * Displays a welcome message and a button to navigate to the WeatherDetails screen.
 *
 * Props:
 * - navigation: Navigation prop for navigating between screens.
 */
const HomeScreen = ({ navigation }: { navigation: NavigationProp }) => {
  return (
    <div style={styles.container}>
      <h1 style={styles.title}>Welcome to the Weather App</h1>
      <button
        onClick={() => navigation.navigate('WeatherDetails')}
        style={styles.button}
      >
        View Weather
      </button>
    </div>
  );
};

const styles = {
  container: {
    display: 'flex',
    flexDirection: 'column' as const,
    justifyContent: 'center',
    alignItems: 'center',
    height: '100vh',
    padding: '20px',
  },
  title: {
    fontSize: '24px',
    marginBottom: '20px',
    fontWeight: 'bold',
  },
  button: {
    backgroundColor: '#007AFF',
    color: 'white',
    border: 'none',
    borderRadius: '5px',
    padding: '10px 20px',
    fontSize: '16px',
    fontWeight: 'bold',
    cursor: 'pointer',
  },
};

export default HomeScreen;
