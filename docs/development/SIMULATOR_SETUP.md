# 📱 Mobile Simulator Setup Guide

This guide will help you set up Android and iOS simulators to test your Premium Weather App.

## 🤖 Android Simulator Setup

### Step 1: Install Android Studio

1. Download [Android Studio](https://developer.android.com/studio) (free)
2. Run the installer and follow setup wizard
3. Accept license agreements
4. Let it download SDK and emulator components

### Step 2: Set Up Android Virtual Device (AVD)

1. Open Android Studio
2. Go to **Tools > AVD Manager**
3. Click **"Create Virtual Device"**
4. Choose a device (recommended: **Pixel 7** or **Pixel 6**)
5. Download a system image (recommended: **Android 13 (API 33)** or **Android 14 (API 34)**)
6. Configure AVD settings:
   - **Name**: Weather App Test Device
   - **Startup Orientation**: Portrait
   - **Enable Hardware**: Keyboard, Webcam
7. Click **Finish**

### Step 3: Run Android Simulator

```powershell
# Option 1: Start emulator first, then run app
# Open Android Studio > AVD Manager > Click Play button on your AVD
npx cap run android

# Option 2: Run app and let it start emulator automatically
npx cap run android
```

## 🍎 iOS Simulator Setup (macOS Only)

### Step 1: Install Xcode

1. Download Xcode from Mac App Store (free)
2. Open Xcode and accept license agreements
3. Install additional components when prompted

### Step 2: iOS Simulator is Built-in

- iOS Simulator is included with Xcode
- No additional setup needed

### Step 3: Run iOS Simulator

```bash
# Add iOS platform (if not already added)
npx cap add ios

# Run on iOS simulator
npx cap run ios
```

## 🚀 Quick Test Commands

### Android Testing

```powershell
# List available Android devices/emulators
npx cap run android --list

# Run on specific device
npx cap run android --target="Weather_App_Test_Device"

# Run with live reload (for development)
npx cap run android --livereload --external

# Open Android Studio project directly
npx cap open android
```

### iOS Testing (macOS only)

```bash
# List available iOS simulators
npx cap run ios --list

# Run on specific simulator
npx cap run ios --target="iPhone 15 Pro"

# Run with live reload
npx cap run ios --livereload --external

# Open Xcode project directly
npx cap open ios
```

## 🔧 Development Workflow

1. **Make code changes** in VS Code
2. **Build web app**: `npm run build`
3. **Sync to native**: `npx cap sync`
4. **Test on simulator**: `npx cap run android` or `npx cap run ios`

### Or use our shortcut

```powershell
npm run mobile:build  # Does build + sync automatically
npx cap run android   # Test on Android
```

## 📋 Recommended Test Devices

### Android Simulators

- **Pixel 7 (Android 14)** - Latest Google device
- **Pixel 6 (Android 13)** - Popular mid-range
- **Samsung Galaxy S23 (Android 13)** - Popular Samsung device
- **Tablet**: Pixel Tablet or Galaxy Tab S8

### iOS Simulators

- **iPhone 15 Pro (iOS 17)** - Latest flagship
- **iPhone 14 (iOS 16)** - Popular current model
- **iPhone SE (3rd gen)** - Smaller screen testing
- **iPad Pro 12.9-inch** - Tablet testing

## 🛠️ Troubleshooting

### Android Issues

```powershell
# Check Android environment
npx cap doctor

# If emulator won't start
# 1. Open Android Studio
# 2. Tools > SDK Manager
# 3. Ensure Android SDK and Build-Tools are installed
# 4. AVD Manager > Wipe Data on your virtual device

# If app won't install
npx cap clean android
npm run build
npx cap sync android
npx cap run android
```

### iOS Issues (macOS)

```bash
# Check iOS environment
npx cap doctor

# Reset iOS simulator
# Simulator menu > Device > Erase All Content and Settings

# Clean and rebuild
npx cap clean ios
npm run build
npx cap sync ios
npx cap run ios
```

### Common Solutions

1. **"Command not found"** - Restart terminal after installing Android Studio
2. **"No devices found"** - Make sure emulator is running first
3. **"Build failed"** - Run `npm run build` first, then `npx cap sync`
4. **"App crashes"** - Check browser console for errors in dev tools

## 🎯 Testing Your Weather App

### Features to Test

- ✅ **Touch interactions** - Tap buttons, scroll lists
- ✅ **Swipe gestures** - Swipe between Home and Weather screens
- ✅ **Pull-to-refresh** - Pull down on weather screen
- ✅ **Location services** - Test GPS location button
- ✅ **Haptic feedback** - Feel vibrations on supported devices
- ✅ **Offline support** - Disconnect internet, test cached data
- ✅ **Theme switching** - Test dark/light theme toggle
- ✅ **Responsive design** - Test different screen sizes
- ✅ **Keyboard handling** - Type in city search field

### Performance Testing

- ✅ **App startup time**
- ✅ **Navigation smoothness**
- ✅ **Animation performance**
- ✅ **Memory usage**
- ✅ **Network requests**

## 🏆 Pro Tips

1. **Use Live Reload** for faster development:

   ```powershell
   npx cap run android --livereload --external
   ```

2. **Debug with Chrome DevTools**:
   - Android: `chrome://inspect` in Chrome browser
   - iOS: Safari Web Inspector

3. **Test Multiple Screen Sizes**:
   - Create multiple AVDs with different screen sizes
   - Test landscape and portrait orientations

4. **Performance Monitoring**:
   - Use Android Studio's Performance Profiler
   - Use Xcode's Instruments on iOS

---

🎉 **Your weather app is now ready for mobile testing!** The simulators will show exactly how your app looks and behaves on real devices.
