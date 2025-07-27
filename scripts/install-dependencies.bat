@echo off
REM Windows Installation Script for Idyll HFT System
REM Version: 1.0
REM Compatible: Windows 10/11

setlocal EnableDelayedExpansion

echo [INFO] Starting Idyll HFT System dependency installation for Windows...

REM Check if running as administrator
net session >nul 2>&1
if %errorLevel% neq 0 (
    echo [WARNING] This script should be run as Administrator for best results.
    echo Press any key to continue anyway, or Ctrl+C to exit and run as Administrator.
    pause >nul
)

REM Create installation directory
if not exist "C:\HFT-Install" mkdir "C:\HFT-Install"
cd /d "C:\HFT-Install"

echo [INFO] Checking for required software...

REM Check if Chocolatey is installed
choco -v >nul 2>&1
if %errorLevel% neq 0 (
    echo [INFO] Installing Chocolatey package manager...
    powershell -Command "Set-ExecutionPolicy Bypass -Scope Process -Force; [System.Net.ServicePointManager]::SecurityProtocol = [System.Net.ServicePointManager]::SecurityProtocol -bor 3072; iex ((New-Object System.Net.WebClient).DownloadString('https://community.chocolatey.org/install.ps1'))"
    
    REM Refresh environment variables
    call refreshenv
) else (
    echo [SUCCESS] Chocolatey is already installed
)

REM Install essential tools via Chocolatey
echo [INFO] Installing essential development tools...
choco install -y git
choco install -y curl
choco install -y wget
choco install -y 7zip
choco install -y notepadplusplus
choco install -y vscode
choco install -y python3
choco install -y cmake
choco install -y nodejs --version=20.10.0

REM Install Visual Studio Build Tools (required for native modules)
echo [INFO] Installing Visual Studio Build Tools...
choco install -y visualstudio2022buildtools
choco install -y visualstudio2022-workload-vctools

REM Install Windows SDK
choco install -y windows-sdk-10-version-2004-all

REM Install MongoDB
echo [INFO] Installing MongoDB...
choco install -y mongodb
net start MongoDB

REM Install Redis (using Memurai as Redis alternative for Windows)
echo [INFO] Installing Redis (Memurai)...
choco install -y memurai-developer

REM Install InfluxDB
echo [INFO] Installing InfluxDB...
choco install -y influxdb

REM Install Apache Kafka
echo [INFO] Installing Apache Kafka...
choco install -y apache-kafka

REM Install Docker Desktop
echo [INFO] Installing Docker Desktop...
choco install -y docker-desktop

REM Install additional tools
echo [INFO] Installing additional development tools...
choco install -y make
choco install -y gnu-which
choco install -y grep
choco install -y sed
choco install -y gawk
choco install -y cygwin

REM Refresh environment variables
call refreshenv

REM Verify Node.js installation
node --version >nul 2>&1
if %errorLevel% neq 0 (
    echo [ERROR] Node.js installation failed
    pause
    exit /b 1
) else (
    echo [SUCCESS] Node.js installed: 
    node --version
)

REM Install global npm packages
echo [INFO] Installing global npm packages...
npm install -g typescript
npm install -g ts-node
npm install -g nodemon
npm install -g pm2
npm install -g @types/node
npm install -g eslint
npm install -g prettier
npm install -g windows-build-tools

REM Install Python packages for AI/ML
echo [INFO] Installing Python packages for AI/ML...
python -m pip install --upgrade pip
pip install numpy pandas scikit-learn tensorflow torch jupyter matplotlib seaborn plotly

REM Create necessary directories
echo [INFO] Creating project directories...
if not exist "logs" mkdir "logs"
if not exist "%USERPROFILE%\hft-data" mkdir "%USERPROFILE%\hft-data"
if not exist "%USERPROFILE%\hft-backups" mkdir "%USERPROFILE%\hft-backups"
if not exist "%USERPROFILE%\.hft-config" mkdir "%USERPROFILE%\.hft-config"

