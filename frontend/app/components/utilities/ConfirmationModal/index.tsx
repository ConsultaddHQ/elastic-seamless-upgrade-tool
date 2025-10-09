import { Modal, ModalContent, ModalHeader, ModalBody, Button } from "@heroui/react"
import { Typography, Box } from "@mui/material"
import { ArrowRight } from "iconsax-react"

export interface ConfirmationModalProps {
	isOpen: boolean
	title: string
	message: string | React.ReactNode
	confirmText?: string
	cancelText?: string
	onConfirm: () => void
	onCancel: () => void
	Icon?: React.ElementType<{ color?: string | undefined; size?: string | number | undefined }>
}

function ConfirmationModal({
	isOpen,
	title,
	message,
	confirmText = "Confirm",
	cancelText = "Cancel",
	onConfirm,
	onCancel,
	Icon,
}: ConfirmationModalProps) {
	return (
		<>
			<Modal isOpen={isOpen} closeButton={<></>}>
				<ModalContent
					className="w-96 p-6 bg-[#212022] rounded-3xl outline outline-1 outline-offset-[-1px] outline-zinc-600 inline-flex flex-col justify-start items-center overflow-hidden"
					style={{
						border: "1px solid #615D6A",
						borderRadius: "24px",
						backgroundColor: "#212022",
					}}
				>
					{() => (
						<>
							{Icon && (
								<Box className="rounded-full bg-[#292929] p-[16px]">
									<Icon color="#98959E" size={"32px"} />
								</Box>
							)}
							<ModalHeader className="flex flex-col gap-1 pb-0">
								<Typography color="#FFFFFF" fontSize="18px" fontWeight="600" lineHeight="26px">
									{title}
								</Typography>
							</ModalHeader>
							<ModalBody className="p-0">
								{typeof message === "string" ? (
									<Typography
										color="#ADADAD"
										fontSize="16px"
										fontWeight="500"
										lineHeight="22px"
										align="center"
										className="w-full"
										fontStyle={"Figtree"}
									>
										{message}
									</Typography>
								) : (
									message
								)}
							</ModalBody>
							<Box className="w-full flex flex-row gap-[8px] mt-6">
								<Box className="flex flex-1">
									<Button
										color="primary"
										onPress={onCancel}
										className="bg-[#0F0F0F] w-full border-[#FFFFFF] border-[1px]"
									>
										{cancelText}
									</Button>
								</Box>
								<Box className="flex flex-1 ">
									<Button
										color="primary"
										onPress={onConfirm}
										className="bg-white w-full text-[#0A0A0A]"
									>
										{confirmText} <ArrowRight color="#0A0A0A" size={16} />
									</Button>
								</Box>
							</Box>
						</>
					)}
				</ModalContent>
			</Modal>
		</>
	)
}

export default ConfirmationModal
export { useConfirmationModal } from "./useConfirmationModal"
