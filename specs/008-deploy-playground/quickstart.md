# Quickstart: Deploy Playground

## Verify Deployment

1. Push changes to master
2. Wait for CF Pages build to complete (~2-3 minutes)
3. Visit https://zod.toform.dev/playground
4. Confirm the schema editor loads and form preview renders

## Local Testing

To verify the combined build locally before pushing:

```bash
# Build everything
pnpm run build
pnpm --filter @zod-to-form/docs build
pnpm --filter @zod-to-form/playground build

# Copy playground into docs output
cp -r apps/playground/dist apps/docs/build/playground

# Serve locally
npx serve apps/docs/build

# Visit http://localhost:3000/playground
```

## Update Playground Base Path

The playground's `vite.config.ts` conditionally sets `base: '/playground/'` when `CF_PAGES=1` is detected. For local dev, base remains `/` so `pnpm dev` works at `http://localhost:5000` as before.
