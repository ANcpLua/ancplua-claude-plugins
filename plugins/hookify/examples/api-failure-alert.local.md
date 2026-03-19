---
name: api-failure-alert
enabled: true
event: stopfailure
action: warn
conditions:
  - field: error_type
    operator: regex_match
    pattern: rate_limit|auth|overloaded|timeout
---

**API failure detected.** The turn ended due to an API error.

Possible causes: rate limit hit, authentication expired, service overloaded, or network timeout.

If this keeps happening:

- Rate limit: wait a few minutes before retrying
- Auth failure: check `claude auth status`
- Overloaded: try again shortly, the API is under heavy load
