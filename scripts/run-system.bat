@echo off
REM Windows Run Script for Idyll HFT System
REM Version: 1.0

setlocal EnableDelayedExpansion

echo [RUN] Starting Idyll HFT System...

REM Load environment variables if they exist
if exist "%USERPROFILE%\.hft-env.bat" (
    call "%USERPROFILE%\.hft-env.bat"
    echo [RUN] Environment variables loaded
) else (
    echo [WARNING] Environment file not found. Some features may not work properly.
)

REM Check if system is built
if not exist "build\production" (
    echo [ERROR] System not built. Please run scripts\build-system.bat first.
    pause
    exit /b 1
)

REM Function to check if a port is in use
:check_port
netstat -an | find ":%1" | find "LISTENING" >nul 2>&1
exit /b %errorLevel%

REM Function to wait for service
:wait_for_service
set service_name=%1
set port=%2
set timeout=30
set count=0

echo [INFO] Waiting for %service_name% to be ready on port %port%...

:wait_loop
call :check_port %port%
if %errorLevel% equ 0 (
    echo [SUCCESS] %service_name% is ready!
    goto :eof
)
set /a count+=1
if %count% geq %timeout% (
    echo [ERROR] %service_name% failed to start within %timeout% seconds
    exit /b 1
)
timeout /t 1 /nobreak >nul
echo|set /p="."
goto wait_loop

REM Start MongoDB
echo [INFO] Starting MongoDB...
net start MongoDB >nul 2>&1
if %errorLevel% neq 0 (
    echo [INFO] MongoDB service not available, starting manually...
    if not exist "%USERPROFILE%\mongodb-data" mkdir "%USERPROFILE%\mongodb-data"
    if not exist "logs" mkdir "logs"
    start /b mongod --dbpath="%USERPROFILE%\mongodb-data" --logpath="logs\mongodb.log"
    call :wait_for_service "MongoDB" 27017
) else (
    echo [SUCCESS] MongoDB is running
)

REM Start Redis (Memurai on Windows)
echo [INFO] Starting Redis...
net start Memurai >nul 2>&1
if %errorLevel% neq 0 (
    echo [INFO] Redis service not available, checking if running manually...
    call :check_port 6379
    if !errorLevel! neq 0 (
        echo [WARNING] Redis not found. Please install Memurai or Redis manually.
    ) else (
        echo [SUCCESS] Redis is running
    )
) else (
    echo [SUCCESS] Redis is running
)

REM Start InfluxDB
echo [INFO] Starting InfluxDB...
net start InfluxDB >nul 2>&1
if %errorLevel% neq 0 (
    echo [INFO] InfluxDB service not available, checking if running manually...
    call :check_port 8086
    if !errorLevel! neq 0 (
        echo [WARNING] InfluxDB not found. Some features may not work.
    ) else (
        echo [SUCCESS] InfluxDB is running
    )
) else (
    echo [SUCCESS] InfluxDB is running
)

REM Setup database schemas
echo [INFO] Setting up database schemas...

REM MongoDB setup
call :check_port 27017
if %errorLevel% equ 0 (
    echo [INFO] Configuring MongoDB...
    mongo --eval "use hft_system; db.createCollection('trades'); db.createCollection('orders'); db.createCollection('positions'); db.createCollection('strategies'); db.createCollection('risk_metrics'); db.createCollection('market_data'); print('MongoDB collections created');" >nul 2>&1
    if !errorLevel! equ 0 (
        echo [SUCCESS] MongoDB configured
    ) else (
        echo [WARNING] MongoDB configuration may have failed
    )
)

REM InfluxDB setup
call :check_port 8086
if %errorLevel% equ 0 (
    echo [INFO] Configuring InfluxDB...
    influx -execute "CREATE DATABASE hft_metrics" >nul 2>&1
    influx -execute "CREATE DATABASE market_data" >nul 2>&1
    echo [SUCCESS] InfluxDB configured
)

REM Redis setup
call :check_port 6379
if %errorLevel% equ 0 (
    echo [INFO] Configuring Redis...
    redis-cli CONFIG SET save "900 1 300 10 60 10000" >nul 2>&1
    echo [SUCCESS] Redis configured
)

REM Start HFT Core System
echo [INFO] Starting HFT Core System...

call :check_port 3001
if %errorLevel% equ 0 (
    echo [WARNING] HFT system appears to be already running on port 3001
) else (
    cd build\production
    if not exist "..\..\logs" mkdir "..\..\logs"
    start /b node src\main.js > "..\..\logs\hft-system.log" 2>&1
    cd ..\..
    
    call :wait_for_service "HFT System" 3001
)

REM Start Web Dashboard
echo [INFO] Starting Web Dashboard...

