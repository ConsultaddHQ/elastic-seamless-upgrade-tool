import { Editor, type OnMount } from "@monaco-editor/react"
import React, { useRef } from "react"
import { Box } from "@mui/material"
import { Skeleton } from "@heroui/react"

function Loading() {

	return (
		<Box className="flex flex-col w-full gap-2 ">
			{
				new Array(15).fill(0).map(()=>(
					<Skeleton className="rounded-lg">
						<Box height="80px"></Box>
					</Skeleton>
				))
			}
		</Box>
	)
}
const YamlEditor = ({
	value,
	onChange,
	onMount,
	language,
	readOnly = false,
	isLoading = false,
}: {
	value?: string | undefined
	onChange?: (value: string | undefined) => void
	onMount?: OnMount
	language: string
	readOnly?: boolean
	isLoading?: boolean
}) => {
	const editorRef = useRef<any>(null)
	const handleEditorDidMount: OnMount = (editor, monaco) => {
		editorRef.current = editor
		monaco.editor.defineTheme("custom-dark", {
			base: "vs-dark",
			inherit: true,
			rules: [
				{ token: "comment", foreground: "7aa2f7", fontStyle: "italic" },
				{ token: "string", foreground: "9ece6a" },
				{ token: "number", foreground: "f7768e" },
				{ token: "keyword", foreground: "bb9af7", fontStyle: "bold" },
			],
			colors: {
				"editor.background": "#0A0A0A",
				"editor.lineHighlightBackground": "#0A0A0A",
				"editorCursor.foreground": "#FFFFFF",
				"editorLineNumber.foreground": "#FFFFFF",
				"editor.selectionBackground": "#FFFFFF6B",
			},
		})

		monaco.editor.setTheme("custom-dark")
		onMount && onMount(editor, monaco)
	}
	if (isLoading) {
		return <Loading />
	}
	return (
		<Editor
			onMount={handleEditorDidMount}
			height="auto"
			language={language}
			width={"100%"}
			theme="custom-dark"
			value={value}
			options={{
				fontSize: 13,
				scrollBeyondLastLine: false,
				automaticLayout: true,
				readOnly: readOnly,
				contextmenu: false,
			}}
			onChange={onChange}
		/>
	)
}

export default YamlEditor
