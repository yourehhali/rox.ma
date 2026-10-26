@REM Maven Wrapper for Windows — same only-script pattern as mvnw.
@echo off
setlocal
set WRAPPER_DIR=%~dp0
set PROPS=%WRAPPER_DIR%.mvn\wrapper\maven-wrapper.properties
for /f "tokens=1,* del==" %%a in ('findstr /b distributionUrl %PROPS%') do set DIST_URL=%%b
for %%i in ("%DIST_URL%") do set MAVEN_BASENAME=%%~ni
set CACHE_DIR=%USERPROFILE%\.m2\wrapper\dists\%MAVEN_BASENAME%
set MVN_BIN=%CACHE_DIR%\%MAVEN_BASENAME%\bin\mvn.cmd
if exist "%MVN_BIN%" goto run
echo Downloading Maven from %DIST_URL% ...
powershell -Command "Invoke-WebRequest -Uri '%DIST_URL%' -OutFile '%CACHE_DIR%\dist.zip'"
powershell -Command "Expand-Archive -Path '%CACHE_DIR%\dist.zip' -DestinationPath '%CACHE_DIR%' -Force"
del "%CACHE_DIR%\dist.zip"
:run
"%MVN_BIN%" %*
