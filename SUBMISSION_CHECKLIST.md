# Task 16 - submission checklist

Internal notes, not part of the published package. Maps each requirement from the brief to where it's handled.

- [x] **Scaffolded conventionally** - structure matches what `npm create @n8n/node` produces: `credentials/`, `nodes/<Node>/`, `package.json` with an `n8n` block. Before actual submission, run the real generator (`npm create @n8n/node@latest`) and diff against this scaffold rather than hand-rolling it further - the CLI may have moved since this was written.
- [x] **TypeScript** - both `credentials/EthoraApi.credentials.ts` and `nodes/Ethora/Ethora.node.ts` are TS, built via `tsc`/`n8n-node build` per `tsconfig.json`.
- [x] **Zero runtime dependencies** - `package.json` has no `dependencies` field, only `peerDependencies` (n8n-workflow, provided by the host n8n instance) and `devDependencies`. HTTP calls use `this.helpers.httpRequestWithAuthentication`, which is n8n's own built-in helper, not an added package.
- [x] **One third-party service per package** - this package only talks to Ethora. No bundled integrations for anything else.
- [x] **English-only interface and docs** - all node labels, descriptions, and the README are English.
- [x] **Local build + lint** - `npm install && npm run build` passes (real `tsc`/`n8n-node build` compile). `npm run lint` (`n8n-node lint`) is **0 errors** as of 2026-09-17 (author email added: roman.leshchuh@dappros.com). 2 non-blocking warnings remain (`icon-prefer-themed-variants`, both files): the single `ethora.svg` works but a `{ light, dark }` pair would render better in n8n's dark mode - cosmetic, needs a second SVG asset that doesn't exist yet.
- [ ] **`@n8n/scan-community-package`** - this is a POST-PUBLISH registry security scanner, not a pre-publish local linter (confirmed by running it: it does `GET https://registry.npmjs.org/n8n-nodes-ethora`, 404s since nothing's published yet). Can't run for real until the package is actually on npm. Run it once after the first publish, before submitting to the Creator Portal.
- [x] **Publish via GitHub Actions with provenance** - `.github/workflows/publish.yml` triggers on version tags, runs lint + build, then `npm publish --provenance --access public`. Requires an `NPM_TOKEN` repo secret with publish rights, and the `dappros/n8n-nodes-ethora` GitHub repo to actually exist (it doesn't yet - this has only ever lived as a zip attachment on this Jira ticket). Tag a release (`git tag v0.1.0 && git push --tags`) to trigger it - do not run `npm publish` from a local machine, it won't be accepted for verification.
- [x] **README** - present in the package root, covers install, credential setup, and all four real operations.
- [ ] **Submit through n8n Creator Portal** - manual step, after the above are green: https://docs.n8n.io/integrations/creating-nodes/deploy/submit-community-nodes/

## Real endpoints (fixed 2026-09-17)

Verified against the live spec at `https://api.chat.ethora.com/api-docs/swagger.json`. The
placeholder paths (`/v1/rooms`, `/v1/rooms/{id}/messages`, `/v1/agents/{id}/reply`) do not
exist on the real API and have been replaced:

- **Send message** → `POST /v2/apps/{appId}/chats/broadcast` (async job; 202 + `jobId`/`statusUrl`, not a delivery receipt). Accepts `B2BServerJwtAuth`.
- **Create room** → `POST /v2/apps/{appId}/chats`. Accepts `B2BServerJwtAuth`.
- **Get many rooms** → `GET /v2/apps/{appId}/chats`. Accepts `B2BServerJwtAuth`.
- **Send to Agent** (synchronous ask-and-get-a-reply) → `POST /v2/agents/{agentId}/reply`,
  body `{ text }`, returns `{ ok, agentId, reply, model, ragDocsUsed, totalTokens }`. This one
  is real and DOES exist (confirmed 2026-09-17 by curling prod directly: `401 Missing token`
  with `authFlow: "b2b"`, i.e. the route is registered and reaches auth, not a 404) - it's
  just missing from `api-docs/swagger.json`, which is why the first pass here said it didn't
  exist. Corrected; the operation is back in the node.

Also fixed while verifying: the credential's auth model changed from a generic `API Key` +
`X-App-Id` header (both invented) to a `B2B Server JWT` sent as `Authorization: Bearer <JWT>`,
matching `components.securitySchemes.B2BServerJwtAuth` in the real spec. And the node's
`execute()` was building URLs with `={{$credentials.baseUrl}}` string-concatenation, which
only evaluates inside n8n's declarative property/credential bindings, not inside imperative
TS - it would have silently sent literal `={{$credentials.baseUrl}}/...` as the URL. Replaced
with `this.getCredentials('ethoraApi')` and real template-string concatenation.

## Also fixed while actually building this (2026-09-17)

Two more invented/stale details, caught only by running the real toolchain rather than
reading the source:

- `package.json` pinned `"@n8n/node-cli": "^1.0.0"` - that version never existed on npm
  (latest at the time was `0.49.1`). `npm install` failed outright until this was corrected
  to `^0.49.0`.
- `nodes/Ethora/Ethora.node.ts` imported `NodeConnectionType` as a value
  (`inputs: [NodeConnectionType.Main]`). In the installed `n8n-workflow` version
  `NodeConnectionType` is type-only; the runtime object is `NodeConnectionTypes` (plural).
  `npm run build` failed with `TS2693` until this was fixed.
- `eslint.config.mjs` did not exist at all, so `npm run lint` failed immediately with
  "ESLint couldn't find an eslint.config file" - added the one-liner from
  `@n8n/node-cli`'s own template (`import { config } from '@n8n/node-cli/eslint'; export
  default config;`).

Confirmed by actually running `npm install`, `npm run build`, and `npm run lint` against
this package (not just reading it) - see the checklist items above for current status.
