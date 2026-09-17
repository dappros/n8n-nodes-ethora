import type {
	IExecuteFunctions,
	INodeExecutionData,
	INodeType,
	INodeTypeDescription,
	IDataObject,
	ICredentialDataDecryptedObject,
	JsonObject,
} from 'n8n-workflow';
// NodeConnectionType is a type-only export as of the installed n8n-workflow
// version; the runtime value lives on NodeConnectionTypes (plural).
import { NodeApiError, NodeConnectionTypes } from 'n8n-workflow';

// Endpoint shapes verified against the live spec at
// https://api.chat.ethora.com/api-docs/swagger.json (2026-09-17). See
// SUBMISSION_CHECKLIST.md for what this replaced and why: the previous
// /v1/rooms* paths were unverified placeholders that don't exist on the
// real API.
//
// "Send" posts through the async broadcast job (POST
// /v2/apps/{appId}/chats/broadcast), the only REST path that can put a
// message into a room without an XMPP session - it accepts a B2B Server
// JWT, matching this node's credential. It returns 202 + a jobId/statusUrl,
// not a delivery receipt, since the send happens in a background job.
//
// "Send to Agent" DOES have a real synchronous endpoint after all:
// POST /v2/agents/{agentId}/reply, body { text }, returns
// { ok, agentId, reply, model, ragDocsUsed, totalTokens }. Confirmed live
// (curl on api.chat.ethora.com returns 401 Missing token, i.e. the route is
// registered and reaches auth - not a 404) - it just isn't in
// api-docs/swagger.json, so the earlier "no such endpoint exists" note in
// SUBMISSION_CHECKLIST.md was wrong. Uses the same B2B Server JWT
// (x-custom-token / Authorization) as everything else here.
export class Ethora implements INodeType {
	description: INodeTypeDescription = {
		displayName: 'Ethora',
		name: 'ethora',
		icon: 'file:ethora.svg',
		group: ['output'],
		version: 1,
		subtitle: '={{$parameter["operation"]}}',
		description: 'Send messages and manage rooms on a self-hosted or cloud Ethora instance',
		defaults: {
			name: 'Ethora',
		},
		inputs: [NodeConnectionTypes.Main],
		outputs: [NodeConnectionTypes.Main],
		credentials: [
			{
				name: 'ethoraApi',
				required: true,
			},
		],
		properties: [
			{
				displayName: 'Resource',
				name: 'resource',
				type: 'options',
				noDataExpression: true,
				options: [
					{ name: 'Message', value: 'message' },
					{ name: 'Room', value: 'room' },
				],
				default: 'message',
			},

			// ---------- Message operations ----------
			{
				displayName: 'Operation',
				name: 'operation',
				type: 'options',
				noDataExpression: true,
				displayOptions: {
					show: { resource: ['message'] },
				},
				options: [
					{
						name: 'Send',
						value: 'send',
						description: 'Broadcast a message into one or more rooms',
						action: 'Send a message',
					},
					{
						name: 'Send to Agent',
						value: 'sendToAgent',
						description: 'Send a message to an AI agent and return its reply',
						action: 'Send a message to an AI agent',
					},
				],
				default: 'send',
			},

			// ---------- Room operations ----------
			{
				displayName: 'Operation',
				name: 'operation',
				type: 'options',
				noDataExpression: true,
				displayOptions: {
					show: { resource: ['room'] },
				},
				options: [
					{
						name: 'Create',
						value: 'create',
						description: 'Create a new chat room',
						action: 'Create a room',
					},
					{
						name: 'Get Many',
						value: 'getMany',
						description: 'List rooms in this app',
						action: 'Get many rooms',
					},
				],
				default: 'getMany',
			},

			// ---------- Message: Send ----------
			{
				displayName: 'Room ID',
				name: 'roomId',
				type: 'string',
				default: '',
				required: true,
				displayOptions: {
					show: { resource: ['message'], operation: ['send'] },
				},
				description: 'The chatId to send into (the part after "&lt;appId&gt;_"). To broadcast to every room in the app instead, enable "All Rooms" below.',
			},
			{
				displayName: 'All Rooms',
				name: 'allRooms',
				type: 'boolean',
				default: false,
				displayOptions: {
					show: { resource: ['message'], operation: ['send'] },
				},
				description: 'Whether to broadcast to every room in the app instead of one Room ID',
			},
			{
				displayName: 'Agent ID',
				name: 'agentId',
				type: 'string',
				default: '',
				required: true,
				displayOptions: {
					show: { resource: ['message'], operation: ['sendToAgent'] },
				},
				description: 'The Ethora agent to send the message to',
			},
			{
				displayName: 'Message Text',
				name: 'text',
				type: 'string',
				typeOptions: { rows: 3 },
				default: '',
				required: true,
				displayOptions: {
					show: { resource: ['message'], operation: ['send', 'sendToAgent'] },
				},
			},

			// ---------- Room: Create ----------
			{
				displayName: 'Room Name',
				name: 'roomName',
				type: 'string',
				default: '',
				required: true,
				displayOptions: {
					show: { resource: ['room'], operation: ['create'] },
				},
			},
			{
				displayName: 'Room Type',
				name: 'roomType',
				type: 'options',
				options: [
					{ name: 'Group', value: 'group' },
					{ name: 'Public', value: 'public' },
				],
				default: 'group',
				displayOptions: {
					show: { resource: ['room'], operation: ['create'] },
				},
			},
		],
		usableAsTool: true,
	};

