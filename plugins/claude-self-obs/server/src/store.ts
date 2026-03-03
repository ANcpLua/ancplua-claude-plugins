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

const DEFAULT_MAX_EVENTS = 10_000;

export class EventStore {
  private events: Map<string, HookEvent[]> = new Map();
  private readonly maxEvents: number;
  private totalCount = 0;
  private readonly startTime = Date.now();

  constructor(maxEvents: number = DEFAULT_MAX_EVENTS) {
    this.maxEvents = maxEvents;
  }

  add(event: HookEvent): void {
    event.timestamp = Date.now();
    const sessionId = event.session_id ?? "unknown";

    let sessionEvents = this.events.get(sessionId);
    if (!sessionEvents) {
      sessionEvents = [];
      this.events.set(sessionId, sessionEvents);
    }

    sessionEvents.push(event);
    this.totalCount++;

    if (sessionEvents.length > this.maxEvents) {
      sessionEvents.shift();
    }
  }

  getTimeline(sessionId?: string): HookEvent[] {
    if (sessionId) {
      return this.events.get(sessionId) ?? [];
    }
    const allEvents: HookEvent[] = [];
    for (const events of this.events.values()) {
      allEvents.push(...events);
    }
    return allEvents.sort((a, b) => a.timestamp - b.timestamp);
  }

  getToolStats(sessionId?: string): ToolStats[] {
    const events = sessionId
      ? (this.events.get(sessionId) ?? [])
      : this.getTimeline();

    const counts = new Map<string, number>();
    for (const event of events) {
      if (event.tool_name) {
        counts.set(event.tool_name, (counts.get(event.tool_name) ?? 0) + 1);
      }
    }

    return Array.from(counts.entries())
      .map(([tool_name, count]) => ({ tool_name, count }))
      .sort((a, b) => b.count - a.count);
  }

  search(query: string, sessionId?: string): HookEvent[] {
    const events = sessionId
      ? (this.events.get(sessionId) ?? [])
      : this.getTimeline();

    const lowerQuery = query.toLowerCase();
    return events.filter((event) => {
      if (event.tool_name?.toLowerCase().includes(lowerQuery)) return true;
      if (event.hook_event_name?.toLowerCase().includes(lowerQuery)) return true;
      if (event.agent_name?.toLowerCase().includes(lowerQuery)) return true;
      const inputStr = JSON.stringify(event.tool_input ?? {}).toLowerCase();
      return inputStr.includes(lowerQuery);
    });
  }

  getStatus(): {
    uptime_ms: number;
    total_events: number;
    session_count: number;
    buffer_max: number;
  } {
    return {
      uptime_ms: Date.now() - this.startTime,
      total_events: this.totalCount,
      session_count: this.events.size,
      buffer_max: this.maxEvents,
    };
  }
}
