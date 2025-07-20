@echo off
echo ========================================
echo Android SDK Setup - Installing Missing Components
echo ========================================

REM Set Android SDK path
set ANDROID_SDK_ROOT=C:\Users\and3r\AppData\Local\Android\Sdk
set PATH=%ANDROID_SDK_ROOT%\platform-tools;%ANDROID_SDK_ROOT%\tools\bin;%PATH%

echo Android SDK Location: %ANDROID_SDK_ROOT%
echo.

echo This script will help you download the missing Android SDK components needed for AVD creation.
echo.
echo You need to manually download and install:
echo 1. Android SDK Command Line Tools
echo 2. At least one Android Platform (API 34 recommended)
echo 3. System Images for emulator
echo.

echo ========================================
echo STEP 1: Download Command Line Tools
echo ========================================
echo 1. Go to: https://developer.android.com/studio#command-tools
echo 2. Download "Command line tools only" for Windows
echo 3. Extract the zip file
echo 4. Copy the 'cmdline-tools' folder to: %ANDROID_SDK_ROOT%\cmdline-tools\latest\
echo.

echo ========================================
echo STEP 2: After installing command line tools, run these commands:
echo ========================================
echo cd "%ANDROID_SDK_ROOT%\cmdline-tools\latest\bin"
echo sdkmanager "platforms;android-34"
echo sdkmanager "system-images;android-34;google_apis;x86_64"
echo sdkmanager "build-tools;34.0.0"
echo.

echo ========================================
echo STEP 3: Alternative - Use Android Studio SDK Manager
echo ========================================
echo 1. Open Android Studio
echo 2. Go to: File ^> Settings ^> Appearance ^& Behavior ^> System Settings ^> Android SDK
echo 3. In SDK Platforms tab: Check "Android 14.0 (API 34)"
echo 4. In SDK Tools tab: Check "Android SDK Command-line Tools"
echo 5. Click "Apply" to download
echo.

pause
