import { z } from "zod";
export function registerTools(server, store) {
    server.registerTool("get_status", {
        description: "Check if the self-obs server is alive, how many events are buffered, and uptime",
        annotations: { readOnlyHint: true },
    }, async () => {
        const status = store.getStatus();
        return {
            content: [
                {
                    type: "text",
                    text: JSON.stringify(status, null, 2),
                },
            ],
        };
    });
    server.registerTool("get_session_timeline", {
        description: "Get an ordered list of hook events for a session. Omit session_id for all sessions.",
        inputSchema: { session_id: z.string().optional().describe("Filter to a specific session") },
        annotations: { readOnlyHint: true },
    }, async ({ session_id }) => {
        const events = store.getTimeline(session_id);
        const summary = events.map((e) => ({
            time: new Date(e.timestamp).toISOString(),
            event: e.hook_event_name,
            tool: e.tool_name,
            agent: e.agent_name,
            file: e.tool_input?.file_path,
            command: e.tool_input?.command,
        }));
        return {
            content: [
                {
                    type: "text",
                    text: JSON.stringify(summary, null, 2),
                },
            ],
        };
    });
    server.registerTool("get_tool_stats", {
        description: "Get tool call counts grouped by tool name. Omit session_id for all sessions.",
        inputSchema: { session_id: z.string().optional().describe("Filter to a specific session") },
        annotations: { readOnlyHint: true },
    }, async ({ session_id }) => {
        const stats = store.getToolStats(session_id);
        return {
            content: [
                {
                    type: "text",
                    text: JSON.stringify(stats, null, 2),
                },
            ],
        };
    });
    server.registerTool("search_events", {
        description: "Search events by tool name, agent name, or content in tool_input",
        inputSchema: {
            query: z.string().describe("Search term to match against tool names, agent names, or tool input"),
            session_id: z.string().optional().describe("Filter to a specific session"),
        },
        annotations: { readOnlyHint: true },
    }, async ({ query, session_id }) => {
        const results = store.search(query, session_id);
        const summary = results.map((e) => ({
            time: new Date(e.timestamp).toISOString(),
            event: e.hook_event_name,
            tool: e.tool_name,
            agent: e.agent_name,
            input: e.tool_input,
        }));
        return {
            content: [
                {
                    type: "text",
                    text: JSON.stringify(summary, null, 2),
                },
            ],
        };
    });
}
