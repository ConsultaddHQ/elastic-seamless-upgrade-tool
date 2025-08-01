import { addToast, Button, Divider, ToastProvider, useDisclosure } from "@heroui/react"
import { Box, Typography } from "@mui/material"
import { Edit, Magicpen, Refresh2, Setting2, TickCircle, Warning2 } from "iconsax-react"
import { useEffect } from "react"
import { FiArrowUpRight, FiX } from "react-icons/fi"
import { Link, Outlet, useLocation } from "react-router"
import EditCluster from "~/components/core/EditCluster"
import Settings from "~/components/core/Settings"
import UpcomingFeature from "~/components/core/UpcomingFeature"
import AssetsManager from "~/constants/AssetsManager"
import { cn } from "~/lib/Utils"
import { useSocketStore } from "~/store/socket"

function Common() {
	const { socket, connect, disconnect } = useSocketStore()
	const { isOpen, onOpen, onOpenChange } = useDisclosure()
	const { isOpen: isSettingsOpen, onOpen: onSettingsOpen, onOpenChange: onSettingsOpenChange } = useDisclosure()
	const { isOpen: isEditOpen, onOpen: onEditOpen, onOpenChange: onEditOpenChange } = useDisclosure()
	const { pathname } = useLocation()

	useEffect(() => {
		connect() // Connect on mount

		return () => {
			disconnect() // Disconnect on unmount
		}
	}, [connect, disconnect])

	useEffect(() => {
		if (!socket) return

		const listner = (message: any) => {
			addToast({
				title: message.title,
				description: message.message,
				classNames: {
					base: cn(
						[
							"flex flex-col gap-[6px] items-start bg-[linear-gradient(88deg,_rgba(61,59,68,0.2)_1.02%,_rgba(71,67,81,0.2)_98.21%)] p-3 border border-solid",
						],
						{
							"border-[#384F45]": message.notificationType === "SUCCESS",
							"border-[#623834]": message.notificationType === "ERROR",
							"border-[#4F422A]": message.notificationType === "WARNING",
						}
					),
					content: "items-start",
					closeButton: "size-6 opacity-100 absolute right-2 top-5 -translate-y-1/2",
				},
				closeIcon: <FiX size="24px" />,
				icon:
					message.notificationType === "SUCCESS" ? (
						<TickCircle variant="Bold" color="#4CDB9D" size="20px" />
					) : message.notificationType === "ERROR" ? (
						<Warning2 variant="Bold" color="#E75547" size="20px" />
					) : (
						<Refresh2 variant="Bold" color="#F4B82C" size="20px" />
					),
				endContent: message?.link ? (
					<Typography
						component={Link}
						to={message.link}
						className="pl-10 flex items-center"
						color="#A9AAB6"
						lineHeight="16px"
						fontSize="12px"
						fontWeight="400"
					>
						Go to node <FiArrowUpRight size="16px" />
					</Typography>
				) : null,
			})
		}
		socket.on("NOTIFICATION", listner)

		return () => {
			socket.off("NOTIFICATION", listner)
		}
	}, [socket])

	// const [headerIndexChange, setHeaderIndexChange] = useState<boolean>(false)

	// useMemo(() => {
	// 	const timeout = !(isOpen || isEditOpen) ? 150 : 0
	// 	const changeState = () => {
	// 		setHeaderIndexChange(isOpen || isEditOpen)
	// 	}
	// 	setTimeout(() => {
	// 		changeState()
	// 	}, timeout)
	// }, [isOpen, isEditOpen])

	return (
		<Box className="flex flex-col w-full pb-4 bg-[#0A0A0A]" height="var(--window-height)">
			<ToastProvider placement="bottom-right" />
			<Box
				className="flex flex-row gap-2 justify-between bg-[#0A0A0A]"
				padding="16px 30px 10px 40px"
				zIndex="99999"
			>
				<img src={AssetsManager.LOGO_PLUS_NAMED} width="161.6px" height="36px" />
				<Box className="flex flex-row max-h-11 items-center border border-solid border-[#3A3544] rounded-lg overflow-hidden">
					{pathname !== "/" ? (
						<>
							<Button
								isIconOnly
								aria-label="Settings"
								variant="light"
								radius="none"
								className="min-w-11 min-h-11"
								onPress={onEditOpen}
							>
								<Edit color="currentColor" size="20px" />
							</Button>
							<Divider orientation="vertical" className="bg-[#3A3544]" />
							<Button
								isIconOnly
								aria-label="Settings"
								variant="light"
								radius="none"
								className="min-w-11 min-h-11"
								onPress={onSettingsOpen}
							>
								<Setting2 color="currentColor" size="20px" />
							</Button>
							<Divider orientation="vertical" className="bg-[#3A3544]" />
						</>
					) : null}
					<Button
						aria-label="Settings"
						variant="light"
						radius="none"
						className="min-w-11 min-h-11"
						onPress={onOpen}
					>
						<Magicpen variant="Bold" color="currentColor" size="20px" /> Upcoming features
					</Button>
				</Box>
			</Box>
			<EditCluster isOpen={isEditOpen} onOpenChange={onEditOpenChange} />
			<UpcomingFeature isOpen={isOpen} onOpenChange={onOpenChange} />
			<Settings isOpen={isSettingsOpen} onOpenChange={onSettingsOpenChange} />
			<Outlet />
		</Box>
	)
}

export default Common
