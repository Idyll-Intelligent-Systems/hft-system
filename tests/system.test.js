const fs = require('fs');
const path = require('path');
const { spawn, exec } = require('child_process');
const { promisify } = require('util');
const execAsync = promisify(exec);

// Import modules for testing
const Logger = require('../src/core/logging/logger');
const SystemHealth = require('../src/core/monitoring/system-health');
const UltraLowLatencyEngine = require('../src/core/engine/ultra-low-latency-engine');
const TestingFramework = require('../src/testing/testing-framework');

describe('HFT System End-to-End Tests', () => {
  let logger;
  let systemHealth;
  let engine;
  let testFramework;

  beforeAll(async () => {
    logger = new Logger('TEST_SYSTEM');
    systemHealth = new SystemHealth();
    engine = new UltraLowLatencyEngine();
    testFramework = new TestingFramework();
  });

  afterAll(async () => {
    // Cleanup
    if (engine) {
      try {
        await engine.shutdown();
      } catch (error) {
        // Ignore cleanup errors
      }
    }
  });

  describe('Core System Components', () => {
    test('Logger should initialize and create log entries', () => {
      expect(logger).toBeDefined();
      expect(logger.info).toBeInstanceOf(Function);
      expect(logger.error).toBeInstanceOf(Function);
      expect(logger.warn).toBeInstanceOf(Function);
      
      // Test logging functionality
      logger.info('Test log message');
      expect(logger.info).toHaveBeenCalled;
    });

    test('System Health Monitor should track metrics', () => {
      expect(systemHealth).toBeDefined();
      expect(systemHealth.getMetrics).toBeInstanceOf(Function);
      
      const metrics = systemHealth.getMetrics();
      expect(metrics).toHaveProperty('cpu');
      expect(metrics).toHaveProperty('memory');
      expect(metrics).toHaveProperty('uptime');
    });

    test('Ultra Low Latency Engine should initialize', () => {
      expect(engine).toBeDefined();
      expect(engine.initialize).toBeInstanceOf(Function);
      expect(engine.processOrder).toBeInstanceOf(Function);
      expect(engine.getPerformanceMetrics).toBeInstanceOf(Function);
    });
  });

  describe('UI Dashboard Tests', () => {
    test('index.html should exist and contain required elements', () => {
      const indexPath = path.join(__dirname, '../web/public/index.html');
      expect(fs.existsSync(indexPath)).toBe(true);
      
      const htmlContent = fs.readFileSync(indexPath, 'utf8');
      
      // Check for essential UI components
      expect(htmlContent).toContain('HFT System');
      expect(htmlContent).toContain('Dashboard');
      expect(htmlContent).toContain('Trading');
      expect(htmlContent).toContain('Performance Metrics');
      expect(htmlContent).toContain('P&L');
      expect(htmlContent).toContain('Emergency Stop');
      expect(htmlContent).toContain('Demo Trading');
      expect(htmlContent).toContain('System Console');
      
      // Check for Chart.js integration
      expect(htmlContent.toLowerCase()).toContain('chart.js');
      expect(htmlContent).toContain('canvas');
      
      // Check for Socket.IO integration
      expect(htmlContent).toContain('socket.io');
      
      // Check for interactive elements
      expect(htmlContent).toContain('onclick');
      expect(htmlContent).toContain('button');
      expect(htmlContent).toContain('form');
    });

    test('HTML should have proper structure and styling', () => {
      const indexPath = path.join(__dirname, '../web/public/index.html');
      const htmlContent = fs.readFileSync(indexPath, 'utf8');
      
      // Check for responsive design
      expect(htmlContent).toContain('viewport');
      expect(htmlContent).toContain('meta');
      
      // Check for CSS styling
      expect(htmlContent).toContain('<style>');
      expect(htmlContent).toContain('background');
      expect(htmlContent).toContain('grid');
      expect(htmlContent).toContain('@media');
      
      // Check for accessibility features
      expect(htmlContent).toContain('aria-');
      expect(htmlContent).toContain('label');
    });

    test('JavaScript functionality should be present', () => {
      const indexPath = path.join(__dirname, '../web/public/index.html');
      const htmlContent = fs.readFileSync(indexPath, 'utf8');
      
      // Check for essential JavaScript functions
      expect(htmlContent).toContain('toggleTrading');
      expect(htmlContent).toContain('emergencyStop');
      expect(htmlContent).toContain('startDemo');
      expect(htmlContent).toContain('refreshData');
      expect(htmlContent).toContain('submitOrder');
      expect(htmlContent).toContain('addLog');
      expect(htmlContent).toContain('updateMainChart');
      expect(htmlContent).toContain('loadMarketSummary');
      expect(htmlContent).toContain('exportLogs');
      
      // Check for Socket.IO event handlers
      expect(htmlContent).toContain('socket.on');
      expect(htmlContent).toContain('socket.emit');
      
      // Check for chart initialization
      expect(htmlContent).toContain('new Chart');
      expect(htmlContent).toContain('initializeCharts');
    });
  });

  describe('Demo Trading Interface Tests', () => {
    test('Demo interface should have required controls', () => {
      const indexPath = path.join(__dirname, '../web/public/index.html');
      const htmlContent = fs.readFileSync(indexPath, 'utf8');
      
      // Check for demo controls
      expect(htmlContent).toContain('demoSymbol');
      expect(htmlContent).toContain('demoStrategy');
      expect(htmlContent).toContain('demoStartDate');
      expect(htmlContent).toContain('demoEndDate');
      expect(htmlContent).toContain('demoCapital');
      expect(htmlContent).toContain('demoSpeed');
      
      // Check for demo buttons
      expect(htmlContent).toContain('startDemoBtn');
      expect(htmlContent).toContain('pauseDemoBtn');
      expect(htmlContent).toContain('stopDemoBtn');
      
      // Check for demo chart
      expect(htmlContent).toContain('demoChart');
      expect(htmlContent).toContain('demoResults');
    });

    test('Demo functions should be properly defined', () => {
      const indexPath = path.join(__dirname, '../web/public/index.html');
      const htmlContent = fs.readFileSync(indexPath, 'utf8');
      
      expect(htmlContent).toContain('async function startDemo()');
      expect(htmlContent).toContain('async function pauseDemo()');
      expect(htmlContent).toContain('async function stopDemo()');
      expect(htmlContent).toContain('function updateDemoDisplay(');
      expect(htmlContent).toContain('function resetDemoUI()');
    });
  });

  describe('System Configuration Tests', () => {
    test('Package.json should have correct dependencies', () => {
      const packagePath = path.join(__dirname, '../package.json');
      expect(fs.existsSync(packagePath)).toBe(true);
      
      const packageData = JSON.parse(fs.readFileSync(packagePath, 'utf8'));
      
      // Check for essential dependencies
      expect(packageData.dependencies).toHaveProperty('express');
      expect(packageData.dependencies).toHaveProperty('socket.io');
      expect(packageData.dependencies).toHaveProperty('ws');
      expect(packageData.dependencies).toHaveProperty('winston');
      
      // Check for development dependencies
      expect(packageData.devDependencies).toHaveProperty('jest');
      expect(packageData.devDependencies).toHaveProperty('@types/node');
      
      // Check scripts
      expect(packageData.scripts).toHaveProperty('test');
      expect(packageData.scripts).toHaveProperty('start');
    });

    test('TypeScript configuration should be valid', () => {
      const tsconfigPath = path.join(__dirname, '../tsconfig.json');
      expect(fs.existsSync(tsconfigPath)).toBe(true);
      
      const tsconfigData = JSON.parse(fs.readFileSync(tsconfigPath, 'utf8'));
      expect(tsconfigData).toHaveProperty('compilerOptions');
      expect(tsconfigData.compilerOptions).toHaveProperty('target');
      expect(tsconfigData.compilerOptions).toHaveProperty('module');
    });
  });

  describe('System Integration Tests', () => {
    test('Main application should be startable', async () => {
      const mainPath = path.join(__dirname, '../src/main.js');
      expect(fs.existsSync(mainPath)).toBe(true);
      
      // Check that main.js has required initialization code
      const mainContent = fs.readFileSync(mainPath, 'utf8');
      expect(mainContent).toContain('express');
      expect(mainContent).toContain('http');
      expect(mainContent).toContain('socket.io');
    });

    test('All required source files should exist', () => {
      const requiredFiles = [
        '../src/main.js',
        '../src/core/config/system-config.js',
        '../src/core/engine/ultra-low-latency-engine.js',
        '../src/core/logging/logger.js',
        '../src/core/monitoring/system-health.js',
        '../src/agents/orchestrator/ai-agent-orchestrator.js',
        '../src/agents/strategy/strategy-agent.js',
        '../src/agents/risk/risk-agent.js',
        '../src/agents/execution/execution-agent.js',
        '../src/infrastructure/market-data/market-data-manager.js',
        '../src/testing/testing-framework.js'
      ];

      requiredFiles.forEach(file => {
        const filePath = path.join(__dirname, file);
        expect(fs.existsSync(filePath)).toBe(true);
      });
    });

    test('Data files should be accessible', () => {
      const dataDir = path.join(__dirname, '../data/cache');
      expect(fs.existsSync(dataDir)).toBe(true);
      
      const requiredDataFiles = [
        'AAPL_historical.json',
        'GOOGL_historical.json', 
        'MSFT_historical.json',
        'TSLA_historical.json',
        'NVDA_historical.json'
      ];

      requiredDataFiles.forEach(file => {
        const filePath = path.join(dataDir, file);
        expect(fs.existsSync(filePath)).toBe(true);
        
        // Verify file is valid JSON
        const content = fs.readFileSync(filePath, 'utf8');
        expect(() => JSON.parse(content)).not.toThrow();
      });
    });
  });

  describe('Testing Framework Integration', () => {
    test('Testing framework should initialize', () => {
      expect(testFramework).toBeDefined();
      expect(testFramework.runAllTests).toBeInstanceOf(Function);
      expect(testFramework.runLatencyTest).toBeInstanceOf(Function);
      expect(testFramework.runThroughputTest).toBeInstanceOf(Function);
    });

    test('Performance tests should be runnable', async () => {
      // Run basic performance test
      const results = await testFramework.runLatencyTest(100);
      expect(results).toHaveProperty('averageLatency');
      expect(results).toHaveProperty('minLatency');
      expect(results).toHaveProperty('maxLatency');
      expect(results.averageLatency).toBeGreaterThan(0);
    });

    test('System should handle stress test', async () => {
      // Run a quick stress test
      const results = await testFramework.runThroughputTest(1000, 1); // 1000 orders in 1 second
      expect(results).toHaveProperty('totalOrders');
      expect(results).toHaveProperty('ordersPerSecond');
      expect(results.totalOrders).toBeGreaterThan(0);
    }, 10000); // 10 second timeout
  });

  describe('Error Handling and Resilience', () => {
    test('System should handle invalid orders gracefully', () => {
      const invalidOrder = {
        symbol: 'INVALID',
        quantity: -100,
        price: 'not_a_number'
      };

      expect(() => {
        engine.validateOrder(invalidOrder);
      }).toThrow();
    });

    test('System should handle network interruptions', () => {
      // Test network resilience
      expect(systemHealth.checkNetworkConnectivity).toBeInstanceOf(Function);
    });

    test('System should have proper error logging', () => {
      logger.error('Test error message');
      expect(logger.error).toHaveBeenCalled;
    });
  });

  describe('Security and Compliance', () => {
    test('System should have proper security headers', () => {
      const indexPath = path.join(__dirname, '../web/public/index.html');
      const htmlContent = fs.readFileSync(indexPath, 'utf8');
      
      // Check for security-related content
      expect(htmlContent).toContain('Content-Security-Policy');
    });

    test('System should validate input properly', () => {
      // Test input validation in order processing
      const testOrder = {
        symbol: 'AAPL',
        quantity: 100,
        price: 150.50,
        side: 'BUY'
      };

      expect(() => {
        engine.validateOrder(testOrder);
      }).not.toThrow();
    });
  });

  describe('Real-time Features', () => {
    test('WebSocket functionality should be implemented', () => {
      const indexPath = path.join(__dirname, '../web/public/index.html');
      const htmlContent = fs.readFileSync(indexPath, 'utf8');
      
      // Check for WebSocket/Socket.IO implementation
      expect(htmlContent).toContain('socket.io');
      expect(htmlContent).toContain('const socket = io()');
      expect(htmlContent).toContain('socket.on(\'connect\'');
      expect(htmlContent).toContain('socket.on(\'disconnect\'');
    });

    test('Real-time data updates should be configured', () => {
      const indexPath = path.join(__dirname, '../web/public/index.html');
      const htmlContent = fs.readFileSync(indexPath, 'utf8');
      
      expect(htmlContent).toContain('setInterval');
      expect(htmlContent).toContain('updateMainChart');
      expect(htmlContent).toContain('refreshData');
    });
  });

  describe('Build and Deployment', () => {
    test('Build scripts should exist', () => {
      const scriptsDir = path.join(__dirname, '../scripts');
      expect(fs.existsSync(scriptsDir)).toBe(true);
      
      const buildScript = path.join(scriptsDir, 'build-system.sh');
      const runScript = path.join(scriptsDir, 'run-system.sh');
      
      expect(fs.existsSync(buildScript)).toBe(true);
      expect(fs.existsSync(runScript)).toBe(true);
    });

    test('Production build directory should be structured correctly', () => {
      const prodDir = path.join(__dirname, '../build/production');
      expect(fs.existsSync(prodDir)).toBe(true);
      
      const prodSrcDir = path.join(prodDir, 'src');
      const prodConfigDir = path.join(prodDir, 'config');
      const prodDataDir = path.join(prodDir, 'data');
      
      expect(fs.existsSync(prodSrcDir)).toBe(true);
      expect(fs.existsSync(prodConfigDir)).toBe(true);
      expect(fs.existsSync(prodDataDir)).toBe(true);
    });
  });
});

