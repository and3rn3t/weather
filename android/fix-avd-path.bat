@echo off
echo ========================================
echo Setting Android SDK Environment Variables
echo ========================================

REM Set environment variables for current session
set ANDROID_HOME=C:\Users\and3r\AppData\Local\Android\Sdk
set ANDROID_SDK_ROOT=C:\Users\and3r\AppData\Local\Android\Sdk
set PATH=%ANDROID_HOME%\platform-tools;%ANDROID_HOME%\tools;%ANDROID_HOME%\tools\bin;%PATH%

echo ANDROID_HOME set to: %ANDROID_HOME%
echo ANDROID_SDK_ROOT set to: %ANDROID_SDK_ROOT%
echo.

echo ========================================
echo Setting Permanent Environment Variables
echo ========================================
echo Adding ANDROID_HOME to system environment...

REM Set permanent environment variables
setx ANDROID_HOME "C:\Users\and3r\AppData\Local\Android\Sdk"
setx ANDROID_SDK_ROOT "C:\Users\and3r\AppData\Local\Android\Sdk"

echo.
echo Environment variables have been set!
echo Please restart Android Studio for changes to take effect.
echo.

echo ========================================
echo Verification
echo ========================================
echo Checking if SDK directory exists...
if exist "%ANDROID_HOME%" (
    echo ✓ Android SDK found at: %ANDROID_HOME%
) else (
    echo ✗ Android SDK NOT found at: %ANDROID_HOME%
)

echo.
echo After restarting Android Studio, try creating an AVD again.
pause
