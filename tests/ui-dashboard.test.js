const fs = require('fs');
const path = require('path');

describe('UI Dashboard Quick Tests', () => {
  test('Enhanced index.html exists and merged correctly', () => {
    const indexPath = path.join(__dirname, '../web/public/index.html');
    expect(fs.existsSync(indexPath)).toBe(true);
    
    const htmlContent = fs.readFileSync(indexPath, 'utf8');
    
    // Check for enhanced features
    expect(htmlContent).toContain('Demo Trading Interface');
    expect(htmlContent).toContain('Advanced Trading Dashboard');
    expect(htmlContent).toContain('Demo Trading Chart');
    expect(htmlContent).toContain('System Console');
    expect(htmlContent).toContain('startDemo');
    expect(htmlContent).toContain('pauseDemo');
    expect(htmlContent).toContain('stopDemo');
    
    // Verify file size (enhanced version should be larger)
    expect(htmlContent.length).toBeGreaterThan(50000); // Should be much larger than basic version
  });

  test('Enhanced HTML file is no longer present', () => {
    const enhancedPath = path.join(__dirname, '../web/public/enhanced-index.html');
    expect(fs.existsSync(enhancedPath)).toBe(false);
  });

  test('Backup HTML file is no longer present', () => {
    const backupPath = path.join(__dirname, '../web/public/index-basic-backup.html');
    expect(fs.existsSync(backupPath)).toBe(false);
  });

  test('Only index.html remains in public folder', () => {
    const publicDir = path.join(__dirname, '../web/public');
    const files = fs.readdirSync(publicDir);
    expect(files).toEqual(['index.html']);
  });

  test('All interactive buttons are present', () => {
    const indexPath = path.join(__dirname, '../web/public/index.html');
    const htmlContent = fs.readFileSync(indexPath, 'utf8');
    
    // Check for all required buttons
    expect(htmlContent).toContain('onclick="toggleTrading()"');
    expect(htmlContent).toContain('onclick="emergencyStop()"');
    expect(htmlContent).toContain('onclick="refreshData()"');
    expect(htmlContent).toContain('onclick="exportLogs()"');
    expect(htmlContent).toContain('onclick="startDemo()"');
    expect(htmlContent).toContain('onclick="pauseDemo()"');
    expect(htmlContent).toContain('onclick="stopDemo()"');
    expect(htmlContent).toContain('onclick="clearLogs()"');
    expect(htmlContent).toContain('onclick="toggleLogsPause()"');
  });

  test('Demo trading interface is comprehensive', () => {
    const indexPath = path.join(__dirname, '../web/public/index.html');
    const htmlContent = fs.readFileSync(indexPath, 'utf8');
    
    // Check for demo controls
    expect(htmlContent).toContain('demoSymbol');
    expect(htmlContent).toContain('demoStrategy');
    expect(htmlContent).toContain('demoStartDate');
    expect(htmlContent).toContain('demoEndDate');
    expect(htmlContent).toContain('demoCapital');
    expect(htmlContent).toContain('demoSpeed');
    
    // Check for demo results
    expect(htmlContent).toContain('demoFinalValue');
    expect(htmlContent).toContain('demoTotalReturn');
    expect(htmlContent).toContain('demoTotalTrades');
    expect(htmlContent).toContain('demoWinRate');
  });

  test('System logs display is enhanced', () => {
    const indexPath = path.join(__dirname, '../web/public/index.html');
    const htmlContent = fs.readFileSync(indexPath, 'utf8');
    
    // Check for enhanced log features
    expect(htmlContent).toContain('logLevelFilter');
    expect(htmlContent).toContain('logSearch');
    expect(htmlContent).toContain('log-controls');
    expect(htmlContent).toContain('log-entry');
    expect(htmlContent).toContain('log-timestamp');
    expect(htmlContent).toContain('log-level');
    expect(htmlContent).toContain('log-module');
    expect(htmlContent).toContain('log-message');
    
    // Check for log styling
    expect(htmlContent).toContain('log-info');
    expect(htmlContent).toContain('log-warning');
    expect(htmlContent).toContain('log-error');
    expect(htmlContent).toContain('log-success');
  });

  test('Repository cleanup was successful', () => {
    // Check that unnecessary files/folders were removed
    expect(fs.existsSync(path.join(__dirname, '../logs'))).toBe(false);
    expect(fs.existsSync(path.join(__dirname, '../tmp'))).toBe(false);
    expect(fs.existsSync(path.join(__dirname, '../docs'))).toBe(false);
    expect(fs.existsSync(path.join(__dirname, '../DEPLOYMENT.md'))).toBe(false);
    expect(fs.existsSync(path.join(__dirname, '../ENHANCEMENT_SUMMARY.md'))).toBe(false);
    expect(fs.existsSync(path.join(__dirname, '../demo-dashboard.js'))).toBe(false);
    expect(fs.existsSync(path.join(__dirname, '../test-integration.js'))).toBe(false);
  });

  test('Essential files still exist', () => {
    // Check that essential files are still present
    expect(fs.existsSync(path.join(__dirname, '../package.json'))).toBe(true);
    expect(fs.existsSync(path.join(__dirname, '../README.md'))).toBe(true);
    expect(fs.existsSync(path.join(__dirname, '../src/main.js'))).toBe(true);
    expect(fs.existsSync(path.join(__dirname, '../web/web-interface.js'))).toBe(true);
    expect(fs.existsSync(path.join(__dirname, '../data/cache'))).toBe(true);
  });

  test('Charts and real-time features are configured', () => {
    const indexPath = path.join(__dirname, '../web/public/index.html');
    const htmlContent = fs.readFileSync(indexPath, 'utf8');
    
    // Check for Chart.js integration
    expect(htmlContent).toContain('chart.js');
    expect(htmlContent).toContain('new Chart');
    expect(htmlContent).toContain('initializeCharts');
    expect(htmlContent).toContain('updateMainChart');
    expect(htmlContent).toContain('demoChart');
    expect(htmlContent).toContain('mainChart');
    
    // Check for real-time updates
    expect(htmlContent).toContain('setInterval');
    expect(htmlContent).toContain('socket.io');
    expect(htmlContent).toContain('socket.on');
    expect(htmlContent).toContain('socket.emit');
  });

  test('Notification system is implemented', () => {
    const indexPath = path.join(__dirname, '../web/public/index.html');
    const htmlContent = fs.readFileSync(indexPath, 'utf8');
    
    expect(htmlContent).toContain('showNotification');
    expect(htmlContent).toContain('notification');
    expect(htmlContent).toContain('notificationContainer');
    expect(htmlContent).toContain('closeNotification');
  });
});
