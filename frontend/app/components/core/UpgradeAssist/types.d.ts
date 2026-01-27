type TDeprecationSettings = {
	title: string
	criticalValue: string | number
	warningValue: string | number
	isDisabled: boolean
	to: string
}

type TIssue = {
	title: string
	icon: React.FunctionComponent<{ size?: string; color?: string }>
	value: string | number
	fontColor?: string
	bgColor?: string
}

type TStepData = {
	boxBackground: string
	background: string
	textColor: string
	stepValue: string | React.ReactElement
	internalBackground: string
	boxShadow: string
	isDisabled: boolean
}

type TStepStatus = {
	[Key: string]: "COMPLETED" | "INPROGRESS" | "PENDING" | "NOTVISITED"
}

type FeatureMigrationStatus = "NO_MIGRATION_NEEDED" | "MIGRATION_NEEDED" | "IN_PROGRESS" | "ERROR"
