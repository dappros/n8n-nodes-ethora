import type {
	Icon,
	IAuthenticateGeneric,
	ICredentialTestRequest,
	ICredentialType,
	INodeProperties,
} from 'n8n-workflow';

// Auth model verified against the live spec at
// https://api.chat.ethora.com/api-docs/swagger.json (components.securitySchemes.B2BServerJwtAuth):
// a B2B Server JWT (data.type="server"), sent as `Authorization: Bearer <JWT>`
// (the legacy `x-custom-token` header is also accepted, but Bearer is the
// preferred/documented header for backend integrations like this one).
//
// Mint this token server-side via the app's own admin flow (it is not something
// an end user logs in with) and paste it here. It is scoped to one App ID, which
// is why App ID is a separate field rather than something decoded out of the token.
export class EthoraApi implements ICredentialType {
	name = 'ethoraApi';

	displayName = 'Ethora API';

	// Reuses the node's own icon (no separate credential icon asset exists yet).
	icon: Icon = 'file:../nodes/Ethora/ethora.svg';

	documentationUrl = 'https://api.chat.ethora.com/api-docs/';

	properties: INodeProperties[] = [
		{
			displayName: 'Base URL',
			name: 'baseUrl',
			type: 'string',
			default: 'https://api.chat.ethora.com',
			placeholder: 'https://api.your-domain.com',
			description:
				'The API base URL of your Ethora instance. Use your own domain for a self-hosted deployment, or the default for Ethora Cloud.',
			required: true,
		},
		{
			displayName: 'App ID',
			name: 'appId',
			type: 'string',
			default: '',
			description: 'The app/workspace identifier the Server JWT below is scoped to',
			required: true,
		},
		{
			displayName: 'Server Token',
			name: 'serverToken',
			type: 'string',
			typeOptions: { password: true },
			default: '',
			description: 'A B2B Server JWT for this app (data.type="server"), minted from your Ethora backend/admin flow',
			required: true,
		},
	];

	authenticate: IAuthenticateGeneric = {
		type: 'generic',
		properties: {
			headers: {
				Authorization: '=Bearer {{$credentials.serverToken}}',
			},
		},
	};

	// Lists this app's rooms - cheap, read-only, and exercises the exact
	// auth model (B2BServerJwtAuth) every other operation in this node uses,
	// so a green test here is a real signal the token/appId pair works.
	test: ICredentialTestRequest = {
		request: {
			baseURL: '={{$credentials.baseUrl}}',
			url: '=/v2/apps/{{$credentials.appId}}/chats',
			method: 'GET',
		},
	};
}
