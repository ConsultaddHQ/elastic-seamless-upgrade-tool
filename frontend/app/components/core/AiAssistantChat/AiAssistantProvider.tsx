import { useState } from "react"
import { AiAssistantContext } from "."
import { useLocalStore } from "~/store/common"

export type Context = {
	precheckId?: string
	clusterId?: string
	setPrecheckId: (id: string) => void
	showAssistant: boolean
	setShowAssistant: (show: boolean) => void
}
const AiAssistantProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
	const clusterId = useLocalStore((state) => state.clusterId)
  const [showAssistant, setShowAssistant] = useState(false)
	const [precheckId, setPrecheckId] = useState<string | undefined>(undefined)
	return (
		<AiAssistantContext.Provider value={{ clusterId, precheckId, setPrecheckId, showAssistant, setShowAssistant }}>
			{children}
		</AiAssistantContext.Provider>
	)
}

export default AiAssistantProvider
