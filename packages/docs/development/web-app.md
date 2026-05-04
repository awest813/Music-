---
description: Architecture and local development notes for the Nuclear web app target
---

# Web app

Nuclear includes a browser target for running the app outside the desktop shell. The web app reuses the same shared UI, theme, i18n, model, audio, and plugin SDK packages as the desktop app.

{% hint style="info" %}
The web app is designed as a progressive web app. It can cache the app shell and local browser state, but streaming still requires the backend server.
{% endhint %}

## Packages

- `@nuclearplayer/web` contains the browser frontend.
- `@nuclearplayer/server` contains the stateless backend used by the web frontend.
- `@nuclearplayer/platform` contains the shared platform contract and runtime implementations for desktop and browser environments.

## Platform abstraction

Desktop-only APIs are accessed through the platform layer instead of being called directly by shared app code. The desktop implementation wraps the native runtime APIs. The browser implementation uses browser APIs where possible and forwards backend-only operations to the server.

The platform layer covers:

- Storage
- Filesystem operations
- Dialogs
- External links
- Logging
- Process lifecycle
- Updates
- Backend command invocation
- Runtime capability flags

## Local development

Run the web frontend and backend together from the repository root:

```bash
pnpm dev:web
```

The frontend runs on port `5174` and expects the backend at `http://localhost:3473` by default. Override the backend URL with `VITE_NUCLEAR_SERVER_URL` when needed.

The backend exposes a plugin marketplace proxy at `/proxy/plugin-marketplace` when `NUCLEAR_PLUGIN_MARKETPLACE_PROXY_URL` is configured.

## Deployment

The web frontend builds to static assets and can be served by any static file host. The backend runs as a small HTTP service and must be reachable by the frontend for streaming and backend command invocation.

A compose file is provided for self-hosted deployments:

```bash
docker compose up --build
```

## Web runtime limitations

The browser runtime intentionally does not provide full parity with the desktop shell:

- Discord Rich Presence is desktop-only.
- Native auto-updates are replaced by the PWA update flow.
- Local directory watching is unavailable in the browser runtime.
- Streaming requires the backend server.
- Direct local file access depends on browser permission prompts and available browser APIs.