REM Create environment variables file
echo [INFO] Setting up environment variables...
(
echo # Idyll HFT System Environment Variables
echo set HFT_HOME=%CD%
echo set HFT_LOGS=%CD%\logs
echo set HFT_DATA=%USERPROFILE%\hft-data
echo set HFT_BACKUPS=%USERPROFILE%\hft-backups
echo set HFT_CONFIG=%USERPROFILE%\.hft-config
echo.
echo # Database URLs
echo set MONGODB_URL=mongodb://localhost:27017/hft-system
echo set REDIS_URL=redis://localhost:6379
echo set INFLUXDB_URL=http://localhost:8086
echo.
echo # Kafka Configuration
echo set KAFKA_BROKERS=localhost:9092
echo.
echo # Security
echo set JWT_SECRET=your-jwt-secret-change-in-production
echo set ENCRYPTION_KEY=your-encryption-key-change-in-production
echo.
echo # API Keys ^(to be filled^)
echo set ALPHA_VANTAGE_API_KEY=
echo set BLOOMBERG_API_KEY=
echo set REUTERS_API_KEY=
echo.
echo # Performance Settings
echo set NODE_ENV=development
echo set UV_THREADPOOL_SIZE=128
echo set NODE_OPTIONS=--max-old-space-size=8192
) > "%USERPROFILE%\.hft-env.bat"

REM Add environment variables to user profile
echo [INFO] Adding environment variables to user profile...
setx PATH "%PATH%;%CD%\scripts" /M >nul 2>&1

REM Configure Windows for high-performance trading
echo [INFO] Applying Windows optimizations for low-latency trading...

REM Set high performance power plan
powercfg /setactive 8c5e7fda-e8bf-4a96-9a85-a6e23a8c635c

REM Disable Windows Defender real-time protection for development (optional)
echo [WARNING] Consider temporarily disabling Windows Defender real-time protection for development
echo You can do this manually in Windows Security settings

REM Configure network settings for low latency
echo [INFO] Configuring network settings...
netsh int tcp set global autotuninglevel=disabled
netsh int tcp set global chimney=enabled
netsh int tcp set global rss=enabled
netsh int tcp set global netdma=enabled

REM Install Visual C++ Redistributables
echo [INFO] Installing Visual C++ Redistributables...
choco install -y vcredist-all

REM Install project dependencies if package.json exists
if exist "package.json" (
    echo [INFO] Installing project Node.js dependencies...
    npm install
) else (
    echo [WARNING] package.json not found. Make sure you're in the project directory.
)

REM Create startup scripts
echo [INFO] Creating startup scripts...

REM Create MongoDB startup script
(
echo @echo off
echo echo Starting MongoDB...
echo net start MongoDB
echo if %%errorLevel%% neq 0 (
echo     echo MongoDB service not found, starting manually...
echo     mongod --dbpath="%USERPROFILE%\mongodb-data" --logpath="logs\mongodb.log"
echo ^)
) > "%CD%\scripts\start-mongodb.bat"

REM Create Redis startup script
(
echo @echo off
echo echo Starting Redis...
echo net start Memurai
echo if %%errorLevel%% neq 0 (
echo     echo Memurai service not found, please install Memurai Developer
echo ^)
) > "%CD%\scripts\start-redis.bat"

REM Create InfluxDB startup script
(
echo @echo off
echo echo Starting InfluxDB...
echo net start InfluxDB
echo if %%errorLevel%% neq 0 (
echo     echo InfluxDB service not found, starting manually...
echo     influxd
echo ^)
) > "%CD%\scripts\start-influxdb.bat"

REM Create Kafka startup script
(
echo @echo off
echo echo Starting Kafka...
echo cd /d "C:\tools\kafka"
echo start "Zookeeper" bin\windows\zookeeper-server-start.bat config\zookeeper.properties
echo timeout /t 10
echo start "Kafka" bin\windows\kafka-server-start.bat config\server.properties
) > "%CD%\scripts\start-kafka.bat"

REM Verification
echo [INFO] Verifying installations...

node --version >nul 2>&1
if %errorLevel% equ 0 (
    echo [SUCCESS] Node.js: 
    node --version
) else (
    echo [ERROR] Node.js verification failed
)

mongod --version >nul 2>&1
if %errorLevel% equ 0 (
    echo [SUCCESS] MongoDB installed
) else (
    echo [ERROR] MongoDB verification failed
)

docker --version >nul 2>&1
if %errorLevel% equ 0 (
    echo [SUCCESS] Docker: 
    docker --version
) else (
    echo [ERROR] Docker verification failed
)

python --version >nul 2>&1
if %errorLevel% equ 0 (
    echo [SUCCESS] Python: 
    python --version
) else (
    echo [ERROR] Python verification failed
)

echo.
echo [SUCCESS] 🎉 Idyll HFT System dependencies installation completed!
echo.
echo Next steps:
echo 1. Source the environment variables: call "%USERPROFILE%\.hft-env.bat"
echo 2. Run the build script: scripts\build-system.bat
echo 3. Start the system: scripts\run-system.bat
echo.
echo [WARNING] Please restart your command prompt to ensure all environment variables are loaded.
echo [INFO] Installation log saved to: logs\hft-installation.log

pause
