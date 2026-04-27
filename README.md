# AstroUI

> Web interface for the [AstroStack](https://github.com/x42en/AstroStack)
> astrophotography processing pipeline.

AstroUI is a React single-page application that connects to the AstroStack
backend API. It lets visitors discover and browse a public gallery of community
results, and lets signed-in astronomers create processing sessions, upload
calibration frames, monitor pipeline progress in real time over WebSocket,
inspect EXIF and pipeline metadata of every result, and share their profiles
with the community.

---

## Overview

| Component | Stack |
|---|---|
| Framework | React 18 + TypeScript (strict mode) |
| Build tool | Vite 5 |
| Routing | React Router v7 |
| State | Zustand (with `localStorage` persistence) |
| Data fetching | TanStack Query v5 + Axios |
| UI primitives | Radix UI (dialog, dropdown, progress, select, switch, tooltip) |
| Styling | Tailwind CSS v3 |
| Icons | Lucide React |
| Container | Nginx 1.27 Alpine |

---

## Features

- **Public landing page** with a hero, capability cards, community teaser, a
  live gallery carousel, and an honest roadmap.
- **Public gallery** — anonymous browsing of published sessions with a
  full-screen lightbox; signed-in users can publish their own.
- **Mock authentication** for the preview build — any non-empty credentials
  succeed; the username `admin` unlocks the Settings area. Real authentication
  is on the roadmap.
- **Sessions dashboard** — create sessions, drag-and-drop calibration frames,
  pick a preset, launch the pipeline.
- **Real-time progress** — WebSocket-powered step-by-step view with logs,
  percentages, and per-step status.
- **Profile editor** with object presets (Orion, M31, Galactic Center, …) and
  granular control over every pipeline parameter.
- **Profile import / export / sharing** — JSON round-trip, one-click import,
  one-toggle publication.
- **Metadata cartouche** — discreet, collapsible overlay showing EXIF
  (camera, ISO, exposure, focal length, integration) and the pipeline used to
  produce each result.
- **Branded identity** — bespoke telescope logo (favicon, header, login
  screen, empty states, gallery cartouche).
- **Runtime configuration** — change API/WebSocket URLs, retry budgets, and
  defaults from the Settings page; values persist in `localStorage`.

---

## Architecture

```
Browser
  │
  ├─► Nginx (port 80) ──► serves dist/index.html + static assets
  │
  ├─► AstroStack API  ──► REST calls (axios)
  └─► AstroStack WS   ──► real-time job events (WebSocket)
```

### Routes

| Path | Access | Description |
|---|---|---|
| `/` | Public / Authed | Smart redirect: anonymous → Landing; authed → Dashboard. |
| `/welcome` | Public | Landing page, always reachable. |
| `/login` | Public | Mock sign-in form (preview only). |
| `/gallery` | Public | Community gallery + lightbox. |
| `/history` | Authed | Personal sessions dashboard. |
| `/sessions/:id` | Authed | Session detail, processing, output. |
| `/profiles` | Authed | Profile editor + import/export. |
| `/settings` | Admin | Runtime configuration (admin-only). |

### Source layout

| Layer | Directory | Responsibility |
|---|---|---|
| Types | `src/types/` | Shared interfaces and aliases. |
| Services | `src/services/` | REST calls (Axios). |
| Stores | `src/store/` | Zustand stores (settings, UI, auth). |
| Hooks | `src/hooks/` | Reusable React side effects (uploads, WebSocket). |
| Lib | `src/lib/` | Pure utilities (axios client, presets, query client). |
| Components | `src/components/` | Branding, auth guards, layout, gallery, landing, processing, profiles, sessions, UI primitives. |
| Pages | `src/pages/` | Route-level views. |

---

## Quick Start

### With Docker

```bash
docker pull ghcr.io/x42en/astro-stack-ui:latest

docker run -d --name astro-ui -p 3000:80 \
  ghcr.io/x42en/astro-stack-ui:latest
```

Open `http://localhost:3000`. Use the Settings page to point the UI at your
running AstroStack backend.

### With the AstroStack compose stack

Add the service to the backend's `docker-compose.yml`:

```yaml
services:
  astro-ui:
    image: ghcr.io/x42en/astro-stack-ui:latest
    restart: unless-stopped
    ports:
      - "3000:80"
    environment:
      VITE_API_BASE_URL: http://localhost:8080/api/v1
      VITE_WS_BASE_URL: ws://localhost:8080/ws
    depends_on:
      - astro-api
    labels:
      - "traefik.enable=true"
      - "traefik.http.routers.astro-ui.rule=Host(`ui.${TRAEFIK_HOST}`)"
      - "traefik.http.routers.astro-ui.entrypoints=websecure"
      - "traefik.http.routers.astro-ui.tls.certresolver=letsencrypt"
      - "traefik.http.services.astro-ui.loadbalancer.server.port=80"
```

```bash
docker compose up -d astro-ui
```

---

## Configuration

### Build-time variables

These are baked into the JavaScript bundle. They set the **defaults** shown in
the Settings page; users can override them at runtime.

| Variable | Default | Description |
|---|---|---|
| `VITE_API_BASE_URL` | `/api/v1` | REST API root URL (relative URLs route via Traefik). |
| `VITE_WS_BASE_URL` | derived from page origin | WebSocket endpoint for live job progress. |
| `VITE_SUPABASE_URL` | *(empty)* | Supabase project URL — required only if Supabase persistence is enabled. |
| `VITE_SUPABASE_ANON_KEY` | *(empty)* | Supabase anonymous key. |

```bash
docker build \
  --build-arg VITE_API_BASE_URL=https://api.example.com/api/v1 \
  --build-arg VITE_WS_BASE_URL=wss://api.example.com/ws \
  -t astro-stack-ui:local .
```

### Runtime settings (Settings page, admin only)

| Setting | Default | Description |
|---|---|---|
| **API Base URL** | `VITE_API_BASE_URL` | REST API root URL. |
| **WebSocket URL** | `VITE_WS_BASE_URL` | Live-progress endpoint. |
| **Authentication** | `false` | Toggle Bearer-token authentication on API requests. |
| **API Key** | *(empty)* | Token sent in `Authorization: Bearer <key>` when enabled. |
| **Inbox Path** | `/data/inbox` | Informational — must match the backend's `INBOX_PATH`. |
| **Ollama URL** | `http://localhost:11434` | Informational — must match the backend's `OLLAMA_URL`. |
| **Max retries** | `3` | Default per-step retry budget. |
| **Session stability delay** | `5 s` | Seconds to wait after the last file change before launching the pipeline. |

Values are persisted to `localStorage`.

---

## Usage

### Browse the public gallery

The landing page (`/`) showcases a live carousel of recently published
sessions; the full grid lives at `/gallery`. Both are accessible without an
account. Anonymous visitors can request a one-time download by email.

### Sign in

`/login` accepts any non-empty credentials in the preview build. Use the
username `admin` to unlock the Settings page and its menu entries.

### Create and run a session

1. From the dashboard, click **New Session** and provide a name plus an
   optional object (e.g. `M31 Andromeda`).
2. Drag-and-drop FITS / RAW frames into the lights / darks / flats / bias
   slots. Lights are mandatory.
3. Pick a preset (`Quick`, `Standard`, `Quality`) or a custom profile.
4. Watch the per-step progress, log lines, and final outputs stream in.

### Manage processing profiles

Open `/profiles` to create, edit, import, export, and publish profiles. Sharing
a profile publishes it to the community; other users can import it in one
click.

### Inspect a result

Open any session in the gallery or in your history. The metadata cartouche
overlay surfaces the camera, ISO, exposure, focal length, integration time,
plus the exact pipeline that produced the image. The cartouche starts
collapsed so it never hides the photo.

---

## Roadmap

The following items are planned but not yet implemented. They are listed in
priority order; the order may change based on feedback.

1. **Authentication** via [auth-service](https://github.com/circle-rd/auth-service).
2. **Planet-dedicated processing pipeline** with lucky-imaging support.
3. **Observation time-slot suggestions** after selecting a celestial object and
   a location.
4. **AI-driven session scheduling** and observation recommendations based on
   weather forecast, location, and target.
5. **Pipeline tools and steps exposed as MCP servers** so external agents can
   compose them.
6. **AI-driven pipeline auto-selection and auto-improve** through agent
   workflows.
7. **Observation alerts** (cancel reminders for cloudy nights, favourite-target
   visibility windows, etc.).

---

## Development

See [DEVELOPMENT.md](./DEVELOPMENT.md) for the full development guide
(architecture, local setup, testing, common workflows) and the shared coding
principles that apply to every change.

Quick reference:

```bash
git clone https://github.com/x42en/astro-stack-ui.git
cd astro-stack-ui
cp .env.example .env
npm install
npm run dev               # http://localhost:5173 with HMR

npm run typecheck         # tsc --noEmit
npm run lint              # ESLint
npm run build             # Production bundle to dist/
npm run preview           # Serve dist/ locally
```

---

## Contributing

See [CONTRIBUTING.md](./CONTRIBUTING.md) for the workflow, commit-message
conventions, and review process.

---

## License

AstroUI is released under the [MIT License](./LICENSE).

The [AstroStack](https://github.com/x42en/AstroStack) backend is a separate
project with its own licensing terms — see its repository for details.
