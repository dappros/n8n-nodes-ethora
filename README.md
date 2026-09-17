# n8n-nodes-ethora

n8n community node for [Ethora](https://ethora.com) - send chat messages, manage rooms, and route messages to an AI agent from an n8n workflow.

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
| Base URL | Your Ethora API base URL - a self-hosted domain, or `https://api.chat.ethora.com` for Ethora Cloud |
| App ID | The app/workspace your Server Token is scoped to |
| Server Token | A B2B Server JWT for this app, minted from your Ethora backend/admin flow (not an end-user login) |

## Operations

**Message**
- **Send** - broadcast a message into one room (by Room ID) or every room in the app (`All Rooms`)
- **Send to Agent** - send a message to an AI agent and return its reply synchronously (`reply`, plus `model`, `ragDocsUsed`, `totalTokens`)

**Room**
- **Create** - create a new chat room (Group or Public)
- **Get Many** - list rooms in this app

## Example: agent-drafted replies from a form submission

An n8n workflow receives a form submission (via webhook or another trigger), passes the text to **Message → Send to Agent**, and posts the agent's `reply` into a review room via **Message → Send** for a team member to approve before it goes out.

## Example: broadcasting an alert from another system

A common pattern: an n8n workflow receives a webhook (e.g. a monitoring alert), then uses **Message → Send** to post it straight into a review or notifications room, with `All Rooms` off and a specific Room ID targeted.

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