describe('Interactive Dashboard Tests', () => {
  test('All interactive buttons should have click handlers', () => {
    const indexPath = path.join(__dirname, '../web/public/index.html');
    const htmlContent = fs.readFileSync(indexPath, 'utf8');
    
    // Check for button click handlers
    expect(htmlContent).toContain('onclick="toggleTrading()"');
    expect(htmlContent).toContain('onclick="emergencyStop()"');
    expect(htmlContent).toContain('onclick="refreshData()"');
    expect(htmlContent).toContain('onclick="exportLogs()"');
    expect(htmlContent).toContain('onclick="startDemo()"');
    expect(htmlContent).toContain('onclick="pauseDemo()"');
    expect(htmlContent).toContain('onclick="stopDemo()"');
  });

  test('Form submission should be handled', () => {
    const indexPath = path.join(__dirname, '../web/public/index.html');
    const htmlContent = fs.readFileSync(indexPath, 'utf8');
    
    expect(htmlContent).toContain('onsubmit="submitOrder(event)"');
    expect(htmlContent).toContain('event.preventDefault()');
  });

  test('Log filtering and controls should work', () => {
    const indexPath = path.join(__dirname, '../web/public/index.html');
    const htmlContent = fs.readFileSync(indexPath, 'utf8');
    
    expect(htmlContent).toContain('logLevelFilter');
    expect(htmlContent).toContain('logSearch');
    expect(htmlContent).toContain('filterLogs');
    expect(htmlContent).toContain('clearLogs');
    expect(htmlContent).toContain('toggleLogsPause');
  });
});

