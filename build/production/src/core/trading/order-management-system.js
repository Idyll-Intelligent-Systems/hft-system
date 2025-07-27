/**
 * Order Management System (OMS)
 * Ultra-low latency order management and tracking
 */

const EventEmitter = require('events');
const { performance } = require('perf_hooks');

class OrderManagementSystem extends EventEmitter {
    constructor(config = {}) {
        super();
        this.config = {
            maxActiveOrders: config.maxActiveOrders || 100000,
            latencyTarget: config.latencyTarget || 1000, // nanoseconds
            venues: config.venues || [],
            ...config,
        };

        this.orders = new Map();
        this.orderHistory = [];
        this.isInitialized = false;

        this.metrics = {
            totalOrders: 0,
            activeOrders: 0,
            completedOrders: 0,
            averageLatency: 0,
            totalTrades: 0,
        };
    }

    async initialize() {
        console.log('📋 Initializing Order Management System...');
        this.isInitialized = true;
        console.log('✅ Order Management System initialized');
    }

    async createOrder(orderRequest) {
        const createStart = performance.now();

        const order = {
            id: this.generateOrderId(),
            symbol: orderRequest.symbol,
            side: orderRequest.side,
            quantity: orderRequest.quantity,
            price: orderRequest.price,
            type: orderRequest.type || 'LIMIT',
            status: 'PENDING',
            createdAt: Date.now(),
            updatedAt: Date.now(),
            venue: orderRequest.venue,
            strategy: orderRequest.strategy,
        };

        this.orders.set(order.id, order);
        this.metrics.totalOrders++;
        this.metrics.activeOrders++;

        const createTime = performance.now() - createStart;
        this.updateLatencyMetrics(createTime);

        this.emit('orderCreated', order);
        return order;
    }

    generateOrderId() {
        return `ORD_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
    }

    updateLatencyMetrics(latency) {
        this.metrics.averageLatency = (this.metrics.averageLatency + latency) / 2;
    }

    getTotalTrades() {
        return this.metrics.totalTrades;
    }

    getAverageLatency() {
        return this.metrics.averageLatency;
    }

    getStatus() {
        return this.isInitialized ? 'RUNNING' : 'INITIALIZING';
    }

    async emergencyStop() {
        console.log('🚨 OMS - Emergency stop activated');
        // Cancel all active orders
        for (const order of this.orders.values()) {
            if (order.status === 'PENDING') {
                order.status = 'CANCELLED';
                order.updatedAt = Date.now();
            }
        }
    }

    async shutdown() {
        console.log('🛑 Shutting down Order Management System...');
        this.isInitialized = false;
        console.log('✅ OMS shutdown complete');
    }
}

module.exports = OrderManagementSystem;
