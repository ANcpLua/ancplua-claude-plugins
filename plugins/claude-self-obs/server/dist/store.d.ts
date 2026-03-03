export interface HookEvent {
    hook_event_name: string;
    session_id: string;
    timestamp: number;
    tool_name?: string;
    tool_input?: Record<string, unknown>;
    tool_use_id?: string;
    agent_name?: string;
    agent_type?: string;
    agent_id?: string;
    cwd?: string;
    permission_mode?: string;
    transcript_path?: string;
    [key: string]: unknown;
}
export interface ToolStats {
    tool_name: string;
    count: number;
}
export declare class EventStore {
    private events;
    private readonly maxEvents;
    private totalCount;
    private readonly startTime;
    constructor(maxEvents?: number);
    add(event: HookEvent): void;
    getTimeline(sessionId?: string): HookEvent[];
    getToolStats(sessionId?: string): ToolStats[];
    search(query: string, sessionId?: string): HookEvent[];
    getStatus(): {
        uptime_ms: number;
        total_events: number;
        session_count: number;
        buffer_max: number;
    };
}
