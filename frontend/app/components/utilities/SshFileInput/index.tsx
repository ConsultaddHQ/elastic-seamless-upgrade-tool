import { Box, IconButton, Typography } from "@mui/material"
import Files from "react-files"
import { DocumentText1, DocumentUpload, Trash } from "iconsax-react"
import { useState } from "react"

export interface SshFileInputProps {
	onSshKeyChange: (key: string | null) => void
	sshKey: string | null
	error: any | null
}

function SelectedSshFile({ name, onDelete }: { name: string; onDelete: () => void }) {
	return (
		<Box
			className="flex flex-row w-full gap-3 justify-between items-center border border-solid border-[#1F1F1F] rounded-[9px] h-[42px]"
			padding="12px 6px 14px 14px"
		>
			<Box className="flex flex-row gap-[10px] items-center">
				<DocumentText1 color="#6B6B6B" size="16px" />
				<Typography color="#ADADAD" fontSize="12px" fontWeight="500" lineHeight="normal">
					{name}
				</Typography>
			</Box>
			<IconButton onClick={() => {}} sx={{ padding: "8px", borderRadius: "6px" }} onClickCapture={onDelete}>
				<Trash color="#EC7070" size="14px" />
			</IconButton>
		</Box>
	)
}

function SshFileInput({ onSshKeyChange, sshKey, error }: SshFileInputProps) {
	const [selectedFile, setSelectedFile] = useState(sshKey)
	const [fileName, setFileName] = useState("ssh.pem")

	return (
		<>
			<Typography color="#ABA9B1" fontSize="14px" fontWeight="400" lineHeight="20px">
				SSH Private file
			</Typography>
			{selectedFile ? (
				<SelectedSshFile
					name={fileName}
					onDelete={() => {
						setSelectedFile(null)
						onSshKeyChange(null)
					}}
				/>
			) : (
				<Files
					className="files-dropzone"
					onChange={async (files: File[]) => {
						if (files.length == 1) {
							const key = await files[0].text()
							onSshKeyChange(key)
							setSelectedFile(key)
							setFileName(files[0].name)
						} else {
							onSshKeyChange(null)
						}
					}}
					maxFileSize={10000000}
					minFileSize={0}
					clickable
				>
					<Box
						className={`flex flex-col gap-2 items-center w-full justify-center h-[104px] rounded-xl cursor-pointer border border-dashed ${
							error ? "border-[rgb(239,68,1)]" : "border-[#3D3B42]"
						} bg-neutral-950 hover:border-[#C8BDE4]`}
						sx={{
							":hover": {
								boxShadow: "0px 0px 13px 2px rgba(127, 79, 240, 0.26)",
								transition: "all 0.5s",
								"& > #drag-drop-icon": {
									color: "#FFF !important",
									transition: "color 0.5s",
								},
								"& #drag-drop-label": {
									color: "#FFF !important",
									transition: "color 0.5s",
								},
							},
						}}
					>
						<span id="drag-drop-icon" style={{ color: "#ABA9B1" }}>
							<DocumentUpload size="24px" color="currentColor" />
						</span>
						<Box className="flex flex-col">
							<Typography
								id="drag-drop-label"
								color="#6C6B6D"
								textAlign="center"
								fontSize="14px"
								fontWeight="400"
								lineHeight="20px"
							>
								Drag or click to upload ssh private file
							</Typography>
							<Typography
								color="#6C6B6D"
								textAlign="center"
								fontSize="14px"
								fontWeight="400"
								lineHeight="20px"
							>
								Supported formats: .pem
							</Typography>
						</Box>
					</Box>
				</Files>
			)}
			{error && (
				<Typography fontSize="12px" fontWeight={400} lineHeight="20px" color="#ef4444">
					{error}
				</Typography>
			)}
		</>
	)
}

export default SshFileInput
