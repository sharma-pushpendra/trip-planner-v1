# TripPilot AI

A responsive travel research workspace with a midnight-blue liquid-glass interface, real-web TinyFish integration, and a strictly separated Jaipur demo.

## Run

Requires Node.js 20.9+.

```bash
npm install
cp .env.example .env.local
# Optional: set TINYFISH_API_KEY in .env.local to enable live research.
npm run dev
```

Open port 3000. The server binds to `0.0.0.0`; `*.e2b.app` is allowed for development previews.

Production: `npm run build && npm start`.

### Environment

```dotenv
TINYFISH_API_KEY=
```

Keep the key server-side. Do not prefix it with `NEXT_PUBLIC_`. Never commit `.env.local`. Restart the server after changing environment variables. No separate LLM key is required.

## What works

- Responsive photo-led landing page, destination inspiration, mode switch, and mobile navigation.
- All trip inputs, travel style toggles, preferences, and server/client Zod validation. Trips are limited to 30 days and 12 travelers.
- Jaipur demo with editable dates and budget. Sample allowances are explicitly illustrative and based on two travelers. Non-INR demo prices remain unknown rather than converting without an FX source.
- Four parallel, independently retryable live research categories: attractions, accommodation, transportation, and food.
- Honest request-level queued/running/completed/failed states and a timestamped activity feed. No artificial timers or fake browser progress.
- Source evidence separated from recommendations. Expand original text, hours, restrictions, retrieval timestamps, and external source links. Missing values remain explicit.
- Discover category filters and alphabetical sorting.
- Deterministic day planning: limited to actual dates, location-text grouping, preference-informed upstream research, food prioritized for evenings, straightforward explicit weekday closure exclusions, and a cap on known activity costs. Uncertain prices are not counted. This is not route optimization or a booking guarantee.
- Edit activity notes, reorder within a day, mark done, remove, and add personal activities with optional group-total cost. Budget changes immediately.
- Save/reopen/delete up to 20 trips in this browser's localStorage. Saving is explicit, not automatic. Local data may include personal preferences; clear saved trips on shared devices.
- Print-friendly itinerary with budget. The Print / PDF control opens the browser print dialog; select **Save as PDF**. It does not pretend to provide a server-generated PDF.

## TinyFish documentation and actual contract

Official docs inspected before implementation (2026-10-16):

- https://docs.tinyfish.ai/agent-api/reference
- https://docs.tinyfish.ai/agent-api
- https://docs.tinyfish.ai/key-concepts/endpoints

Documented API alternatives:

| Endpoint | Behavior |
| --- | --- |
| `POST https://agent.tinyfish.ai/v1/automation/run` | Blocking response with `run_id`, `status`, `result`, `error` |
| `POST /v1/automation/run-async` | Returns `run_id`; poll `GET /v1/runs/{id}` |
| `POST /v1/automation/run-sse` | Events: STARTED, STREAMING_URL, PROGRESS, HEARTBEAT, COMPLETE |
| `POST /v1/runs/{id}/cancel` | Cancellation for async and SSE runs, not synchronous runs |

All use `X-API-Key`. Required request fields are `url` and `goal`. This project uses the synchronous `/run` endpoint independently per category, with `agent_config.max_duration_seconds: 240` and a 255-second fetch timeout. It intentionally does not claim streaming agent actions. The official `result` field is goal-shaped JSON; the goal specifies our extraction schema and Zod validates it before normalization. Unsupported beta-only fields are not sent.

The server constructs a Google public-search entry URL from encoded destination/category terms. The agent is instructed to navigate to original public tourism/provider sources, not use snippets as booking evidence, and never log in, purchase, bypass restrictions, or access internal services. There is no user-supplied URL fetch endpoint. Provider-side browsing policy enforcement still belongs to TinyFish; natural-language rules are not a substitute for a browser sandbox.

### Live research prerequisites and limitations

**No TinyFish key was supplied in this environment.** Actual paid/live TinyFish runs have therefore not been verified. The real endpoint, authentication, request construction, result normalization, cache, safe errors, and missing-key UI are implemented and tested; successful upstream responses were tested with a clearly test-only mock.

To verify with a key: choose Live research, complete the form, and submit. Confirm source pages, retrieved fields, and provider billing in your TinyFish account. Source availability, upstream API access, and agent success are outside this app's control. Failed categories never silently become demo data.

For “Help me choose”, research compares candidate locations. Review them in Discover, then edit requirements to select a single destination and run destination-specific research. The app intentionally does not fabricate a multi-destination itinerary from incomplete research.

## Reliability and security

- Server-side secrets; sanitized client errors; logs contain only category and error class, not key or raw upstream content.
- 16 KB request check; bounded strings, dates, budget, categories and traveler counts.
- HTTPS source URL validation rejects credentials, ports, IP literals, local/internal hostnames and unsafe protocols. Source links use `noopener noreferrer`; source content renders as text, never HTML.
- In-process rate limiting (12 category requests/minute/client IP), ten-minute bounded response caching, and in-flight deduplication.
- One short backoff retry for upstream HTTP 429; manual retries for other failures avoid duplicating potentially billable runs after ambiguous network failures.
- A category failure does not erase other category results.
- No third-party account scraping, credential use, payments or reservations.
- Rate limits, cache and in-flight requests are process-local. For public multi-instance deployment, add trusted-proxy IP handling, Redis-backed quota controls, user authentication, and durable async jobs. A reverse proxy should also enforce a request body limit.
- Use a long-lived Node host or a deployment platform with at least a 300-second request timeout. Short-lived serverless environments should migrate to TinyFish async + durable polling.
- Browser-local persistence is not authenticated cloud storage. No public share button is exposed because secure cloud sharing is not implemented.

## Architecture

- `app/page.tsx`: interactive landing, form and workspace state/view orchestration.
- `app/globals.css`: responsive visual system, glass fallback, focus styles, reduced motion and print rules.
- `components/SourceEvidenceCard.tsx`: reusable evidence expander.
- `lib/models.ts`: schemas, domain types, URL policy, default request.
- `lib/planner.ts`: deterministic planner and explicitly labeled demo data.
- `app/api/research/route.ts`: server-only TinyFish adapter, normalization and reliability controls.
- `public/images/`: locally stored Unsplash destination photography. UI fonts are Google Fonts with system fallbacks.
- `tests/`: unit/API tests and browser flows.

## Tests

```bash
npm test
npm run build
npx playwright install --with-deps chromium
# With npm run dev running in another terminal:
npx playwright test tests/flows.spec.ts --workers=1 --reporter=list
```

Verified: production build/typecheck; five unit/API tests; desktop demo generation, adding/removing/reordering/completing activities, note editing, immediate budget recalculation, save/reopen, accommodation filtering, demo source honesty, all four missing-key errors and retry; mobile navigation, date validation and no horizontal overflow at 390px. Two browser flow tests pass with no page exceptions. Screenshots are written under `tests/`.

## Deliberately incomplete

- No live upstream success claim until a real TinyFish API key is configured and tested.
- No account system, cross-device persistence, secure share links, bookings, checkout, or direct PDF-generation service.
- No geocoded route optimization, universal opening-hours parser, real-time exchange-rate conversion, or complete trip-total guarantee. Exact simple price units can be multiplied by traveler count; unclear units remain unknown. Staying within the known-activity budget does not prove that lodging, transport, tax or all unknown costs fit.
- Research retries may rebuild the suggested itinerary; finish research before editing and save your finished version.
- Long research jobs do not survive server restarts or page reloads. Use the documented async workflow plus persistent job storage for production durability.
