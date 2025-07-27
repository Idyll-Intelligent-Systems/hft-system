/**
 * High-Performance Logger
 * Ultra-low latency logging system for HFT
 */

const fs = require('fs');
const path = require('path');

class Logger {
    constructor(module = 'SYSTEM') {
        this.module = module;
        this.logLevel = process.env.LOG_LEVEL || 'info';
        this.logFile = path.join(process.cwd(), 'logs', `${module.toLowerCase()}.log`);

        // Create logs directory if it doesn't exist
        const logDir = path.dirname(this.logFile);
        if (!fs.existsSync(logDir)) {
            fs.mkdirSync(logDir, { recursive: true });
        }

        this.levels = {
            error: 0,
            warn: 1,
            info: 2,
            debug: 3,
        };

        this.currentLevel = this.levels[this.logLevel] || 2;
    }

    log(level, message, data = null) {
        if (this.levels[level] <= this.currentLevel) {
            const timestamp = new Date().toISOString();
            const logEntry = {
                timestamp,
                level: level.toUpperCase(),
                module: this.module,
                message,
                data,
            };

            // Console output with colors
            const coloredMessage = this.colorMessage(level, logEntry);
            console.log(coloredMessage);

            // File output (async to avoid blocking)
            setImmediate(() => {
                fs.appendFileSync(this.logFile, JSON.stringify(logEntry) + '\n');
            });
        }
    }

    colorMessage(level, logEntry) {
        const colors = {
            error: '\x1b[31m', // Red
            warn: '\x1b[33m', // Yellow
            info: '\x1b[36m', // Cyan
            debug: '\x1b[90m', // Gray
        };

        const reset = '\x1b[0m';
        const color = colors[level] || '';

        return `${color}[${logEntry.timestamp}] [${logEntry.level}] [${logEntry.module}] ${logEntry.message}${reset}`;
    }

    error(message, data) {
        this.log('error', message, data);
    }

    warn(message, data) {
        this.log('warn', message, data);
    }

    info(message, data) {
        this.log('info', message, data);
    }

    debug(message, data) {
        this.log('debug', message, data);
    }
}

module.exports = Logger;
