// MongoDB initialization script for HFT System
// This script creates the necessary database and collections

// Switch to the HFT database
db = db.getSiblingDB('hft_trading_db');

// Create collections with appropriate indexes for trading data
db.createCollection('trades');
db.createCollection('market_data');
db.createCollection('orders');
db.createCollection('positions');
db.createCollection('risk_metrics');
db.createCollection('system_logs');
db.createCollection('strategies');
db.createCollection('backtest_results');

// Create indexes for optimal query performance
// Trades collection indexes
db.trades.createIndex({ "timestamp": 1 });
db.trades.createIndex({ "symbol": 1, "timestamp": 1 });
db.trades.createIndex({ "strategy_id": 1, "timestamp": 1 });
db.trades.createIndex({ "order_id": 1 });

// Market data indexes
db.market_data.createIndex({ "symbol": 1, "timestamp": 1 });
db.market_data.createIndex({ "timestamp": 1 });
db.market_data.createIndex({ "symbol": 1, "data_type": 1, "timestamp": 1 });

// Orders collection indexes
db.orders.createIndex({ "order_id": 1 }, { unique: true });
db.orders.createIndex({ "symbol": 1, "timestamp": 1 });
db.orders.createIndex({ "status": 1, "timestamp": 1 });
db.orders.createIndex({ "strategy_id": 1, "timestamp": 1 });

// Positions collection indexes
db.positions.createIndex({ "symbol": 1, "timestamp": 1 });
db.positions.createIndex({ "portfolio_id": 1, "timestamp": 1 });
db.positions.createIndex({ "timestamp": 1 });

// Risk metrics indexes
db.risk_metrics.createIndex({ "timestamp": 1 });
db.risk_metrics.createIndex({ "portfolio_id": 1, "timestamp": 1 });
db.risk_metrics.createIndex({ "metric_type": 1, "timestamp": 1 });

// System logs indexes
db.system_logs.createIndex({ "timestamp": 1 });
db.system_logs.createIndex({ "level": 1, "timestamp": 1 });
db.system_logs.createIndex({ "component": 1, "timestamp": 1 });

// Strategies collection indexes
db.strategies.createIndex({ "strategy_id": 1 }, { unique: true });
db.strategies.createIndex({ "status": 1 });
db.strategies.createIndex({ "created_at": 1 });

// Backtest results indexes
db.backtest_results.createIndex({ "strategy_id": 1, "timestamp": 1 });
db.backtest_results.createIndex({ "backtest_id": 1 }, { unique: true });

// Create TTL indexes for temporary data (expire after 30 days)
db.system_logs.createIndex({ "timestamp": 1 }, { expireAfterSeconds: 2592000 });
db.market_data.createIndex({ "timestamp": 1 }, { expireAfterSeconds: 7776000 }); // 90 days

print("HFT database and collections initialized successfully");
print("Created indexes for optimal trading performance");

// Create initial admin user for the application
db.createUser({
  user: "hft_app",
  pwd: "hft_app_password_change_me",
  roles: [
    { role: "readWrite", db: "hft_trading_db" },
    { role: "dbAdmin", db: "hft_trading_db" }
  ]
});

print("Application user created successfully");
