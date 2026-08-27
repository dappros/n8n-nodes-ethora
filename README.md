# n8n-nodes-ethora

n8n community node for [Ethora](https://ethora.com): send chat messages, manage rooms, and route messages to an AI agent from an n8n workflow.

Works against Ethora Cloud or a self-hosted Ethora instance; you point the node at whichever one you're running via the base URL in the credential.

## Installation

In n8n: **Settings → Community Nodes → Install**, then enter:

```
n8n-nodes-ethora
```

Self-hosted n8n installs can also add it manually:

```bash
npm install n8n-nodes-ethora
```

## Credentials

Create an **Ethora API** credential with:

| Field | Description |
|---|---|
| Base URL | Your Ethora instance URL, a self-hosted domain, or the Ethora Cloud endpoint |
| App ID | The workspace identifier for your Ethora instance |
| API Key | An API key generated from your Ethora account settings |

## Operations

**Message**
- **Send**: post a message into a room
- **Send to Agent**: send a message to a configured AI agent and return its reply, useful for wiring an Ethora agent into a larger n8n workflow (e.g. triage an incoming support email, then post the agent's draft reply back to a room for a human to approve)

**Room**
- **Create**: create a new chat room
- **Get Many**: list rooms in the current workspace

## Example: agent-drafted replies from a form submission

A common pattern: an n8n workflow receives a form submission (via webhook or another trigger), passes the text to **Message → Send to Agent**, and posts the agent's response into a review room for a team member to approve before it goes out. This keeps a human in the loop while letting the agent do the first pass.

## Development

```bash
git clone https://github.com/dappros/n8n-nodes-ethora.git
cd n8n-nodes-ethora
npm install
npm run dev
```

`npm run dev` starts a local n8n instance with this node loaded and hot reload enabled.

## Support

Issues and feature requests: [github.com/dappros/n8n-nodes-ethora/issues](https://github.com/dappros/n8n-nodes-ethora/issues)

## License

MIT
