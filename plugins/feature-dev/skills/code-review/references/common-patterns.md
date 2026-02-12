# Common Vulnerability Patterns

## SQL Injection

Bad: String concatenation in queries (template literals with user input).
Good: Parameterized queries with `db.query('SELECT * FROM users WHERE id = ?', [userId])`.

## XSS

Bad: `element.innerHTML = userInput;`
Good: `element.textContent = userInput;`

## N+1 Query

Bad: Fetch users, then loop to fetch posts per user.
Good: Single query with JOIN or eager loading.

## Missing Error Handling

Bad: `const data = JSON.parse(input);` (no try/catch)
Good: Wrap in try/catch, log error, throw typed exception.

## Integration

1. Make changes
2. Run `code-review` to check
3. Fix issues found
4. Run verification (verify-local.sh + wait-for-ci.sh)
