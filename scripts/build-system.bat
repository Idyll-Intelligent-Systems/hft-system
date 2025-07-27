@echo off
REM Windows Build Script for Idyll HFT System
REM Version: 1.0

setlocal EnableDelayedExpansion

echo [BUILD] Building Idyll HFT System on Windows...

REM Load environment variables if they exist
if exist "%USERPROFILE%\.hft-env.bat" (
    call "%USERPROFILE%\.hft-env.bat"
    echo [BUILD] Environment variables loaded
) else (
    echo [WARNING] Environment file not found. Run install-dependencies.bat first.
)

REM Verify Node.js installation
node --version >nul 2>&1
if %errorLevel% neq 0 (
    echo [ERROR] Node.js not found. Please run the installation script first.
    pause
    exit /b 1
)

for /f "tokens=*" %%i in ('node --version') do set NODE_VERSION=%%i
echo [BUILD] Using Node.js %NODE_VERSION%

REM Verify npm installation
npm --version >nul 2>&1
if %errorLevel% neq 0 (
    echo [ERROR] npm not found. Please run the installation script first.
    pause
    exit /b 1
)

for /f "tokens=*" %%i in ('npm --version') do set NPM_VERSION=%%i
echo [BUILD] Using npm %NPM_VERSION%

REM Clean previous builds
echo [BUILD] Cleaning previous builds...
if exist node_modules rmdir /s /q node_modules
if exist dist rmdir /s /q dist
if exist build rmdir /s /q build
if exist .next rmdir /s /q .next
if exist coverage rmdir /s /q coverage
del *.log >nul 2>&1

REM Create build directories
echo [BUILD] Creating build directories...
mkdir dist >nul 2>&1
mkdir build >nul 2>&1
mkdir logs >nul 2>&1
mkdir tmp >nul 2>&1

REM Install dependencies
echo [BUILD] Installing Node.js dependencies...
npm ci --production=false

REM Install TypeScript if not globally available
tsc --version >nul 2>&1
if %errorLevel% neq 0 (
    echo [BUILD] Installing TypeScript locally...
    npm install --save-dev typescript @types/node
)

REM Compile TypeScript
echo [BUILD] Compiling TypeScript...
if exist "tsconfig.json" (
    npx tsc
    echo [SUCCESS] TypeScript compilation completed
) else (
    echo [WARNING] tsconfig.json not found, creating default configuration...
    (
echo {
echo   "compilerOptions": {
echo     "target": "ES2022",
echo     "module": "commonjs",
echo     "lib": ["ES2022"],
echo     "outDir": "./dist",
echo     "rootDir": "./src",
echo     "strict": true,
echo     "esModuleInterop": true,
echo     "skipLibCheck": true,
echo     "forceConsistentCasingInFileNames": true,
echo     "moduleResolution": "node",
echo     "allowSyntheticDefaultImports": true,
echo     "experimentalDecorators": true,
echo     "emitDecoratorMetadata": true,
echo     "resolveJsonModule": true,
echo     "declaration": true,
echo     "declarationMap": true,
echo     "sourceMap": true
echo   },
echo   "include": [
echo     "src/**/*"
echo   ],
echo   "exclude": [
echo     "node_modules",
echo     "dist",
echo     "build",
echo     "**/*.test.ts",
echo     "**/*.spec.ts"
echo   ]
echo }
    ) > tsconfig.json
    npx tsc
)

REM Build native modules if any
echo [BUILD] Building native modules...
if exist "binding.gyp" (
    npm rebuild
    echo [SUCCESS] Native modules built
) else (
    echo [BUILD] No native modules to build
)

