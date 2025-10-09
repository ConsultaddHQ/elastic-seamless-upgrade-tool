import { useState, useCallback } from "react"
import ConfirmationModal from "."

export interface OpenConfirmationOptions {
	title: string
	message: string | React.ReactNode
	confirmText?: string
	cancelText?: string
	onConfirm: () => void
	Icon?: React.ElementType<{ color?: string | undefined; size?: string | number | undefined }>
}

export function useConfirmationModal() {
	const [modalOptions, setModalOptions] = useState<OpenConfirmationOptions | null>(null)

	const openConfirmation = useCallback((options: OpenConfirmationOptions) => {
		setModalOptions(options)
	}, [])

	const handleCancel = useCallback(() => {
		setModalOptions(null)
	}, [])

	const handleConfirm = useCallback(() => {
		if (modalOptions?.onConfirm) modalOptions.onConfirm()
		setModalOptions(null)
	}, [modalOptions])

	const ConfirmationModalComponent = modalOptions ? (
		<ConfirmationModal
			isOpen={true}
			title={modalOptions.title}
			message={modalOptions.message}
			confirmText={modalOptions.confirmText}
			cancelText={modalOptions.cancelText}
			onConfirm={handleConfirm}
			onCancel={handleCancel}
			Icon={modalOptions.Icon}
		/>
	) : null

	return { openConfirmation, ConfirmationModal: ConfirmationModalComponent }
}
