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
            const timestamp = new Date();
            const logEntry = {
                timestamp: timestamp.toISOString(),
                level: level.toUpperCase(),
                module: this.module,
                message,
                data,
            };

            // Enhanced console output with better formatting
            const coloredMessage = this.formatConsoleMessage(level, message, data, timestamp);
            console.log(coloredMessage);

            // File output (async to avoid blocking)
            setImmediate(() => {
                fs.appendFileSync(this.logFile, JSON.stringify(logEntry) + '\n');
            });

            // Broadcast to web interface if available
            this.broadcastToWebInterface(logEntry);
        }
    }

    formatConsoleMessage(level, message, data, timestamp) {
        const time = timestamp.toLocaleTimeString();
        const colors = {
            error: '\x1b[31m', // Red
            warn: '\x1b[33m', // Yellow
            info: '\x1b[36m', // Cyan
            debug: '\x1b[90m', // Gray
            reset: '\x1b[0m', // Reset
        };

        const levelColor = colors[level] || colors.info;
        const moduleColor = '\x1b[35m'; // Magenta
        const timeColor = '\x1b[90m'; // Gray

        let formattedMessage = `${timeColor}[${time}]${colors.reset} ${levelColor}${level.toUpperCase()}${colors.reset} ${moduleColor}[${this.module}]${colors.reset} ${message}`;

        if (data && typeof data === 'object') {
            formattedMessage += `\n  ${colors.reset}${JSON.stringify(data, null, 2)}`;
        } else if (data) {
            formattedMessage += ` ${colors.reset}${data}`;
        }

        return formattedMessage;
    }

    broadcastToWebInterface(logEntry) {
        // This will be used by the web interface to receive real-time logs
        if (global.webInterfaceIO) {
            global.webInterfaceIO.emit('systemLog', {
                timestamp: logEntry.timestamp,
                level: logEntry.level.toLowerCase(),
                module: logEntry.module,
                message: logEntry.message,
                data: logEntry.data,
            });
        }
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