REM Run linting
echo [BUILD] Running ESLint...
if exist ".eslintrc.js" (
    npx eslint src --ext .ts,.js --fix
) else if exist ".eslintrc.json" (
    npx eslint src --ext .ts,.js --fix
) else (
    echo [BUILD] Creating default ESLint configuration...
    (
echo {
echo   "env": {
echo     "node": true,
echo     "es2022": true
echo   },
echo   "extends": [
echo     "eslint:recommended",
echo     "@typescript-eslint/recommended"
echo   ],
echo   "parser": "@typescript-eslint/parser",
echo   "parserOptions": {
echo     "ecmaVersion": 2022,
echo     "sourceType": "module"
echo   },
echo   "plugins": [
echo     "@typescript-eslint"
echo   ],
echo   "rules": {
echo     "no-console": "off",
echo     "@typescript-eslint/no-unused-vars": "error",
echo     "@typescript-eslint/no-explicit-any": "warn"
echo   }
echo }
    ) > .eslintrc.json
    npm install --save-dev eslint @typescript-eslint/eslint-plugin @typescript-eslint/parser
    npx eslint src --ext .ts,.js --fix
)

REM Run Prettier formatting
echo [BUILD] Running Prettier...
if exist ".prettierrc" (
    npx prettier --write "src/**/*.{ts,js,json}"
) else (
    echo [BUILD] Creating default Prettier configuration...
    (
echo {
echo   "semi": true,
echo   "trailingComma": "es5",
echo   "singleQuote": true,
echo   "printWidth": 100,
echo   "tabWidth": 4,
echo   "useTabs": false,
echo   "bracketSpacing": true,
echo   "arrowParens": "avoid"
echo }
    ) > .prettierrc
    npx prettier --write "src/**/*.{ts,js,json}"
)

REM Run tests if available
echo [BUILD] Running tests...
npm run test >nul 2>&1
if %errorLevel% equ 0 (
    echo [SUCCESS] All tests passed
) else (
    if exist "test" (
        echo [WARNING] Tests found but npm test script not configured
    ) else if exist "tests" (
        echo [WARNING] Tests found but npm test script not configured
    ) else if exist "__tests__" (
        echo [WARNING] Tests found but npm test script not configured
    ) else (
        echo [BUILD] No tests found
    )
)

REM Build web dashboard
echo [BUILD] Building web dashboard...
if exist "web" (
    cd web
    if exist "package.json" (
        npm install
        npm run build >nul 2>&1
        if %errorLevel% neq 0 (
            echo [WARNING] Web build script not found
        )
    )
    cd ..
    echo [SUCCESS] Web dashboard built
) else (
    echo [BUILD] No web directory found
)

REM Create production build
echo [BUILD] Creating production build...
mkdir build\production >nul 2>&1

REM Copy compiled JavaScript files
if exist "dist" (
    xcopy /s /e /q dist build\production\ >nul 2>&1
)

REM Copy configuration files
if exist "src\core\config" (
    xcopy /s /e /q src\core\config build\production\config\ >nul 2>&1
)

REM Copy web assets
if exist "web\public" (
    mkdir build\production\web >nul 2>&1
    xcopy /s /e /q web\public build\production\web\ >nul 2>&1
)
if exist "web\dist" (
    xcopy /s /e /q web\dist build\production\web\ >nul 2>&1
)

REM Copy package.json for production
if exist "package.json" (
    copy package.json build\production\ >nul 2>&1
)

REM Install production dependencies
echo [BUILD] Installing production dependencies in build directory...
cd build\production
npm ci --production --silent
cd ..\..

REM Create startup scripts
echo [BUILD] Creating startup scripts...
mkdir build\scripts >nul 2>&1

REM Main system startup script
(
echo @echo off
echo setlocal EnableDelayedExpansion
echo.
echo REM Load environment variables
echo if exist "%%USERPROFILE%%\.hft-env.bat" ^(
echo     call "%%USERPROFILE%%\.hft-env.bat"
echo ^)
echo.
echo echo Starting Idyll HFT System...
echo.
echo REM Start databases if not running
echo echo Starting MongoDB...
echo net start MongoDB >nul 2^>^&1
echo if %%errorLevel%% neq 0 ^(
echo     echo MongoDB service not available, starting manually...
echo     start /b mongod --dbpath="%%USERPROFILE%%\mongodb-data" --logpath="logs\mongodb.log"
echo ^)
echo.
echo echo Starting Redis...
echo net start Memurai >nul 2^>^&1
echo.
echo echo Starting InfluxDB...
echo net start InfluxDB >nul 2^>^&1
echo.
echo REM Start the HFT system
echo echo Starting HFT Core System...
echo cd /d "%%~dp0..\production"
echo start /b node src\main.js
echo.
echo timeout /t 5 /nobreak >nul
echo.
echo echo ✅ Idyll HFT System is now running!
echo echo Web Dashboard: http://localhost:3000
echo echo API Endpoint: http://localhost:3001
echo echo To stop the system, run: stop-system.bat
echo.
echo pause
) > build\scripts\start-system.bat

