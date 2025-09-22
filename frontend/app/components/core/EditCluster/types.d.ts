type TClusterValues = {
	type: string
	name: string
	deploymentId?: string
	elasticUrl: string
	kibanaUrl: string
	sshUser: string
	pathToSSH: string
	kibanaConfigs: TKibanaConfigs[]
	certFiles: File[] | TExistingFile[]
}

type TClusterCredentialValues = {
	authPref: "U/P" | "API_KEY" | null
	username: string
	password: string
	apiKey: string | null
}

type TKibanaConfigs = {
	name: string
	ip: string
}

type TExistingFile = {
	name: string
	storedOnServer: boolean
}
