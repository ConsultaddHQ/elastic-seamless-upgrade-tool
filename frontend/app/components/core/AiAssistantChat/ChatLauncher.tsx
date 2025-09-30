import React, { useContext } from "react"
import { Box, Fab } from "@mui/material"
import { AiAssistantContext } from "./"
import { Magicpen } from "iconsax-react"

interface AiAssistantChatProps {}
const AiChatLauncher: React.FC<AiAssistantChatProps> = () => {
	const { setShowAssistant, showAssistant } = useContext(AiAssistantContext)
	if (showAssistant) return null
	return (
		<Box sx={{ position: "relative" }}>
			{/* Floating button */}
			<Fab
				onClick={() => setShowAssistant(!showAssistant)}
				size="small"
				sx={{
					position: "absolute",
					bottom: 8,
					right: 8,
					zIndex: 20,
					backgroundColor: "transparent",
				}}
			>
				<Box className="rounded-full p-3 bg-white/10">
					<Magicpen color="#BDA0FF" size="24px" />
				</Box>
			</Fab>
		</Box>
	)
}

export default AiChatLauncher