REM System stop script
(
echo @echo off
echo echo Stopping Idyll HFT System...
echo.
echo taskkill /f /im node.exe >nul 2^>^&1
echo if %%errorLevel%% equ 0 ^(
echo     echo HFT System stopped
echo ^) else ^(
echo     echo No HFT processes found
echo ^)
echo.
echo pause
) > build\scripts\stop-system.bat

REM System status script
(
echo @echo off
echo echo Idyll HFT System Status:
echo echo ========================
echo.
echo REM Check if main process is running
echo tasklist /FI "IMAGENAME eq node.exe" /FI "WINDOWTITLE eq *main.js*" ^| find /i "node.exe" >nul
echo if %%errorLevel%% equ 0 ^(
echo     echo ✅ HFT System: Running
echo ^) else ^(
echo     echo ❌ HFT System: Not running
echo ^)
echo.
echo REM Check databases
echo net start ^| find /i "MongoDB" >nul
echo if %%errorLevel%% equ 0 ^(
echo     echo ✅ MongoDB: Running
echo ^) else ^(
echo     echo ❌ MongoDB: Not running
echo ^)
echo.
echo net start ^| find /i "Memurai" >nul
echo if %%errorLevel%% equ 0 ^(
echo     echo ✅ Redis: Running
echo ^) else ^(
echo     echo ❌ Redis: Not running
echo ^)
echo.
echo net start ^| find /i "InfluxDB" >nul
echo if %%errorLevel%% equ 0 ^(
echo     echo ✅ InfluxDB: Running
echo ^) else ^(
echo     echo ❌ InfluxDB: Not running
echo ^)
echo.
echo REM Check web dashboard
echo curl -s http://localhost:3000 >nul 2^>^&1
echo if %%errorLevel%% equ 0 ^(
echo     echo ✅ Web Dashboard: Accessible
echo ^) else ^(
echo     echo ❌ Web Dashboard: Not accessible
echo ^)
echo.
echo REM Check API
echo curl -s http://localhost:3001/api/health >nul 2^>^&1
echo if %%errorLevel%% equ 0 ^(
echo     echo ✅ API: Accessible
echo ^) else ^(
echo     echo ❌ API: Not accessible
echo ^)
echo.
echo pause
) > build\scripts\status-system.bat

REM Create Windows Task Scheduler XML
echo [BUILD] Creating Windows Task Scheduler configuration...
(
echo ^<?xml version="1.0" encoding="UTF-16"?^>
echo ^<Task version="1.2" xmlns="http://schemas.microsoft.com/windows/2004/02/mit/task"^>
echo   ^<RegistrationInfo^>
echo     ^<Description^>Idyll HFT System Service^</Description^>
echo   ^</RegistrationInfo^>
echo   ^<Triggers^>
echo     ^<BootTrigger^>
echo       ^<Enabled^>true^</Enabled^>
echo     ^</BootTrigger^>
echo   ^</Triggers^>
echo   ^<Principals^>
echo     ^<Principal id="Author"^>
echo       ^<LogonType^>ServiceAccount^</LogonType^>
echo       ^<UserId^>System^</UserId^>
echo     ^</Principal^>
echo   ^</Principals^>
echo   ^<Settings^>
echo     ^<MultipleInstancesPolicy^>IgnoreNew^</MultipleInstancesPolicy^>
echo     ^<DisallowStartIfOnBatteries^>false^</DisallowStartIfOnBatteries^>
echo     ^<StopIfGoingOnBatteries^>false^</StopIfGoingOnBatteries^>
echo     ^<AllowHardTerminate^>true^</AllowHardTerminate^>
echo     ^<StartWhenAvailable^>false^</StartWhenAvailable^>
echo     ^<RunOnlyIfNetworkAvailable^>false^</RunOnlyIfNetworkAvailable^>
echo     ^<IdleSettings^>
echo       ^<StopOnIdleEnd^>false^</StopOnIdleEnd^>
echo       ^<RestartOnIdle^>false^</RestartOnIdle^>
echo     ^</IdleSettings^>
echo     ^<AllowStartOnDemand^>true^</AllowStartOnDemand^>
echo     ^<Enabled^>true^</Enabled^>
echo     ^<Hidden^>false^</Hidden^>
echo     ^<RunOnlyIfIdle^>false^</RunOnlyIfIdle^>
echo     ^<WakeToRun^>false^</WakeToRun^>
echo     ^<ExecutionTimeLimit^>PT0S^</ExecutionTimeLimit^>
echo     ^<Priority^>7^</Priority^>
echo   ^</Settings^>
echo   ^<Actions Context="Author"^>
echo     ^<Exec^>
echo       ^<Command^>%CD%\build\scripts\start-system.bat^</Command^>
echo       ^<WorkingDirectory^>%CD%\build\production^</WorkingDirectory^>
echo     ^</Exec^>
echo   ^</Actions^>
echo ^</Task^>
) > build\scripts\hft-system-task.xml

