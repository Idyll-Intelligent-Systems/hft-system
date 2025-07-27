export = WebInterface;
declare class WebInterface {
    constructor(config?: {});
    config: {
        port: any;
        realTimeUpdates: any;
        latencyMonitoring: any;
        tradingInterface: any;
    };
    app: import("express-serve-static-core").Express;
    server: http.Server<typeof http.IncomingMessage, typeof http.ServerResponse> | null;
    io: any;
    isInitialized: boolean;
    connectedClients: number;
    initialize(): Promise<void>;
    setupMiddleware(): void;
    setupRoutes(): void;
    setupSocketIO(): void;
    startServer(): Promise<any>;
    broadcastSystemStatus(status: any): void;
    broadcastMarketData(data: any): void;
    broadcastTradeExecution(trade: any): void;
    broadcastRiskAlert(alert: any): void;
    getStatus(): "INITIALIZING" | "RUNNING";
    shutdown(): Promise<void>;
}
import http = require("http");
//# sourceMappingURL=web-interface.d.ts.map