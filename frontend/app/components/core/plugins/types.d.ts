type TPlugin = {
	name: string
	official: boolean
	sourcePattern: string | null
	versionSources: Record<string, string> | null
}

type TPluginVersionSource = {
	version: string
	source: string
}
type TPluginEdit = {
	name: string
	official: boolean
	sourcePattern: string | null
	versionSources: TPluginVersionSource[]
}
