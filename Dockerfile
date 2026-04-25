# ─── Build stage ─────────────────────────────────────────────────────────────
FROM node:20-alpine AS builder

WORKDIR /app

COPY package*.json ./
RUN npm ci --ignore-scripts

COPY . .

# Build-time variables injected by docker build --build-arg or GitHub Actions
ARG VITE_API_BASE_URL=http://localhost:8080/api/v1
ARG VITE_WS_BASE_URL=ws://localhost:8080/ws
ARG VITE_SUPABASE_URL
ARG VITE_SUPABASE_ANON_KEY

ENV VITE_API_BASE_URL=$VITE_API_BASE_URL
ENV VITE_WS_BASE_URL=$VITE_WS_BASE_URL
ENV VITE_SUPABASE_URL=$VITE_SUPABASE_URL
ENV VITE_SUPABASE_ANON_KEY=$VITE_SUPABASE_ANON_KEY

RUN npm run build

# ─── Serve stage ──────────────────────────────────────────────────────────────
FROM nginx:1.27-alpine

LABEL org.opencontainers.image.title="AstroStack UI"
LABEL org.opencontainers.image.description="Web interface for the AstroStack astrophotography processing pipeline"
LABEL org.opencontainers.image.url="https://github.com/x42en/astro-stack"
LABEL org.opencontainers.image.source="https://github.com/x42en/astro-stack-ui"
LABEL org.opencontainers.image.licenses="MIT"

COPY --from=builder /app/dist /usr/share/nginx/html
COPY nginx.conf /etc/nginx/conf.d/default.conf

EXPOSE 80

HEALTHCHECK --interval=30s --timeout=5s --start-period=10s --retries=3 \
  CMD wget -qO- http://localhost/health || exit 1

CMD ["nginx", "-g", "daemon off;"]
