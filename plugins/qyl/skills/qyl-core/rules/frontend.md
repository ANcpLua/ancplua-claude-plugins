# Frontend Constraints

qyl.dashboard is a React 19 SPA under `src/qyl.dashboard/`. It belongs to the UI/protocol plane.

## Stack

| Technology | Version | Purpose |
|-----------|---------|---------|
| React | 19 | UI framework (use new features: `use`, Actions) |
| Vite | 7 | Build tool |
| Tailwind CSS | 4 | Styling (CSS variables, no arbitrary values) |
| Base UI | 1.3.0 | Primitives -- NEVER Radix UI, NEVER shadcn/ui |
| TanStack Table | latest | Data tables (traces, logs) |
| TanStack Query | latest | Server state management |
| ECharts | 6 | Dense observability charts (not Recharts) |
| lucide-react | latest | Icons -- NEVER Phosphor |
| TypeScript | strict | No `any`, no `as` casts (use type guards) |

## Data Flow

Dashboard talks to collector REST API only (no .NET ProjectReference).
SSE streaming via EventSource for live telemetry.
Types generated from openapi.yaml via openapi-typescript.

## Banned

- Radix UI, shadcn/ui, asChild/Slot -> use Base UI 1.3.0
- Phosphor icons -> use lucide-react
- Inline styles -> use Tailwind classes
- `any` type -> proper types
- `as` casts -> type guards

## Success Condition

Operators can inspect, approve, reject, and diff system behavior without needing chat transcripts as the UI model.
