@echo off
REM Clear Gradle Cache and Force Java 21 Usage
echo ========================================
echo Clearing Gradle Cache and Fixing Java Version
echo ========================================

REM Set JAVA_HOME to JDK 21
set JAVA_HOME=C:\Java\jdk-21
set PATH=%JAVA_HOME%\bin;%PATH%

echo Using Java: %JAVA_HOME%
java -version
echo.

REM Stop all Gradle daemons
echo Stopping Gradle daemons...
gradlew.bat --stop 2>nul

REM Clear Gradle cache to remove Java 24 artifacts
echo Clearing Gradle cache...
rmdir /s /q "%USERPROFILE%\.gradle\caches\8.5" 2>nul
rmdir /s /q "%USERPROFILE%\.gradle\daemon" 2>nul

REM Clear project build directories
echo Clearing project build cache...
rmdir /s /q build 2>nul
rmdir /s /q app\build 2>nul
rmdir /s /q capacitor-cordova-android-plugins\build 2>nul

echo.
echo Cache cleared! Now try building with build-project.bat
pause
