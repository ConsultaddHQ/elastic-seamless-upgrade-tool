type TEditClusterValues = {
	type: string
	name: string
	deploymentId?: string
	elasticUrl: string
	kibanaUrl: string
	kibanaConfigs: TKibanaConfigs[]
}

type TEditSshDetailValues = {
	sshUser: string
	pathToSSH: string
}

type TClusterCredentialValues = {
	authPref: "U/P" | "API_KEY" | null
	username: string
	password: string
	apiKey: string | null
	certFiles: File[] | TExistingFile[]
}

type TKibanaConfigs = {
	name: string
	ip: string
}

type TExistingFile = {
	name: string
	storedOnServer: boolean
}
