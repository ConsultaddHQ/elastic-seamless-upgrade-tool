import { Box } from "@mui/material"
import React from "react"
import AiAssistantChat, { AiAssistantContext } from "~/components/core/AiAssistantChat"

function AiAssistantLayout({ children }: { children: React.ReactNode }) {
	const { showAssistant } = React.useContext(AiAssistantContext)
	return (
		<Box className="flex flex-row w-full h-full">
			<Box className="flex-1 h-full overflow-auto">{children}</Box>
			{showAssistant && (
				<Box className="w-[460px] border-l border-solid border-[#3A3544] h-[100vh] p-2 flex flex-col">
					<AiAssistantChat />
				</Box>
			)}
		</Box>
	)
}

export default AiAssistantLayout
