# qyl MCP Server

The qyl MCP server belongs to the **serving plane** — it exposes stable platform state to MCP clients.

## Connection

```json
{
  "mcpServers": {
    "qyl": {
      "type": "http",
      "url": "https://mcp.qyl.info/mcp"
    }
  }
}
```

Local: `http://localhost:5100/mcp`

## Result Size Override (Claude Code v2.1.91+)

Heavy-payload tools emit `_meta["anthropic/maxResultSizeChars"]` to request up to 500K chars without truncation. Critical for:

- `qyl_get_trace` / `qyl_get_trace_details` — full span trees
- `qyl_list_errors` / `qyl_list_error_issues` — error stacks
- `qyl_search_spans` / `qyl_search_logs` — bulk search
- `qyl_get_session_transcript` — full transcripts
- `qyl_get_code_review` — full review output

Server-side: include `_meta: { "anthropic/maxResultSizeChars": 500000 }` in responses.

## Tool Categories

### Traces & Spans

search_traces, get_trace_details, analyze_trace, annotate_trace, mark_trace_reviewed, summarize_trace, search_spans, get_span

### Errors & Issues

list_errors, list_error_issues, get_error_issue, get_error_timeline, find_similar_errors, summarize_error, root_cause_analysis

### Sessions & Conversations

list_sessions, search_sessions, get_session, get_session_transcript, summarize_session, analyze_session_errors, update_session_status

### Logs

search_logs, list_structured_logs, list_trace_logs, get_log_details

### Metrics & Analytics

list_metrics, query_metrics, get_latency_stats, get_token_usage, get_token_timeseries, get_genai_stats, get_satisfaction, get_source_analytics, get_top_questions

### GenAI Agents

list_genai_spans, list_models, search_agent_runs, get_agent_run, list_conversations, get_conversation, list_users, get_user_journey

### Diagnostics & Triage

suggest_investigation, execute_investigation_step, explain_causal_chain, detect_anomalies, compare_periods, check_regressions, evaluate_patterns, list_diagnostic_patterns, trigger_triage, list_triage, get_triage

### Fixes & Reviews

suggest_fix, generate_fix, get_fix_run, list_fix_runs, get_fix_run_steps, approve_fix_run, reject_fix_run, trigger_code_review, get_code_review, generate_test_from_error

### System

health_check, get_storage_stats, configure_retention, get_system_context, get_service_map, list_services, create_project, list_projects, update_project, create_api_key

### Query Studio

qyl_app_query_studio, qyl_app_execute_query, qyl_app_query_schema, qyl_assisted_query, qyl_app_trace_search, qyl_app_trace_viewer, qyl_app_error_explorer, qyl_use_qyl, qyl_export_for_agent

## Plane Boundary

MCP tools are the serving plane's read/write surface. They expose platform state via explicit contracts. They do NOT own domain reasoning — that belongs to the intelligence and agent/control planes.
