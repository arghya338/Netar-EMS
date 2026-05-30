# Netar EMS Server

The server owns the live upstream API configuration and proxies client requests through a same-origin `/api` boundary.

## Configuration

Live API settings are environment based. Copy `server/.env.example` to `server/.env` for local development and update the values for your environment.

Environment overrides:

- `NETAR_SERVER_PORT` or `PORT`, default `33031`
- `NETAR_UPSTREAM_BASE_URL`, required upstream EMS base URL
- `NETAR_REQUEST_TIMEOUT_MS`
- `NETAR_SESSION_COOKIE`

## Routes

- `POST /api/login` logs in to the upstream EMS and creates an HTTP-only local session cookie.
- `GET /api/session` restores the current local session after browser refresh.
- `POST /api/logout` logs out upstream and clears the local session.
- `/api/live/*` proxies authenticated EMS requests to the configured upstream.
- `GET /api/health` returns server/proxy health.

Run with:

```bash
npm --prefix server run dev
```
