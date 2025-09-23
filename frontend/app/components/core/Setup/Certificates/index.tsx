import { Box, IconButton, Typography } from "@mui/material"
import { ArrowLeft, ArrowRight, DocumentText1, DocumentUpload, Trash } from "iconsax-react"
import { useState } from "react"
// @ts-ignore-block
import Files from "react-files"
import { toast } from "sonner"
import { ConatinedButton, OutlinedButton } from "~/components/utilities/Buttons"
import StringManager from "~/constants/StringManager"

function Certificates({ backStep, onSubmit, isSubmitting }: TCertificateComp) {
	const [certFiles, setCertFiles] = useState<File[]>([])

	const handleChange = (fn: React.Dispatch<React.SetStateAction<File[]>>, files: File[]) => {
		fn((prevFiles: any) => [...prevFiles, ...files])
	}

	const handleError = (error: any, file: File) => {
		toast.error(error.message ?? StringManager.GENERIC_ERROR)
	}

	const handleDelete = (fn: React.Dispatch<React.SetStateAction<File[]>>, file: File, index: number) => {
		fn((prevFiles) => [...prevFiles.slice(0, index), ...prevFiles.slice(index + 1, prevFiles.length)])
	}

	const handleSubmit = () => {
		onSubmit({ certFiles: certFiles })
	}

	return (
		<Box
			className="flex flex-col gap-3 justify-between w-full"
			height={{
				xs: "calc(var(--window-height) - 346px)",
				sm: "calc(var(--window-height) - 280px)",
				md: "calc(var(--window-height) - 280px)",
			}}
		>
			<Box className="flex flex-col gap-[6px] max-w-[515px]">
				<Typography fontSize="14px" fontWeight={400} lineHeight="20px" color="#ABA9B1">
					Certificates (Optional)
				</Typography>
				<Files
					className="files-dropzone"
					onChange={(files: File[]) => handleChange(setCertFiles, files)}
					onError={handleError}
					accepts={[".crt"]}
					multiple
					maxFileSize={10000000}
					minFileSize={0}
					clickable
				>
					<Box
						className="flex flex-col gap-2 items-center w-full justify-center h-[104px] rounded-xl cursor-pointer border border-dashed border-[#3D3B42] bg-neutral-950 hover:border-[#C8BDE4]"
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
								Drag or click to upload file
							</Typography>
							<Typography
								color="#6C6B6D"
								textAlign="center"
								fontSize="14px"
								fontWeight="400"
								lineHeight="20px"
							>
								Supported formats: .crt
							</Typography>
						</Box>
					</Box>
				</Files>
				<Box
					className="flex flex-col gap-[6px] mb-2 mt-2 overflow-auto"
					height="220px"
					sx={{
						"::-webkit-scrollbar": {
							width: "5px",
						},
						"::-webkit-scrollbar-thumb": { background: "#C8BDE4", borderRadius: "10px" },
					}}
				>
					{certFiles.map((file, index) => {
						return (
							<Box
								key={index}
								className="flex flex-row w-full gap-3 justify-between items-center border border-solid border-[#1F1F1F] rounded-[9px] h-[42px]"
								padding="12px 6px 14px 14px"
							>
								<Box className="flex flex-row gap-[10px] items-center">
									<DocumentText1 color="#6B6B6B" size="16px" />
									<Typography color="#ADADAD" fontSize="12px" fontWeight="500" lineHeight="normal">
										{file.name}
									</Typography>
								</Box>
								<IconButton
									onClick={() => {}}
									sx={{ padding: "8px", borderRadius: "6px" }}
									onClickCapture={() => handleDelete(setCertFiles, file, index)}
								>
									<Trash color="#EC7070" size="14px" />
								</IconButton>
							</Box>
						)
					})}
				</Box>
			</Box>
			<Box className="flex justify-end gap-2">
				<OutlinedButton onClick={backStep}>
					<ArrowLeft size="20px" color="currentColor" /> Back
				</OutlinedButton>
				<ConatinedButton onClick={handleSubmit} disabled={isSubmitting}>
					{isSubmitting ? "Submitting" : "Continue"} <ArrowRight size="20px" color="currentColor" />
				</ConatinedButton>
			</Box>
		</Box>
	)
}

export default Certificates
