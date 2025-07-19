@echo off
REM Android Project Build Script
REM This script helps build your weather app while avoiding JNA library conflicts

echo ========================================
echo Premium Weather App - Android Build
echo ========================================

REM Clear any conflicting environment variables
set ANDROID_STUDIO=
set STUDIO_JDK=

REM Set JAVA_HOME to JDK 21
set JAVA_HOME=C:\Java\jdk-21
set PATH=%JAVA_HOME%\bin;%PATH%

echo Using Java: %JAVA_HOME%
echo.

REM Kill any existing Gradle daemons to avoid conflicts
echo Stopping any existing Gradle daemons...
gradlew.bat --stop 2>nul

echo.
echo Cleaning project...
gradlew.bat clean --no-daemon --console=plain

if %ERRORLEVEL% NEQ 0 (
    echo.
    echo Clean failed. Trying alternative approach...
    rmdir /s /q build 2>nul
    rmdir /s /q app\build 2>nul
    rmdir /s /q capacitor-cordova-android-plugins\build 2>nul
)

echo.
echo Building debug APK...
gradlew.bat assembleDebug --no-daemon --console=plain

if %ERRORLEVEL% EQU 0 (
    echo.
    echo ========================================
    echo BUILD SUCCESSFUL!
    echo ========================================
    echo Your APK is located at:
    echo app\build\outputs\apk\debug\app-debug.apk
    echo.
    echo You can now install this on your Android device or emulator.
) else (
    echo.
    echo ========================================
    echo BUILD FAILED
    echo ========================================
    echo Please check the error messages above.
    echo Try opening the project in Android Studio instead.
)

echo.
pause