	async execute(this: IExecuteFunctions): Promise<INodeExecutionData[][]> {
		const items = this.getInputData();
		const returnData: INodeExecutionData[] = [];

		const resource = this.getNodeParameter('resource', 0) as string;
		const operation = this.getNodeParameter('operation', 0) as string;

		// `={{$credentials....}}` only evaluates inside n8n's own declarative
		// property/credential bindings (e.g. EthoraApi.credentials.ts's
		// `authenticate` block). Building request URLs by hand in execute()
		// needs the resolved values, via getCredentials().
		const credentials = (await this.getCredentials(
			'ethoraApi',
		)) as ICredentialDataDecryptedObject;
		const baseUrl = (credentials.baseUrl as string).replace(/\/+$/, '');
		const appId = credentials.appId as string;

		for (let i = 0; i < items.length; i++) {
			let responseData: IDataObject = {};

			try {
				if (resource === 'message' && operation === 'send') {
					const text = this.getNodeParameter('text', i) as string;
					const allRooms = this.getNodeParameter('allRooms', i) as boolean;
					const body: IDataObject = { text };
					if (allRooms) {
						body.allRooms = true;
					} else {
						const roomId = this.getNodeParameter('roomId', i) as string;
						body.chatIds = [roomId];
					}

					responseData = await this.helpers.httpRequestWithAuthentication.call(
						this,
						'ethoraApi',
						{
							method: 'POST',
							url: `${baseUrl}/v2/apps/${appId}/chats/broadcast`,
							body,
							json: true,
						},
					);
				} else if (resource === 'message' && operation === 'sendToAgent') {
					const agentId = this.getNodeParameter('agentId', i) as string;
					const text = this.getNodeParameter('text', i) as string;

					responseData = await this.helpers.httpRequestWithAuthentication.call(
						this,
						'ethoraApi',
						{
							method: 'POST',
							url: `${baseUrl}/v2/agents/${agentId}/reply`,
							body: { text },
							json: true,
						},
					);
				} else if (resource === 'room' && operation === 'create') {
					const roomName = this.getNodeParameter('roomName', i) as string;
					const roomType = this.getNodeParameter('roomType', i) as string;

					responseData = await this.helpers.httpRequestWithAuthentication.call(
						this,
						'ethoraApi',
						{
							method: 'POST',
							url: `${baseUrl}/v2/apps/${appId}/chats`,
							body: { title: roomName, type: roomType },
							json: true,
						},
					);
				} else if (resource === 'room' && operation === 'getMany') {
					responseData = await this.helpers.httpRequestWithAuthentication.call(
						this,
						'ethoraApi',
						{
							method: 'GET',
							url: `${baseUrl}/v2/apps/${appId}/chats`,
							json: true,
						},
					);
				}

				returnData.push({
					json: responseData,
					pairedItem: { item: i },
				});
			} catch (error) {
				if (this.continueOnFail()) {
					returnData.push({
						json: { error: (error as Error).message },
						pairedItem: { item: i },
					});
					continue;
				}
				throw new NodeApiError(this.getNode(), error as JsonObject);
			}
		}

		return [returnData];
	}
}