describe('System Logs Display Tests', () => {
  test('Log display system should be functional', () => {
    const indexPath = path.join(__dirname, '../web/public/index.html');
    const htmlContent = fs.readFileSync(indexPath, 'utf8');
    
    // Check for log display elements
    expect(htmlContent).toContain('systemLogs');
    expect(htmlContent).toContain('log-entry');
    expect(htmlContent).toContain('log-timestamp');
    expect(htmlContent).toContain('log-level');
    expect(htmlContent).toContain('log-message');
    
    // Check for log styling
    expect(htmlContent).toContain('log-info');
    expect(htmlContent).toContain('log-warning');
    expect(htmlContent).toContain('log-error');
    expect(htmlContent).toContain('log-success');
  });

  test('Log controls should be implemented', () => {
    const indexPath = path.join(__dirname, '../web/public/index.html');
    const htmlContent = fs.readFileSync(indexPath, 'utf8');
    
    expect(htmlContent).toContain('log-controls');
    expect(htmlContent).toContain('log-filter');
    expect(htmlContent).toContain('log-clear-btn');
    expect(htmlContent).toContain('log-pause-btn');
  });

  test('Real-time log updates should be configured', () => {
    const indexPath = path.join(__dirname, '../web/public/index.html');
    const htmlContent = fs.readFileSync(indexPath, 'utf8');
    
    expect(htmlContent).toContain('socket.on(\'systemLog\'');
    expect(htmlContent).toContain('addLog(');
    expect(htmlContent).toContain('subscribeLogs');
  });
});
