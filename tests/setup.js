// Jest test setup
global.console = {
  ...console,
  log: jest.fn(),
  error: jest.fn(),
  warn: jest.fn(),
  info: jest.fn(),
  debug: jest.fn()
};

// Mock WebSocket and Socket.IO for tests
global.WebSocket = jest.fn(() => ({
  on: jest.fn(),
  emit: jest.fn(),
  close: jest.fn()
}));

// Mock environment variables
process.env.NODE_ENV = 'test';
process.env.LOG_LEVEL = 'error';
