#!/usr/bin/env node

/**
 * System Test Script
 * Tests core components before starting the full system
 */

const path = require('path');
const fs = require('fs');

console.log('🔍 Testing HFT System Components...\n');

// Test 1: Check Node.js version
console.log('1. Checking Node.js version...');
const nodeVersion = process.version;
const majorVersion = parseInt(nodeVersion.split('.')[0].substring(1));
if (majorVersion >= 18) {
    console.log(`   ✅ Node.js ${nodeVersion} is compatible`);
} else {
    console.log(`   ❌ Node.js ${nodeVersion} is too old. Need 18+`);
    process.exit(1);
}

// Test 2: Check required directories
console.log('\n2. Checking directory structure...');
const requiredDirs = ['src', 'web', 'logs', 'data'];
for (const dir of requiredDirs) {
    if (fs.existsSync(dir)) {
        console.log(`   ✅ ${dir}/ exists`);
    } else {
        console.log(`   ⚠️  ${dir}/ missing, creating...`);
        fs.mkdirSync(dir, { recursive: true });
    }
}

// Test 3: Check core files
console.log('\n3. Checking core files...');
const requiredFiles = [
    'src/main.js',
    'web/web-interface.js',
    'web/public/index.html',
    'package.json'
];

for (const file of requiredFiles) {
    if (fs.existsSync(file)) {
        console.log(`   ✅ ${file} exists`);
    } else {
        console.log(`   ❌ ${file} missing`);
    }
}

// Test 4: Test basic requires
console.log('\n4. Testing core module loading...');
try {
    // Test loading main system config
    const SystemConfig = require('./src/core/config/system-config');
    console.log('   ✅ SystemConfig module loads');
} catch (error) {
    console.log('   ⚠️  SystemConfig module error:', error.message);
}

try {
    // Test loading logger
    const Logger = require('./src/core/logging/logger');
    console.log('   ✅ Logger module loads');
} catch (error) {
    console.log('   ⚠️  Logger module error:', error.message);
}

try {
    // Test loading web interface
    const WebInterface = require('./web/web-interface');
    console.log('   ✅ WebInterface module loads');
} catch (error) {
    console.log('   ⚠️  WebInterface module error:', error.message);
}

// Test 5: Check dependencies
console.log('\n5. Checking key dependencies...');
const requiredDeps = ['express', 'socket.io', 'cors'];
for (const dep of requiredDeps) {
    try {
        require(dep);
        console.log(`   ✅ ${dep} is available`);
    } catch (error) {
        console.log(`   ❌ ${dep} is missing`);
    }
}

// Test 6: Check if ports are available
console.log('\n6. Checking port availability...');
const net = require('net');

function checkPort(port) {
    return new Promise((resolve) => {
        const server = net.createServer();
        
        server.listen(port, () => {
            server.once('close', () => {
                resolve(true);
            });
            server.close();
        });
        
        server.on('error', () => {
            resolve(false);
        });
    });
}

async function testPorts() {
    const port3000Available = await checkPort(3000);
    if (port3000Available) {
        console.log('   ✅ Port 3000 is available');
    } else {
        console.log('   ⚠️  Port 3000 is in use');
    }
}

testPorts().then(() => {
    console.log('\n✅ Component test completed!');
    console.log('\nRecommendations:');
    console.log('   - If any modules show errors, run: npm install');
    console.log('   - If port 3000 is in use, stop other services first');
    console.log('   - Start the system with: ./start.sh');
});
