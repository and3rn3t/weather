# 🌤️ Modern Weather App

> A beautiful, responsive weather application built with React, TypeScript, and Vite. Features real-time weather data, modern glassmorphism design, and animated weather icons - all powered by completely free APIs.

## ✨ Features

### 🎨 Modern Design
- **Glassmorphism UI**: Stunning glass-effect design with backdrop blur
- **Animated Icons**: Weather-specific emoji icons with gentle bounce animations
- **Responsive Layout**: Works perfectly on desktop and mobile devices
- **Gradient Backgrounds**: Beautiful purple-to-blue gradient themes

### 🌍 Weather Data
- **Real-time Conditions**: Current temperature, humidity, pressure, and wind
- **Feels-Like Temperature**: Apparent temperature for accurate comfort assessment
- **UV Index**: Sun exposure safety information
- **Visibility**: Atmospheric visibility conditions
- **Weather Descriptions**: Clear, human-readable condition descriptions

### 🔧 Technical Excellence
- **Zero API Costs**: Uses completely free OpenMeteo and Nominatim APIs
- **No Rate Limits**: Unlimited weather requests
- **TypeScript**: Full type safety and excellent developer experience
- **Fast Performance**: Sub-2-second weather data loading
- **Error Handling**: Comprehensive error management with user-friendly messages

## 🚀 Quick Start

### Prerequisites

- Node.js v22.12.0+
- npm
- **No API keys required!** 🎉

### Setup

1. **Clone and install:**

   ```powershell
   npm install
   ```

2. **Start development server:**

   ```powershell
   npm run dev
   ```

3. **Open your browser:**
   Navigate to `http://localhost:5173` and start checking weather!

2. **Start development server:**

   ```powershell
   npm run dev
   ```

3. **Open your browser:**
   Navigate to `http://localhost:5173` and start checking weather!

## 🎯 How to Use

1. **Home Screen**: Click "Check Weather →" to start
2. **Enter City**: Type any city name (e.g., "London", "New York", "Tokyo")
3. **Get Weather**: Press Enter or click "🔍 Search"
4. **View Results**: See real temperature in Fahrenheit and weather conditions

## 🏗️ Technical Architecture

### APIs Used

- **OpenMeteo**: Weather data (free, no API key required)
- **OpenStreetMap Nominatim**: Geocoding (free, no API key required)

### Key Files

- `src/navigation/AppNavigator.tsx` - Main app with inline screen components and modern UI
- `src/services/weatherService.ts` - Legacy OpenWeatherMap service (kept for reference)

### Important Notes

- ✅ Use inline components in AppNavigator.tsx (works reliably)
- ❌ Avoid separate screen component files (causes blank screens)
- ✅ No API keys required - uses free OpenMeteo and Nominatim services
- ✅ Two-step API process: Nominatim geocoding → OpenMeteo weather data

## 📱 Future Mobile Deployment

The app is built on React Native foundation and ready for mobile deployment:

- **iOS**: Use Expo or React Native CLI
- **Android**: Use Expo or React Native CLI

## 🛠️ Development Commands

```powershell
npm run dev      # Start development server
npm run build    # Build for production
npm run preview  # Preview production build
```

## 🎨 Design Features

- **Glassmorphism UI**: Modern frosted glass effects with blur
- **Gradient Backgrounds**: Beautiful purple-to-blue gradients
- **Smooth Animations**: Hover effects and loading animations
- **Responsive Design**: Works on desktop and mobile browsers
- **Imperial Units**: Temperature displayed in Fahrenheit

## 📚 Documentation

See `PROJECT_DOCUMENTATION.md` for comprehensive technical details and development history.

See `.github/copilot-instructions.md` for AI assistant guidance and known issues.

## 🌤️ Live Demo

The app provides real weather data including:

- Temperature in Fahrenheit
- Current weather conditions (clear sky, partly cloudy, rain, etc.)
- Error handling for invalid cities
- Animated loading states during API calls

Built with ❤️ using React, TypeScript, Vite, OpenMeteo, and modern design principles.
