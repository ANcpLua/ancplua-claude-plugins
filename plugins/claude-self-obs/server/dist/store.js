const DEFAULT_MAX_EVENTS = 10_000;
export class EventStore {
    events = new Map();
    maxEvents;
    totalCount = 0;
    startTime = Date.now();
    constructor(maxEvents = DEFAULT_MAX_EVENTS) {
        this.maxEvents = maxEvents;
    }
    add(event) {
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
    getTimeline(sessionId) {
        if (sessionId) {
            return this.events.get(sessionId) ?? [];
        }
        const allEvents = [];
        for (const events of this.events.values()) {
            allEvents.push(...events);
        }
        return allEvents.sort((a, b) => a.timestamp - b.timestamp);
    }
    getToolStats(sessionId) {
        const events = sessionId
            ? (this.events.get(sessionId) ?? [])
            : this.getTimeline();
        const counts = new Map();
        for (const event of events) {
            if (event.tool_name) {
                counts.set(event.tool_name, (counts.get(event.tool_name) ?? 0) + 1);
            }
        }
        return Array.from(counts.entries())
            .map(([tool_name, count]) => ({ tool_name, count }))
            .sort((a, b) => b.count - a.count);
    }
    search(query, sessionId) {
        const events = sessionId
            ? (this.events.get(sessionId) ?? [])
            : this.getTimeline();
        const lowerQuery = query.toLowerCase();
        return events.filter((event) => {
            if (event.tool_name?.toLowerCase().includes(lowerQuery))
                return true;
            if (event.hook_event_name?.toLowerCase().includes(lowerQuery))
                return true;
            if (event.agent_name?.toLowerCase().includes(lowerQuery))
                return true;
            const inputStr = JSON.stringify(event.tool_input ?? {}).toLowerCase();
            return inputStr.includes(lowerQuery);
        });
    }
    getStatus() {
        return {
            uptime_ms: Date.now() - this.startTime,
            total_events: this.totalCount,
            session_count: this.events.size,
            buffer_max: this.maxEvents,
        };
    }
}
