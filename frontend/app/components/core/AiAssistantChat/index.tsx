import React, { type ChangeEvent, createContext, type KeyboardEvent, useEffect, useRef, useState } from "react"
import { Box, LinearProgress, Paper, Typography } from "@mui/material"
import { CloseCircle, MagicStar } from "iconsax-react"
import Input from "~/components/utilities/Input"
import axiosJSON from "~/apis/http.ts"
import ReactMarkdown from "react-markdown"
import { useMutation } from "@tanstack/react-query"
import type { Context } from "./AiAssistantProvider"

export const AiAssistantContext = createContext<Context>({} as Context)

interface AiAssistantChatProps {}

const AiAssistantChat: React.FC<AiAssistantChatProps> = () => {
	const { setShowAssistant, clusterId, precheckId } = React.useContext(AiAssistantContext)

	const [messages, setMessages] = useState<Message[]>([])
	const [input, setInput] = useState<string>("")
	const messagesEndRef = useRef<HTMLDivElement>(null)

	// Auto-scroll to latest message
	useEffect(() => {
		messagesEndRef.current?.scrollIntoView({ behavior: "smooth" })
	}, [messages])

	const { mutate: sendMessage, isPending } = useMutation({
		mutationKey: ["ai-assistant-message"],
		mutationFn: async (message: string) => {
			const response = await axiosJSON.post(
				"/ai-assistant/ask",
				{
					message,
					context: {
						clusterId,
						precheckId,
					},
				},
				{ timeout: 1000 * 60 * 60 }
			)
			return response.data
		},
		onSuccess: (data) => {
			setMessages((prev) => [...prev, { role: "ai", text: data }])
		},
	})

	const handleInputChange = (e: ChangeEvent<HTMLInputElement>) => setInput(e.target.value)

	const handleKeyDown = (e: KeyboardEvent<HTMLInputElement>) => {
		if (e.key === "Enter" && input.trim()) {
			sendMessage(input)
			setMessages((prev) => [...prev, { role: "user", text: input }])
			setInput("")
		}
	}

	return (
		<Box className="flex flex-col h-full rounded-2xl border border-[#3A3544]">
			{/* Header */}
			<Box className="flex items-center justify-between p-2 border-b border-gray-800">
				<div className="flex items-center gap-1">
					<Typography variant="h6" className="text-white">
						AI Assistant
					</Typography>
					<MagicStar color="#BDA0FF" size="14px" />
				</div>

				<CloseCircle
					color="currentColor"
					size={18}
					className="cursor-pointer"
					onClick={() => setShowAssistant(false)}
				/>
			</Box>

			{/* Messages */}
			<Box
				sx={{
					flex: 1, // take remaining space
					minHeight: 0, // allow proper shrinking in flex layouts
					overflowY: "auto", // scroll when overflow
					display: "flex",
					flexDirection: "column",
					gap: 1.5,
					p: 2,
				}}
			>
				{messages.map((msg, idx) => (
					<Box
						key={idx}
						sx={{
							alignSelf: msg.role === "user" ? "flex-end" : "flex-start",
							bgcolor: msg.role === "user" ? "#303030" : "transparent",
							color: "white",
							p: 1.5,
							borderRadius: 2,
							maxWidth: msg.role === "user" ? "80%" : "100%",
							fontSize: "12px",
						}}
					>
						<ReactMarkdown>{msg.text}</ReactMarkdown>
					</Box>
				))}
				<div ref={messagesEndRef} />
			</Box>

			{isPending && <LinearProgress sx={{ background: "#BDA0FF" }} />}

			{/* Input */}
			<Box className="flex flex-row items-center gap-[6px] px-2 py-2">
				<Input
					fullWidth
					value={input}
					onChange={handleInputChange}
					onKeyDown={handleKeyDown}
					disabled={isPending}
					placeholder="Ask AI..."
					variant="outlined"
				/>
			</Box>
		</Box>
	)
}

export default AiAssistantChat
