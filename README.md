<div align="center">

# OpenConcert

</div>

<div align="center">

OpenConcert is a free, open-source music player without ads or tracking. Search for any song or artist, build playlists, and start listening.<br>
Runs on Windows, macOS, and Linux.

</div>

## Download

Grab the latest release for your platform from the [Releases page](../../releases).

| Platform | Formats |
|----------|---------|
| Windows | `.exe` installer, `.msi` |
| macOS | `.dmg` (Apple Silicon and Intel) |
| Linux | `.AppImage`, `.deb`, `.rpm`, `.flatpak` |

## Features

- Search for music and stream it from any source
- Browse artist pages with biographies, discographies, and similar artists
- Browse album pages with track listings
- Queue management with shuffle, repeat, and drag-and-drop reordering
- Favorites (albums, artists, and tracks)
- Playlists (create, import, export, and import from various services)
- Powerful plugin system with a built-in plugin store
- Themes (built-in and custom CSS themes)
- MCP server lets your AI agent drive the player
- Auto-updates
- Keyboard shortcuts
- Localized in multiple languages

## Plugins

OpenConcert is built around a powerful plugin system — every major feature is driven by plugins.

Plugins can provide streaming sources, metadata, playlists, dashboard content, and more. Browse and install plugins from the built-in plugin store, or write your own using the plugin SDK.

## MCP

You can enable the MCP server in Settings → Integrations.

Then to add it to **Claude Code:**

```bash
claude mcp add openconcert --transport http http://127.0.0.1:8800/mcp
```

**Codex CLI:**

```bash
codex mcp add openconcert --url http://127.0.0.1:8800/mcp
```

**OpenCode:**

```json
{
  "mcp": {
    "openconcert": {
      "type": "remote",
      "url": "http://127.0.0.1:8800/mcp"
    }
  }
}
```

**Claude Desktop / Cursor / Windsurf:**

```json
{
  "mcpServers": {
    "openconcert": {
      "url": "http://127.0.0.1:8800/mcp"
    }
  }
}
```

## Development

OpenConcert is a pnpm monorepo managed with Turborepo. The main app is built with Tauri (Rust + React).

### Prerequisites

- Node.js >= 22
- pnpm >= 9
- Rust (stable)
- Platform-specific Tauri dependencies ([see Tauri docs](https://v2.tauri.app/start/prerequisites/))

### Getting started

```bash
git clone https://github.com/awest813/Music-.git
cd Music-
pnpm install
pnpm dev
```

### Useful commands

```bash
pnpm dev            # Run the player in dev mode
pnpm build          # Build all packages
pnpm test           # Run all tests
pnpm lint           # Lint all packages
pnpm type-check     # TypeScript checks
pnpm storybook      # Run Storybook
```

## License

AGPL-3.0. See [LICENSE](LICENSE).
