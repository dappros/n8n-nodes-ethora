import type {
	IAuthenticateGeneric,
	ICredentialTestRequest,
	ICredentialType,
	INodeProperties,
} from 'n8n-workflow';

export class EthoraApi implements ICredentialType {
	name = 'ethoraApi';

	displayName = 'Ethora API';

	documentationUrl = 'https://ethora.com';

	icon = {
		light: 'file:../nodes/Ethora/ethora.svg',
		dark: 'file:../nodes/Ethora/ethora.svg',
	} as const;

	properties: INodeProperties[] = [
		{
			displayName: 'Base URL',
			name: 'baseUrl',
			type: 'string',
			default: 'https://api.chat.ethora.com',
			placeholder: 'https://chat.your-domain.com',
			description:
				'The URL of your Ethora instance. Use your own domain for a self-hosted deployment, or the default for Ethora Cloud.',
			required: true,
		},
		{
			displayName: 'App ID',
			name: 'appId',
			type: 'string',
			default: '',
			description: 'The workspace/app identifier for your Ethora instance',
			required: true,
		},
		{
			displayName: 'API Key',
			name: 'apiKey',
			type: 'string',
			typeOptions: { password: true },
			default: '',
			required: true,
		},
	];

	authenticate: IAuthenticateGeneric = {
		type: 'generic',
		properties: {
			headers: {
				Authorization: '=Bearer {{$credentials.apiKey}}',
				'X-App-Id': '={{$credentials.appId}}',
			},
		},
	};

	test: ICredentialTestRequest = {
		request: {
			baseURL: '={{$credentials.baseUrl}}',
			url: '/v1/health',
			method: 'GET',
		},
	};
}