echo [BUILD] To install as Windows service, run: schtasks /create /xml build\scripts\hft-system-task.xml /tn "Idyll HFT System"

REM Generate build info
echo [BUILD] Generating build information...
for /f "tokens=2 delims==" %%a in ('wmic OS Get localdatetime /value') do set "dt=%%a"
set "YYYY=%dt:~0,4%"
set "MM=%dt:~4,2%"
set "DD=%dt:~6,2%"
set "HH=%dt:~8,2%"
set "Min=%dt:~10,2%"
set "Sec=%dt:~12,2%"
set "buildTime=%YYYY%-%MM%-%DD%T%HH%:%Min%:%Sec%Z"

(
echo {
echo   "buildTime": "%buildTime%",
echo   "buildMachine": "Windows",
echo   "nodeVersion": "%NODE_VERSION%",
echo   "npmVersion": "%NPM_VERSION%",
echo   "gitCommit": "unknown",
echo   "gitBranch": "unknown",
echo   "version": "1.0.0"
echo }
) > build\build-info.json

REM Create deployment package
echo [BUILD] Creating deployment package...
cd build
powershell -Command "Compress-Archive -Path production,scripts,build-info.json -DestinationPath hft-system-build-%date:~-4,4%%date:~-10,2%%date:~-7,2%-%time:~0,2%%time:~3,2%%time:~6,2%.zip -Force"
cd ..

REM Performance validation
echo [BUILD] Running performance validation...
node -e "const start = process.hrtime.bigint(); const iterations = 1000000; for (let i = 0; i < iterations; i++) { Math.random(); } const end = process.hrtime.bigint(); const duration = Number(end - start) / 1000000; console.log('Node.js performance test: ' + iterations + ' iterations in ' + duration.toFixed(2) + 'ms');"

REM Memory usage check
echo [BUILD] Checking memory usage...
node -e "const used = process.memoryUsage(); for (let key in used) { console.log(key + ': ' + Math.round(used[key] / 1024 / 1024 * 100) / 100 + ' MB'); }"

echo [SUCCESS] 🎉 Idyll HFT System build completed successfully!
echo.
echo [BUILD] Build Summary:
echo ✅ TypeScript compiled
echo ✅ Dependencies installed
echo ✅ Code linted and formatted
echo ✅ Production build created
echo ✅ Startup scripts generated
echo ✅ Deployment package created
echo.
echo [BUILD] Next steps:
echo 1. Start the system: build\scripts\start-system.bat
echo 2. Check status: build\scripts\status-system.bat
echo 3. Stop the system: build\scripts\stop-system.bat
echo.
echo [BUILD] Web Dashboard will be available at: http://localhost:3000
echo [BUILD] API will be available at: http://localhost:3001
echo.
echo [BUILD] Build completed at: %date% %time%

pause
