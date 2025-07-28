#!/usr/bin/env node

/**
 * Simple System Starter
 * Minimal version to test what's working
 */

console.log('🚀 Starting Simple HFT System Test...');

// Test basic Express server first
const express = require('express');
const path = require('path');
const http = require('http');

const app = express();
const server = http.createServer(app);
const PORT = process.env.PORT || 3000;

console.log('PORT:', PORT);

// Basic middleware
app.use(express.json());
app.use(express.static(path.join(__dirname, 'web', 'public')));

// Basic routes
app.get('/', (req, res) => {
    const htmlPath = path.join(__dirname, 'web', 'public', 'index.html');
    console.log('Serving index.html from:', htmlPath);
    res.sendFile(htmlPath);
});

app.get('/api/health', (req, res) => {
    res.json({
        status: 'healthy',
        timestamp: new Date().toISOString(),
        uptime: process.uptime(),
        message: 'Simple HFT System is running'
    });
});

app.get('/api/test', (req, res) => {
    res.json({
        message: 'API is working!',
        nodeVersion: process.version,
        platform: process.platform
    });
});

// Start server
server.listen(PORT, () => {
    console.log(`✅ Simple server started successfully on port ${PORT}!`);
    console.log(`🌐 Access the dashboard at: http://localhost:${PORT}`);
    console.log(`📊 Health check: http://localhost:${PORT}/api/health`);
    console.log(`🔧 Test API: http://localhost:${PORT}/api/test`);
    console.log('');
    console.log('Press Ctrl+C to stop the server');
});

server.on('error', (error) => {
    console.error('❌ Server error:', error.message);
    if (error.code === 'EADDRINUSE') {
        console.error(`Port ${PORT} is already in use. Please stop other services or use a different port.`);
    }
    process.exit(1);
});

// Graceful shutdown
process.on('SIGINT', () => {
    console.log('\n🛑 Shutting down server...');
    server.close(() => {
        console.log('✅ Server stopped gracefully');
        process.exit(0);
    });
});

process.on('SIGTERM', () => {
    console.log('\n🛑 Received SIGTERM, shutting down...');
    server.close(() => {
        console.log('✅ Server stopped gracefully');
        process.exit(0);
    });
});
