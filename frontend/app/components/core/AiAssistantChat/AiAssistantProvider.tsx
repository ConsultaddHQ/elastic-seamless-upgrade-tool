import { useState } from "react"
import { AiAssistantContext } from "."
import { useParams } from "react-router"

export type Context = {
	precheckId?: string
	clusterId?: string
	setPrecheckId: (id: string) => void
	showAssistant: boolean
	setShowAssistant: (show: boolean) => void
}
const AiAssistantProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
	const clusterId = useParams().clusterId
	const [showAssistant, setShowAssistant] = useState(false)
	const [precheckId, setPrecheckId] = useState<string | undefined>(undefined)
	return (
		<AiAssistantContext.Provider value={{ clusterId, precheckId, setPrecheckId, showAssistant, setShowAssistant }}>
			{children}
		</AiAssistantContext.Provider>
	)
}

export default AiAssistantProvider
