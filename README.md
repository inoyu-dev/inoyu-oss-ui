# Inoyu OSS UI

Open-source web interface for [Apache Unomi](https://unomi.apache.org/) — the open-source Customer Data Platform. Powered by Apache Unomi.

## Features

- **Profile Management** — Browse, search, and inspect customer profiles
- **Segment Builder** — Visual and JSON condition builder for audience segmentation
- **Rule Builder** — Automation rules with conditions and actions
- **Goals & Campaigns** — Conversion tracking and campaign management
- **Scoring** — Lead scoring with configurable scoring plans
- **Property Types** — Manage profile/session/event property definitions
- **JSON Schemas** — Event validation schema management
- **Condition & Action Types** — Browse available Unomi condition and action types
- **Groovy Actions** — Custom Groovy action management (on-premise)
- **Monaco JSON Editor** — Syntax highlighting, validation, autocompletion for Unomi JSON
- **Plugin System** — Extend with custom plugins (components, pages, services, navigation)

## Quick Start

```bash
# Install dependencies
npm install

# Configure Unomi connection
cp .env.example .env.local
# Edit .env.local with your Unomi server URL

# Start development server
npm run dev
```

The app runs at [http://localhost:3131](http://localhost:3131).

## Configuration

| Variable | Default | Description |
|----------|---------|-------------|
| `UNOMI_URL` | `http://localhost:8181` | Unomi server URL |
| `UNOMI_KEY` | — | Unomi API key |
| `JWT_SECRET` | — | Secret for session tokens |
| `DEPLOYMENT_TYPE` | `multi-tenant` | `multi-tenant` or `on-premise` |

## Plugin System

Inoyu OSS UI supports a plugin architecture for extending functionality:

```typescript
import type { Plugin } from '@/plugins/types';

const myPlugin: Plugin = {
  id: 'my-plugin',
  name: 'My Plugin',
  version: '1.0.0',
  priority: 10,
  extensions: {
    pages: {
      '/my-page': MyPageComponent,
    },
    components: {
      'conditions/ConditionBuilder': MyConditionBuilder,
    },
  },
};
```

See [Plugin Builder Guide](docs/specs/PLUGIN_BUILDER_GUIDE.md) for details.

## License

Apache License 2.0 — see [LICENSE](LICENSE) for details.

## Trademarks

Apache&reg;, Apache Unomi, Unomi, and the Unomi logo are either registered trademarks or trademarks of the [Apache Software Foundation](https://www.apache.org/) in the United States and/or other countries. No endorsement by The Apache Software Foundation is implied by the use of these marks.
