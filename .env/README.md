# Environment Files Organization

This project organizes all environment files in a dedicated `.env/` directory for better project structure and organization.

## Structure

```
.env/
├── .env.development    # Development environment variables
├── .env.production     # Production environment variables
├── .env.dash0          # Dash0 observability configuration
├── .env.dash0.example  # Template for Dash0 setup
└── .env.gitignore      # Instructions for gitignore patterns
```

## Usage

Environment variables are automatically loaded by Vite from the `.env/` directory thanks to the
`envDir: '.env'` configuration in `vite.config.ts`.

### Creating Local Overrides

Create local environment files in the `.env/` directory:

```bash
# For local development overrides
.env/.env.local

# For environment-specific local overrides
.env/.env.development.local
.env/.env.production.local
```

These files are automatically ignored by git but will be loaded by Vite.

## Configuration

The `vite.config.ts` file is configured with:

```typescript
export default defineConfig({
  plugins: [react()],
  // Configure Vite to load .env files from .env directory
  envDir: '.env',
  // ... rest of config
});
```

## Benefits

- **Cleaner root directory**: All environment files are organized in one place
- **Better organization**: Related environment files are grouped together
- **Easier management**: Clear separation between templates and active configurations
- **Maintains functionality**: All existing environment variable usage continues to work
