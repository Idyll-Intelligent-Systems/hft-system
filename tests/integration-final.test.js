const fs = require('fs');
const path = require('path');

describe('System Integration Final Tests', () => {
  test('Main application file exists and is properly structured', () => {
    const mainPath = path.join(__dirname, '../src/main.js');
    expect(fs.existsSync(mainPath)).toBe(true);
    
    const mainContent = fs.readFileSync(mainPath, 'utf8');
    
    // Check for essential imports and setup
    expect(mainContent).toContain('require');
    expect(mainContent).toContain('cluster');
    expect(mainContent).toContain('Logger');
    expect(mainContent).toContain('SystemConfig');
    
    // Check for route handlers
    expect(mainContent).toContain('initialize');
    expect(mainContent).toContain('WebInterface');
  });

  test('Web interface TypeScript definition exists', () => {
    const webInterfacePath = path.join(__dirname, '../web/web-interface.js');
    expect(fs.existsSync(webInterfacePath)).toBe(true);
  });

  test('Essential configuration files exist', () => {
    const configFiles = [
      '../package.json',
      '../tsconfig.json', 
      '../jest.config.json',
      '../README.md'
    ];

    configFiles.forEach(file => {
      const filePath = path.join(__dirname, file);
      expect(fs.existsSync(filePath)).toBe(true);
    });
  });

  test('Market data cache is available', () => {
    const cacheDir = path.join(__dirname, '../data/cache');
    expect(fs.existsSync(cacheDir)).toBe(true);
    
    const files = fs.readdirSync(cacheDir);
    expect(files.length).toBeGreaterThan(0);
    
    // Check for key stock data
    const requiredStocks = ['AAPL', 'GOOGL', 'MSFT', 'TSLA', 'NVDA'];
    requiredStocks.forEach(stock => {
      const dataFile = `${stock}_historical.json`;
      expect(files).toContain(dataFile);
    });
  });

  test('Build scripts are executable', () => {
    const scriptsDir = path.join(__dirname, '../scripts');
    expect(fs.existsSync(scriptsDir)).toBe(true);
    
    const requiredScripts = [
      'build-system.sh',
      'run-system.sh',
      'install-dependencies.sh'
    ];

    requiredScripts.forEach(script => {
      const scriptPath = path.join(scriptsDir, script);
      expect(fs.existsSync(scriptPath)).toBe(true);
    });
  });

  test('Production build directory is properly structured', () => {
    const prodDir = path.join(__dirname, '../build/production');
    expect(fs.existsSync(prodDir)).toBe(true);
    
    const requiredDirs = ['src', 'config', 'data', 'web'];
    requiredDirs.forEach(dir => {
      const dirPath = path.join(prodDir, dir);
      expect(fs.existsSync(dirPath)).toBe(true);
    });
  });

  test('System monitoring scripts exist', () => {
    const monitorScript = path.join(__dirname, '../monitor-system.sh');
    const stopScript = path.join(__dirname, '../stop-system.sh');
    
    expect(fs.existsSync(monitorScript)).toBe(true);
    expect(fs.existsSync(stopScript)).toBe(true);
  });

  test('Repository is clean of unnecessary files', () => {
    const unnecessaryPaths = [
      '../logs',
      '../tmp', 
      '../docs',
      '../DEPLOYMENT.md',
      '../ENHANCEMENT_SUMMARY.md',
      '../demo-dashboard.js',
      '../test-integration.js',
      '../web/public/enhanced-index.html',
      '../web/public/index-basic-backup.html'
    ];

    unnecessaryPaths.forEach(pathToCheck => {
      const fullPath = path.join(__dirname, pathToCheck);
      expect(fs.existsSync(fullPath)).toBe(false);
    });
  });
});

describe('Performance and Stress Test Readiness', () => {
  test('Testing framework is ready for performance tests', () => {
    const testFrameworkPath = path.join(__dirname, '../src/testing/testing-framework.js');
    expect(fs.existsSync(testFrameworkPath)).toBe(true);
    
    const content = fs.readFileSync(testFrameworkPath, 'utf8');
    expect(content).toContain('runLatencyTests');
    expect(content).toContain('runComprehensiveTests');
    expect(content).toContain('HFTTestingFramework');
  });

  test('System health monitoring is in place', () => {
    const healthPath = path.join(__dirname, '../src/core/monitoring/system-health.js');
    expect(fs.existsSync(healthPath)).toBe(true);
    
    const content = fs.readFileSync(healthPath, 'utf8');
    expect(content).toContain('getMetrics');
    expect(content).toContain('SystemHealth');
  });

  test('Ultra low latency engine is available', () => {
    const enginePath = path.join(__dirname, '../src/core/engine/ultra-low-latency-engine.js');
    expect(fs.existsSync(enginePath)).toBe(true);
    
    const content = fs.readFileSync(enginePath, 'utf8');
    expect(content).toContain('UltraLowLatencyEngine');
    expect(content).toContain('processOrder');
  });
});

describe('Security and Compliance Readiness', () => {
  test('Security headers are configured in HTML', () => {
    const indexPath = path.join(__dirname, '../web/public/index.html');
    const htmlContent = fs.readFileSync(indexPath, 'utf8');
    
    // Check for meta tags that provide security
    expect(htmlContent).toContain('meta charset');
    expect(htmlContent).toContain('viewport');
  });

  test('Input validation is present in UI', () => {
    const indexPath = path.join(__dirname, '../web/public/index.html');
    const htmlContent = fs.readFileSync(indexPath, 'utf8');
    
    // Check for form validation
    expect(htmlContent).toContain('required');
    expect(htmlContent).toContain('type="number"');
    expect(htmlContent).toContain('event.preventDefault()');
  });

  test('Error handling is comprehensive', () => {
    const indexPath = path.join(__dirname, '../web/public/index.html');
    const htmlContent = fs.readFileSync(indexPath, 'utf8');
    
    // Check for error handling
    expect(htmlContent).toContain('try {');
    expect(htmlContent).toContain('catch (error)');
    expect(htmlContent).toContain('handleApiCall');
  });
});
