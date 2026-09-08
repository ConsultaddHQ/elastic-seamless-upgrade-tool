import { Modal, ModalContent, ModalBody, Button, Chip } from "@heroui/react"
import { DocumentUpload, ArrowRight } from "iconsax-react"
import { VscFileSubmodule } from "react-icons/vsc"
import { RxCross1 } from "react-icons/rx"
import { useRef, useState, useEffect } from "react"
import type { LicenseModel } from "~/apis/LicenseApi/types"
import LicenseApi from "~/apis/LicenseApi/LicenseApi"

interface Props {
	isOpen: boolean
	onOpenChange: (isOpen: boolean) => void
	onSuccess?: () => void // Optional callback to refresh data in parent
}

export default function LicenseModal({ isOpen, onOpenChange, onSuccess }: Props) {
	const [file, setFile] = useState<File | null>(null)
	const [isLoading, setIsLoading] = useState(false)
	const [licenseData, setLicenseData] = useState<LicenseModel | null>(null)
	const fileInputRef = useRef<HTMLInputElement>(null)

	// Fetch current license when modal opens
	useEffect(() => {
		if (isOpen) {
			fetchCurrentLicense()
		} else {
			// Reset state when closed
			setFile(null)
			setIsLoading(false)
		}
	}, [isOpen])

	const fetchCurrentLicense = async () => {
		try {
			const data = await LicenseApi.getCurrentLicense()
			setLicenseData(data)
		} catch (error) {
			console.error("Failed to fetch current license", error)
		}
	}

	// Handlers
	const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
		if (e.target.files && e.target.files.length > 0) {
			setFile(e.target.files[0])
		}
	}

	const triggerFilePicker = () => fileInputRef.current?.click()

	const handleDrop = (e: React.DragEvent) => {
		e.preventDefault()
		if (e.dataTransfer.files && e.dataTransfer.files[0]) {
			setFile(e.dataTransfer.files[0])
		}
	}

	const handleActivate = async () => {
		if (!file) return

		setIsLoading(true)
		try {
			await LicenseApi.activateLicense(file)

			// Refresh local data to show new status
			await fetchCurrentLicense()

			// Optional: call onSuccess to update parent component state
			if (onSuccess) onSuccess()

			// Optional: close modal on success
			// onOpenChange(false)
		} catch (error) {
			console.error("Failed to activate license", error)
			// Ideally, add a toast notification here to tell the user it failed
		} finally {
			setIsLoading(false)
			setFile(null) // Clear file after attempt
		}
	}

	// Derived State
	const status = licenseData?.status || "INACTIVE"
	const expiryDate = licenseData?.payload?.expiryDate || "Not available"
	const isActive = status === "ACTIVE"

	return (
		<Modal
			isOpen={isOpen}
			onOpenChange={onOpenChange}
			hideCloseButton
			size="xl"
			classNames={{
				base: "bg-[#0D0D0D] border border-[#3A3544] rounded-[24px] max-w-[520px]",
				backdrop: "bg-black/60 backdrop-blur-md",
			}}
		>
			<ModalContent>
				{(onClose) => (
					<ModalBody className="p-8">
						{/* Hidden File Input */}
						<input
							type="file"
							ref={fileInputRef}
							onChange={handleFileChange}
							className="hidden"
							accept=".txt,.lic,.json,.key"
						/>

						{/* Header */}
						<div className="flex justify-between items-center mb-2">
							<h2 className="text-xl font-semibold text-white">Activate license</h2>
							<Button isIconOnly variant="light" onPress={onClose} className="text-[#A9AAB6] min-w-8 h-8">
								<RxCross1 size={20} />
							</Button>
						</div>

						<p className="text-[#A9AAB6] text-sm mb-8">
							If you have a license key for this product, please enter it below to activate the software.
						</p>

						{/* Status Info */}
						<div className="flex gap-10 mb-8">
							<div className="flex items-center gap-2">
								<span className="text-[#A9AAB6] text-sm">Status:</span>
								<Chip
									variant="flat"
									size="sm"
									classNames={{
										base: isActive ? "bg-[#384F45]" : "bg-[#623834]",
										content: isActive ? "text-[#4CDB9D]" : "text-[#E75547]",
									}}
									startContent={
										<div
											className={`w-1.5 h-1.5 rounded-full ${
												isActive ? "bg-[#4CDB9D]" : "bg-[#E75547]"
											}`}
										/>
									}
								>
									{status}
								</Chip>
							</div>
							<div className="flex items-center gap-2">
								<span className="text-[#A9AAB6] text-sm">Expires:</span>
								<span className="text-white text-sm font-medium">{expiryDate}</span>
							</div>
						</div>

						{/* Upload Area */}
						<div
							onClick={triggerFilePicker}
							onDragOver={(e) => e.preventDefault()}
							onDrop={handleDrop}
							className="group relative flex flex-col items-center justify-center border-2 border-dashed border-[#3A3544] rounded-2xl pt-8 p-2 bg-[#161616]/50 hover:bg-[#161616] hover:border-[#4CDB9D]/50 transition-all cursor-pointer"
						>
							<div className="w-12 h-12 rounded-xl bg-[#252525] flex items-center justify-center mb-4">
								<VscFileSubmodule className={file ? "text-[#4CDB9D]" : "text-[#A9AAB6]"} size={24} />
							</div>
							<p className="text-center text-[#A9AAB6] text-sm mb-4">
								{file ? (
									<span className="text-[#4CDB9D] font-medium">Selected: {file.name}</span>
								) : (
									<>
										Drag and drop your license key document here, or
										<br />
										click to upload.
									</>
								)}
							</p>
							<Button
								variant="bordered"
								className="w-full border-[#3c2d5b] text-white gap-2 font-normal"
								endContent={<DocumentUpload size="20px" color="currentColor" />}
								onPress={triggerFilePicker}
							>
								{file ? "Change file" : "Upload file"}
							</Button>
						</div>

						{/* Main Action */}
						<Button
							isLoading={isLoading}
							isDisabled={!file || isLoading}
							className={`w-full mt-8 font-semibold h-12 rounded-xl text-md transition-colors ${
								file ? "bg-white text-black" : "bg-slate-700 text-slate-400 cursor-not-allowed"
							}`}
							endContent={!isLoading && <ArrowRight size="20px" color="currentColor" />}
							onPress={handleActivate}
						>
							{isActive ? "Renew license" : "Activate license"}
						</Button>
					</ModalBody>
				)}
			</ModalContent>
		</Modal>
	)
}