if exist "web" (
    call :check_port 3000
    if !errorLevel! equ 0 (
        echo [WARNING] Web dashboard appears to be already running on port 3000
    ) else (
        cd web
        if not exist "node_modules" (
            echo [INFO] Installing web dashboard dependencies...
            npm install
        )
        start /b npm start > "..\logs\web-dashboard.log" 2>&1
        cd ..
        
        call :wait_for_service "Web Dashboard" 3000
    )
) else (
    echo [WARNING] Web directory not found. Skipping web dashboard.
)

REM Create monitoring script
echo [INFO] Creating monitoring script...
(
echo @echo off
echo echo ===================================
echo echo Idyll HFT System Health Check
echo echo ===================================
echo echo Timestamp: %%date%% %%time%%
echo echo.
echo.
echo REM Check HFT system
echo tasklist /FI "IMAGENAME eq node.exe" /FI "WINDOWTITLE eq *main.js*" ^| find /i "node.exe" ^>nul
echo if %%errorLevel%% equ 0 ^(
echo     echo ✅ HFT System: Running
echo ^) else ^(
echo     echo ❌ HFT System: Not running
echo ^)
echo.
echo REM Check web dashboard
echo tasklist /FI "IMAGENAME eq node.exe" /FI "WINDOWTITLE eq *npm*" ^| find /i "node.exe" ^>nul
echo if %%errorLevel%% equ 0 ^(
echo     echo ✅ Web Dashboard: Running
echo ^) else ^(
echo     echo ❌ Web Dashboard: Not running
echo ^)
echo.
echo REM Check databases
echo netstat -an ^| find ":27017" ^| find "LISTENING" ^>nul
echo if %%errorLevel%% equ 0 ^(
echo     echo ✅ MongoDB: Running
echo ^) else ^(
echo     echo ❌ MongoDB: Not running
echo ^)
echo.
echo netstat -an ^| find ":6379" ^| find "LISTENING" ^>nul
echo if %%errorLevel%% equ 0 ^(
echo     echo ✅ Redis: Running
echo ^) else ^(
echo     echo ❌ Redis: Not running
echo ^)
echo.
echo netstat -an ^| find ":8086" ^| find "LISTENING" ^>nul
echo if %%errorLevel%% equ 0 ^(
echo     echo ✅ InfluxDB: Running
echo ^) else ^(
echo     echo ❌ InfluxDB: Not running
echo ^)
echo.
echo echo.
echo echo Service Endpoints:
echo curl -s http://localhost:3000 ^>nul 2^>^&1
echo if %%errorLevel%% equ 0 ^(
echo     echo ✅ Web Dashboard: http://localhost:3000
echo ^) else ^(
echo     echo ❌ Web Dashboard: http://localhost:3000 ^(not accessible^)
echo ^)
echo.
echo curl -s http://localhost:3001/api/health ^>nul 2^>^&1
echo if %%errorLevel%% equ 0 ^(
echo     echo ✅ API Endpoint: http://localhost:3001
echo ^) else ^(
echo     echo ❌ API Endpoint: http://localhost:3001 ^(not accessible^)
echo ^)
echo.
echo echo.
echo echo System Resources:
echo for /f "tokens=2 delims=," %%i in ^('typeperf "\Processor(_Total)\%% Processor Time" -sc 1 -f csv'^) do set cpu=%%i
echo echo CPU Usage: %%cpu%%
echo.
echo echo ===================================
echo.
echo REM Write to log
echo echo %%date%% %%time%% - Health check completed ^>^> "logs\system-health.log"
) > monitor-system.bat

REM Create stop script
echo [INFO] Creating stop script...
(
echo @echo off
echo echo [STOP] Stopping Idyll HFT System...
echo.
echo taskkill /f /im node.exe ^>nul 2^>^&1
echo if %%errorLevel%% equ 0 ^(
echo     echo [SUCCESS] HFT System stopped
echo ^) else ^(
echo     echo [WARNING] No HFT processes found
echo ^)
echo.
echo echo [SUCCESS] All system components stopped
) > stop-system.bat

echo [SUCCESS] 🎉 Idyll HFT System is now running!
echo.
echo [INFO] System Status:
echo   📊 Web Dashboard: http://localhost:3000
echo   🔌 API Endpoint: http://localhost:3001
echo   📈 System Monitoring: monitor-system.bat
echo   🛑 Stop System: stop-system.bat
echo.
echo [INFO] Log files:
echo   📄 HFT System: logs\hft-system.log
echo   📄 Web Dashboard: logs\web-dashboard.log
echo   📄 System Health: logs\system-health.log
echo.

REM Run initial health check
echo [INFO] Running initial health check...
if exist "monitor-system.bat" (
    call monitor-system.bat
)

echo.
echo [SUCCESS] System startup complete! 🚀
echo.
echo Press any key to continue monitoring (Ctrl+C to exit)...
pause >nul

REM Continuous monitoring loop
:monitor_loop
cls
call monitor-system.bat
echo.
echo [INFO] Monitoring... (Press Ctrl+C to exit, any key to refresh)
timeout /t 30 >nul
goto monitor_loop
