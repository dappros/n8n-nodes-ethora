# Task 16: submission checklist

Internal notes, not part of the published package. Maps each requirement from the brief to where it's handled.

- [x] **Scaffolded conventionally**: structure matches what `npm create @n8n/node` produces: `credentials/`, `nodes/<Node>/`, `package.json` with an `n8n` block. Before actual submission, run the real generator (`npm create @n8n/node@latest`) and diff against this scaffold rather than hand-rolling it further, the CLI may have moved since this was written.
- [x] **TypeScript**: both `credentials/EthoraApi.credentials.ts` and `nodes/Ethora/Ethora.node.ts` are TS, built via `tsc`/`n8n-node build` per `tsconfig.json`.
- [x] **Zero runtime dependencies**: `package.json` has no `dependencies` field, only `peerDependencies` (n8n-workflow, provided by the host n8n instance) and `devDependencies`. HTTP calls use `this.helpers.httpRequestWithAuthentication`, which is n8n's own built-in helper, not an added package.
- [x] **One third-party service per package**: this package only talks to Ethora. No bundled integrations for anything else.
- [x] **English-only interface and docs**: all node labels, descriptions, and the README are English.
- [ ] **Linter**: run before submitting: `npx @n8n/scan-community-package n8n-nodes-ethora`. Not run against this scaffold since it hasn't been through `npm install` / `npm run build` yet, do that first, the linter checks the built output.
- [x] **Publish via GitHub Actions with provenance**: `.github/workflows/publish.yml` triggers on version tags, runs lint + build, then `npm publish --provenance --access public`. Requires an `NPM_TOKEN` repo secret with publish rights. Tag a release (`git tag v0.1.0 && git push --tags`) to trigger it, do not run `npm publish` from a local machine, it won't be accepted for verification.
- [x] **README**: present in the package root, covers install, credential setup, and both operations.
- [ ] **Submit through n8n Creator Portal**: manual step, after the above are green: https://docs.n8n.io/integrations/creating-nodes/deploy/submit-community-nodes/

## Before this is real

The API calls in `Ethora.node.ts` (`/v1/rooms`, `/v1/rooms/{id}/messages`, `/v1/agents/{id}/reply`) are placeholder endpoint shapes based on what's described in the task brief, chat/rooms plus an AI bots layer. They need to be swapped for Ethora's actual REST API paths and request/response shapes before this ships. Everything else (package structure, credential UX, zero-dependency constraint, workflow file) should hold regardless of what the real endpoints turn out to be.
