# Third-Party Notices

`dotnet-dnceng` is vendored, near-verbatim, from the **`dotnet-dnceng`** plugin in
the `dotnet/arcade-skills` repository (<https://github.com/dotnet/arcade-skills>,
path `plugins/dotnet-dnceng`). The original code is MIT-licensed.

Vendored at upstream commit
[`9a02ecae6a32aba36b99f9dc3947df93cbe9ee1d`](https://github.com/dotnet/arcade-skills/commit/9a02ecae6a32aba36b99f9dc3947df93cbe9ee1d)
(2026-06-10, "Drop binlog MCP version pin; always resolve latest preview").

The MIT License (<https://opensource.org/license/mit>) terms apply to the vendored
files in this directory tree:

> The MIT License (MIT)
>
> Copyright (c) .NET Foundation and Contributors
>
> All rights reserved.
>
> Permission is hereby granted, free of charge, to any person obtaining a copy
> of this software and associated documentation files (the "Software"), to deal
> in the Software without restriction, including without limitation the rights
> to use, copy, modify, merge, publish, distribute, sublicense, and/or sell
> copies of the Software, and to permit persons to whom the Software is
> furnished to do so, subject to the following conditions:
>
> The above copyright notice and this permission notice shall be included in all
> copies or substantial portions of the Software.
>
> THE SOFTWARE IS PROVIDED "AS IS", WITHOUT WARRANTY OF ANY KIND, EXPRESS OR
> IMPLIED, INCLUDING BUT NOT LIMITED TO THE WARRANTIES OF MERCHANTABILITY,
> FITNESS FOR A PARTICULAR PURPOSE AND NONINFRINGEMENT. IN NO EVENT SHALL THE
> AUTHORS OR COPYRIGHT HOLDERS BE LIABLE FOR ANY CLAIM, DAMAGES OR OTHER
> LIABILITY, WHETHER IN AN ACTION OF CONTRACT, TORT OR OTHERWISE, ARISING FROM,
> OUT OF OR IN CONNECTION WITH THE SOFTWARE OR THE USE OR OTHER DEALINGS IN THE
> SOFTWARE.

## Modifications

The only change from upstream is a manifest fix required by Claude Code's plugin
manifest schema (CLI ≥ 2.1.x), which now requires every component path to start
with `./`:

```diff
- "agents": ["agents/ci-investigator.agent.md"]
+ "agents": ["./agents/ci-investigator.agent.md"]
```

The manifest was additionally moved to `.claude-plugin/plugin.json` and given
`$schema` / `homepage` / `repository` metadata to match this marketplace's
conventions. All skills, the agent, the MCP server definitions, and their scripts
are unmodified from upstream.

Upstream's manifest is still un-prefixed on `main` as of this writing; their own
`pr-validation` workflow only checks plugin-name formatting, so their CI does not
surface the schema violation. The clean long-term fix is a one-line PR upstream.
