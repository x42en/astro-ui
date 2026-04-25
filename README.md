# AstroStack UI

> Web interface for the [AstroStack](https://github.com/x42en/astro-stack) astrophotography processing pipeline.

AstroStack UI is a React single-page application that connects to the AstroStack backend API. It lets you create processing sessions, upload calibration frames, monitor pipeline progress in real time via WebSocket, and inspect output results — all from a browser.

---

## Requirements

| Dependency | Version |
|---|---|
| [AstroStack backend](https://github.com/x42en/astro-stack) | latest |
| Docker | ≥ 24 |
| Node.js *(dev only)* | ≥ 20 |

The UI is a pure static web application served by Nginx. It has no runtime server-side dependencies beyond the AstroStack API.

---

## Quick Start

### With the AstroStack compose stack

The simplest integration is to add the UI service directly to the existing `docker-compose.yml` in the [astro-stack](https://github.com/x42en/astro-stack) repository.

**1. Pull the image**

```bash
docker pull ghcr.io/x42en/astro-stack-ui:latest
```

**2. Add the service to your `docker-compose.yml`**

```yaml
services:
  # … existing astro-stack services …

  astro-ui:
    image: ghcr.io/x42en/astro-stack-ui:latest
    restart: unless-stopped
    ports:
      - "3000:80"
    environment:
      # These values are baked in at build time. If you rebuild locally,
      # pass them as --build-arg. For the pre-built image the UI settings
      # page lets you reconfigure the endpoints at runtime.
      VITE_API_BASE_URL: http://localhost:8080/api/v1
      VITE_WS_BASE_URL: ws://localhost:8080/ws
    depends_on:
      - astro-api
    labels:
      # Optional — Traefik integration (mirrors astro-stack conventions)
      - "traefik.enable=true"
      - "traefik.http.routers.astro-ui.rule=Host(`ui.${TRAEFIK_HOST}`)"
      - "traefik.http.routers.astro-ui.entrypoints=websecure"
      - "traefik.http.routers.astro-ui.tls.certresolver=letsencrypt"
```

**3. Start**

```bash
docker compose up -d astro-ui
```

The interface is now available at `http://localhost:3000` (or `https://ui.<your-domain>` behind Traefik).

---

### Standalone (without the full compose stack)

```bash
docker run -d \
  --name astro-ui \
  -p 3000:80 \
  ghcr.io/x42en/astro-stack-ui:latest
```

Then open the **Settings** page in the UI to point it at your running AstroStack backend.

---

## Reverse Proxy — Traefik

If you use Traefik (as described in the [astro-stack documentation](https://github.com/x42en/astro-stack#reverse-proxy-traefik)), add the following labels to the `astro-ui` service and set the required variables in your `.env`:

```env
# .env (same file as the backend)
TRAEFIK_HOST=yourdomain.com
TRAEFIK_ACME_EMAIL=you@yourdomain.com
```

```yaml
labels:
  - "traefik.enable=true"
  - "traefik.http.routers.astro-ui.rule=Host(`ui.${TRAEFIK_HOST}`)"
  - "traefik.http.routers.astro-ui.entrypoints=websecure"
  - "traefik.http.routers.astro-ui.tls.certresolver=letsencrypt"
  - "traefik.http.services.astro-ui.loadbalancer.server.port=80"
```

> The UI only serves static files. Traefik terminates TLS; Nginx handles the SPA routing internally.

---

## Configuration

### Build-time variables

These variables are embedded into the JavaScript bundle during `docker build`. They set the **default** endpoints shown in the Settings page when the application first loads. Users can override every value from the Settings UI without rebuilding the image.

| Variable | Default | Description |
|---|---|---|
| `VITE_API_BASE_URL` | `http://localhost:8080/api/v1` | Root URL of the AstroStack REST API, including the version prefix. |
| `VITE_WS_BASE_URL` | `ws://localhost:8080/ws` | WebSocket endpoint used for real-time job progress. |
| `VITE_SUPABASE_URL` | *(empty)* | Supabase project URL. Required only if using Supabase for optional UI persistence features. |
| `VITE_SUPABASE_ANON_KEY` | *(empty)* | Supabase anonymous (public) key. Required alongside `VITE_SUPABASE_URL`. |

Pass them at build time:

```bash
docker build \
  --build-arg VITE_API_BASE_URL=https://api.yourdomain.com/api/v1 \
  --build-arg VITE_WS_BASE_URL=wss://api.yourdomain.com/ws \
  -t astro-stack-ui:local .
```

Or override them in the GitHub Actions workflow via repository **Variables** (`vars.VITE_API_BASE_URL`) and **Secrets** (`secrets.VITE_SUPABASE_URL`, `secrets.VITE_SUPABASE_ANON_KEY`).

---

### Runtime settings (Settings page)

All connection parameters and processing defaults can be reconfigured at runtime from the **Settings** page without rebuilding the image. Values are stored in the browser's `localStorage`.

| Setting | Default | Description |
|---|---|---|
| **API Base URL** | `VITE_API_BASE_URL` | REST API root URL. Changing this and clicking *Test* will verify connectivity immediately. |
| **WebSocket URL** | `VITE_WS_BASE_URL` | Used for live pipeline step and job progress updates. |
| **Authentication** | `false` | Enable Bearer token authentication on every API request. |
| **API Key** | *(empty)* | Token sent in `Authorization: Bearer <key>` when authentication is enabled. Mirrors `AUTH_ENABLED` / `JWT_SECRET` on the backend. |
| **Inbox Path** | `/data/inbox` | Informational — must match `INBOX_PATH` configured on the AstroStack server. |
| **Ollama URL** | `http://localhost:11434` | Informational — must match `OLLAMA_URL` on the server (used for AI gradient removal). |
| **Max retries** | `3` | Default maximum retry count for pipeline steps. Mirrors `PIPELINE_MAX_RETRIES` on the server. |
| **Session stability delay** | `5 s` | Seconds the server waits after the last file change before starting the pipeline. Mirrors `SESSION_STABILITY_DELAY` on the server. |
| **View mode** | `simple` | `simple` shows preset cards; `advanced` exposes custom processing profiles. |

---

## Usage

### Creating a session

1. Click **New Session** on the Dashboard.
2. **Step 1 — Session info:** give the session a name and optional object name (e.g. `M31 Andromeda`).
3. **Step 2 — Frame files:** drag-and-drop or pick your FITS / RAW files. Lights are mandatory; darks, flats, and bias are optional but strongly recommended.
4. **Step 3 — Processing profile:** choose the default preset (`Quick`, `Standard`, or `Quality`). This is remembered per session.
5. Files upload sequentially; progress is shown in real time.

### Launching the pipeline

From the Dashboard, each session card shows a **split button**:
- The **main button** launches with the remembered preset.
- The **chevron** opens a dropdown to pick a different preset for this run.

From a session's detail page, select a preset (or a custom profile in Advanced mode) and click **Start Processing**.

### Monitoring progress

Open a session while it is processing to see a live step-by-step progress view powered by the AstroStack WebSocket endpoint.

### Downloading results

When a job completes, the **Output** section lets you download the final FITS, TIFF, or preview JPEG produced by the pipeline.

---

## Architecture

```
Browser
  │
  ├─► Nginx (port 80) ──► serves dist/index.html + static assets
  │
  └─► AstroStack API  ──► REST calls (axios)
  └─► AstroStack WS   ──► real-time job events (WebSocket)
```

| Layer | Technology |
|---|---|
| Framework | React 18 + TypeScript |
| Build tool | Vite 5 |
| Routing | React Router v7 |
| State | Zustand (with localStorage persistence) |
| Data fetching | TanStack Query v5 |
| HTTP client | Axios |
| UI components | Radix UI primitives |
| Styling | Tailwind CSS v3 |
| Icons | Lucide React |
| Container | Nginx 1.27 Alpine |

---

## Development

### Prerequisites

- Node.js ≥ 20
- A running AstroStack backend (see [astro-stack](https://github.com/x42en/astro-stack))

### Setup

```bash
git clone https://github.com/x42en/astro-stack-ui.git
cd astro-stack-ui

cp .env.example .env      # fill in VITE_API_BASE_URL etc.
npm install
npm run dev               # starts on http://localhost:5173
```

### Available scripts

| Script | Description |
|---|---|
| `npm run dev` | Start the Vite dev server with hot-module replacement |
| `npm run build` | Production build to `dist/` |
| `npm run preview` | Serve the `dist/` folder locally |
| `npm run typecheck` | Run `tsc --noEmit` without emitting files |
| `npm run lint` | ESLint check across the entire source tree |

### Building the Docker image locally

```bash
docker build \
  --build-arg VITE_API_BASE_URL=http://localhost:8080/api/v1 \
  --build-arg VITE_WS_BASE_URL=ws://localhost:8080/ws \
  -t astro-stack-ui:dev .

docker run -p 3000:80 astro-stack-ui:dev
```

### Contributing

See [CONTRIBUTING.md](./CONTRIBUTING.md).

---

## Licenses

AstroStack UI is released under the [MIT License](./LICENSE).

The [astro-stack](https://github.com/x42en/astro-stack) backend is a separate project with its own licensing terms. See its repository for details.
