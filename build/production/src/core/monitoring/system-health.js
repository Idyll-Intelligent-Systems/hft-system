/**
 * System Health Monitor
 * Real-time system health and performance monitoring
 */

const os = require('os');
const { performance } = require('perf_hooks');
const EventEmitter = require('events');

class SystemHealthMonitor extends EventEmitter {
    constructor(config = {}) {
        super();
        this.config = {
            cpuThreshold: config.cpuThreshold || 80,
            memoryThreshold: config.memoryThreshold || 85,
            latencyThreshold: config.latencyThreshold || 1000,
            checkInterval: config.checkInterval || 1000,
            ...config,
        };

        this.metrics = {
            cpu: 0,
            memory: 0,
            uptime: 0,
            latency: 0,
            timestamp: Date.now(),
        };

        this.isMonitoring = false;
        this.monitorInterval = null;
    }

    async initialize() {
        console.log('📊 Initializing System Health Monitor...');
        this.startMonitoring();
        console.log('✅ System Health Monitor initialized');
    }

    startMonitoring() {
        if (this.isMonitoring) return;

        this.isMonitoring = true;
        this.monitorInterval = setInterval(() => {
            this.updateMetrics();
        }, this.config.checkInterval);
    }

    updateMetrics() {
        const now = Date.now();

        // CPU Usage
        this.metrics.cpu = this.getCPUUsage();

        // Memory Usage
        this.metrics.memory = this.getMemoryUsage();

        // System Uptime
        this.metrics.uptime = os.uptime();

        // Latency (simple ping)
        this.metrics.latency = this.measureLatency();

        this.metrics.timestamp = now;

        // Check thresholds
        this.checkThresholds();

        this.emit('metricsUpdate', this.metrics);
    }

    getCPUUsage() {
        const cpus = os.cpus();
        let totalIdle = 0;
        let totalTick = 0;

        for (const cpu of cpus) {
            for (const type in cpu.times) {
                totalTick += cpu.times[type];
            }
            totalIdle += cpu.times.idle;
        }

        const idle = totalIdle / cpus.length;
        const total = totalTick / cpus.length;

        return 100 - ~~((100 * idle) / total);
    }

    getMemoryUsage() {
        const totalMem = os.totalmem();
        const freeMem = os.freemem();
        const usedMem = totalMem - freeMem;

        return (usedMem / totalMem) * 100;
    }

    measureLatency() {
        const start = performance.now();
        // Simple synchronous operation to measure latency
        for (let i = 0; i < 1000; i++) {
            Math.random();
        }
        const end = performance.now();

        return (end - start) * 1000; // Convert to microseconds
    }

    checkThresholds() {
        const alerts = [];

        if (this.metrics.cpu > this.config.cpuThreshold) {
            alerts.push({
                type: 'CPU',
                level: 'WARNING',
                value: this.metrics.cpu,
                threshold: this.config.cpuThreshold,
                message: `CPU usage ${this.metrics.cpu.toFixed(1)}% exceeds threshold ${this.config.cpuThreshold}%`,
            });
        }

        if (this.metrics.memory > this.config.memoryThreshold) {
            alerts.push({
                type: 'MEMORY',
                level: 'WARNING',
                value: this.metrics.memory,
                threshold: this.config.memoryThreshold,
                message: `Memory usage ${this.metrics.memory.toFixed(1)}% exceeds threshold ${this.config.memoryThreshold}%`,
            });
        }

        if (this.metrics.latency > this.config.latencyThreshold) {
            alerts.push({
                type: 'LATENCY',
                level: 'WARNING',
                value: this.metrics.latency,
                threshold: this.config.latencyThreshold,
                message: `System latency ${this.metrics.latency.toFixed(1)}μs exceeds threshold ${this.config.latencyThreshold}μs`,
            });
        }

        for (const alert of alerts) {
            this.emit('healthAlert', alert);
        }
    }

    getHealthStatus() {
        const cpuStatus = this.metrics.cpu > this.config.cpuThreshold ? 'WARNING' : 'OK';
        const memoryStatus = this.metrics.memory > this.config.memoryThreshold ? 'WARNING' : 'OK';
        const latencyStatus =
            this.metrics.latency > this.config.latencyThreshold ? 'WARNING' : 'OK';

        let overallStatus = 'OK';
        if (cpuStatus === 'WARNING' || memoryStatus === 'WARNING' || latencyStatus === 'WARNING') {
            overallStatus = 'WARNING';
        }

        // Critical thresholds
        if (this.metrics.cpu > 95 || this.metrics.memory > 95) {
            overallStatus = 'CRITICAL';
        }

        return {
            status: overallStatus,
            cpu: { value: this.metrics.cpu, status: cpuStatus },
            memory: { value: this.metrics.memory, status: memoryStatus },
            latency: { value: this.metrics.latency, status: latencyStatus },
            uptime: this.metrics.uptime,
            timestamp: this.metrics.timestamp,
        };
    }

    getMetrics() {
        return { ...this.metrics };
    }

    // Method expected by tests
    async checkNetworkConnectivity() {
        try {
            const dns = require('dns');
            const util = require('util');
            const lookup = util.promisify(dns.lookup);

            // Test connectivity to multiple hosts
            const hosts = ['google.com', '8.8.8.8', 'cloudflare.com'];
            const results = [];

            for (const host of hosts) {
                try {
                    const start = Date.now();
                    await lookup(host);
                    const latency = Date.now() - start;
                    results.push({ host, status: 'connected', latency });
                } catch (error) {
                    results.push({ host, status: 'failed', error: error.message });
                }
            }

            const connectedCount = results.filter(r => r.status === 'connected').length;
            const isConnected = connectedCount > 0;

            return {
                connected: isConnected,
                results,
                timestamp: new Date().toISOString(),
            };
        } catch (error) {
            return {
                connected: false,
                error: error.message,
                timestamp: new Date().toISOString(),
            };
        }
    }

    stopMonitoring() {
        if (this.monitorInterval) {
            clearInterval(this.monitorInterval);
            this.monitorInterval = null;
        }
        this.isMonitoring = false;
    }

    async shutdown() {
        console.log('🛑 Shutting down System Health Monitor...');
        this.stopMonitoring();
        console.log('✅ System Health Monitor shutdown complete');
    }
}

module.exports = SystemHealthMonitor;
