# marketplace-tour

Interactive live demos of all marketplace plugins.
Discovers installed plugins from `marketplace.json`,
checks Claude Code version compatibility,
and runs guided demos that execute each plugin's features in a sandbox scope.

## Usage

```bash
/marketplace-tour:tour
```

## Features

- **Version gate**: Checks Claude Code >= 2.1.90 and explains which features require it
- **Plugin discovery**: Reads marketplace.json, shows all plugins with descriptions
- **Live demos**: Each plugin gets a guided walkthrough that actually runs its commands/skills
- **Progressive disclosure**: Basics for newcomers, advanced patterns for experienced users
