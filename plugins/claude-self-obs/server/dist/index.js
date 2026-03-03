import { createServer } from "node:http";
import { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";
import { StdioServerTransport } from "@modelcontextprotocol/sdk/server/stdio.js";
import { EventStore } from "./store.js";
import { registerTools } from "./tools.js";
const PORT = parseInt(process.env.SELF_OBS_PORT ?? "5101", 10);
const MAX_EVENTS = parseInt(process.env.SELF_OBS_MAX_EVENTS ?? "10000", 10);
const store = new EventStore(MAX_EVENTS);
// --- HTTP server: receives hook event POSTs ---
const httpServer = createServer((req, res) => {
    if (req.method === "POST" && req.url === "/v1/events") {
        let body = "";
        req.on("data", (chunk) => {
            body += chunk.toString();
        });
        req.on("end", () => {
            try {
                const event = JSON.parse(body);
                store.add(event);
                res.writeHead(200, { "Content-Type": "application/json" });
                res.end("{}");
            }
            catch {
                res.writeHead(400, { "Content-Type": "application/json" });
                res.end(JSON.stringify({ error: "Invalid JSON" }));
            }
        });
        return;
    }
    if (req.method === "GET" && req.url === "/health") {
        const status = store.getStatus();
        res.writeHead(200, { "Content-Type": "application/json" });
        res.end(JSON.stringify(status));
        return;
    }
    res.writeHead(404);
    res.end();
});
httpServer.listen(PORT, "127.0.0.1", () => {
    process.stderr.write(`[claude-self-obs] HTTP listening on 127.0.0.1:${PORT}\n`);
});
// --- MCP server: exposes tools to Claude via stdio ---
const mcpServer = new McpServer({
    name: "claude-self-obs",
    version: "2.0.0",
});
registerTools(mcpServer, store);
const transport = new StdioServerTransport();
mcpServer.connect(transport).then(() => {
    process.stderr.write("[claude-self-obs] MCP stdio connected\n");
});
