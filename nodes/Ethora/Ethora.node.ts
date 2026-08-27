import type {
	IExecuteFunctions,
	INodeExecutionData,
	INodeType,
	INodeTypeDescription,
	IDataObject,
} from 'n8n-workflow';
import { NodeConnectionType } from 'n8n-workflow';

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
		inputs: [NodeConnectionType.Main],
		outputs: [NodeConnectionType.Main],
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
						description: 'Send a message into a room',
						action: 'Send a message',
					},
					{
						name: 'Send to Agent',
						value: 'sendToAgent',
						description: 'Send a message to an AI agent and wait for its reply',
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
						description: 'List rooms in this workspace',
						action: 'Get many rooms',
					},
				],
				default: 'getMany',
			},

			// ---------- Shared / operation-specific fields ----------
			{
				displayName: 'Room ID',
				name: 'roomId',
				type: 'string',
				default: '',
				required: true,
				displayOptions: {
					show: { resource: ['message'] },
				},
				description: 'The room to send the message into',
			},
			{
				displayName: 'Message Text',
				name: 'text',
				type: 'string',
				typeOptions: { rows: 3 },
				default: '',
				required: true,
				displayOptions: {
					show: { resource: ['message'] },
				},
			},
			{
				displayName: 'Agent Name or ID',
				name: 'agentId',
				type: 'string',
				default: '',
				required: true,
				displayOptions: {
					show: { resource: ['message'], operation: ['sendToAgent'] },
				},
				description: 'The AI agent to send the message to',
			},
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
		],
	};

	async execute(this: IExecuteFunctions): Promise<INodeExecutionData[][]> {
		const items = this.getInputData();
		const returnData: INodeExecutionData[] = [];

		const resource = this.getNodeParameter('resource', 0) as string;
		const operation = this.getNodeParameter('operation', 0) as string;

		for (let i = 0; i < items.length; i++) {
			let responseData: IDataObject = {};

			try {
				if (resource === 'message' && operation === 'send') {
					const roomId = this.getNodeParameter('roomId', i) as string;
					const text = this.getNodeParameter('text', i) as string;

					responseData = await this.helpers.httpRequestWithAuthentication.call(
						this,
						'ethoraApi',
						{
							method: 'POST',
							url: '={{$credentials.baseUrl}}/v1/rooms/' + roomId + '/messages',
							body: { text },
							json: true,
						},
					);
				} else if (resource === 'message' && operation === 'sendToAgent') {
					const roomId = this.getNodeParameter('roomId', i) as string;
					const text = this.getNodeParameter('text', i) as string;
					const agentId = this.getNodeParameter('agentId', i) as string;

					responseData = await this.helpers.httpRequestWithAuthentication.call(
						this,
						'ethoraApi',
						{
							method: 'POST',
							url: '={{$credentials.baseUrl}}/v1/agents/' + agentId + '/reply',
							body: { roomId, text },
							json: true,
						},
					);
				} else if (resource === 'room' && operation === 'create') {
					const roomName = this.getNodeParameter('roomName', i) as string;

					responseData = await this.helpers.httpRequestWithAuthentication.call(
						this,
						'ethoraApi',
						{
							method: 'POST',
							url: '={{$credentials.baseUrl}}/v1/rooms',
							body: { name: roomName },
							json: true,
						},
					);
				} else if (resource === 'room' && operation === 'getMany') {
					responseData = await this.helpers.httpRequestWithAuthentication.call(
						this,
						'ethoraApi',
						{
							method: 'GET',
							url: '={{$credentials.baseUrl}}/v1/rooms',
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
				throw error;
			}
		}

		return [returnData];
	}
}
