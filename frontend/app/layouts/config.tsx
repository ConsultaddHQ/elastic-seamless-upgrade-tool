import { useDisclosure } from "@heroui/react"
import { Box, Typography } from "@mui/material"
import { ArrowRight2, Convertshape2, Magicpen, Share } from "iconsax-react"
import { useState } from "react"
import { Link, Outlet, useLocation } from "react-router"
import UpcomingFeature from "~/components/core/UpcomingFeature"
import { OutlinedBorderButton } from "~/components/utilities/Buttons"
import AssetsManager from "~/constants/AssetsManager"

const PATH_META_DATA: { [key: string]: { label: string; pos: number } } = {
	"/cluster-overview": { label: "CLUSTER_OVERVIEW", pos: 1 },
	"/upgrade-assistant": { label: "UPGRADE_ASSISTANT", pos: 2 },
}

const CENTER_ARROW_MIDDLE_GRADIENT = "linear-gradient(90deg, #52D97F 30%, #6B46C5 99%)"
const CENTER_ARROW_COMPLETE_GRADIENT = "linear-gradient(90deg, #52D97F 30%, #52D97F 99%)"

function ConfigLayout() {
	const { pathname } = useLocation()
	const { isOpen, onOpen, onOpenChange } = useDisclosure()

	const GradientBox = ({
		to,
		boxShadow = "0px 0px 12px 1px rgba(118, 70, 233, 0.41)",
		iconGradient = "linear-gradient(137deg, #1D1D1D 6.95%, #6E687C 36.4%, #1D1D1D 92.32%)",
		iconActiveGradient = "linear-gradient(135deg, #6627FF 2.29%, #C9C0DF 44.53%, #131315 97.18%, #131315 97.18%)",
		iconCompletedGradient = "linear-gradient(135deg, #27A56A 2.29%, #C0DFCF 44.53%, #131514 97.18%, #131514 97.18%)",
		boxActiveGradient = "linear-gradient(103deg, #6B46C5 3.33%, #C8BDE4 47.06%, #302744 97.35%)",
		boxCompletedGradient = "linear-gradient(103deg, #46C581 3.33%, #BDE4CF 47.06%, #274434 97.35%)",
		isActive = false,
		isCompleted = false,
		icon,
		title,
		borderRadius = "rounded-l-[10px]",
		zIndex = "1",
	}: {
		to: string
		boxShadow?: string
		iconGradient?: string
		iconActiveGradient?: string
		iconCompletedGradient?: string
		boxActiveGradient?: string
		boxCompletedGradient?: string
		isActive?: boolean
		isCompleted?: boolean
		icon: React.FunctionComponent<{ size: string; color: string }>
		title: string
		borderRadius?: string
		zIndex?: string
	}) => {
		const Icon = icon
		return (
			<Box
				className={`flex items-center p-px w-full cursor-pointer ${borderRadius} ${zIndex}`}
				component={Link}
				to={to}
				sx={{
					background: isActive ? boxActiveGradient : isCompleted ? boxCompletedGradient : "#292929",
					boxShadow: isActive ? boxShadow : "none",
					":hover": {
						background: isCompleted ? boxCompletedGradient : boxActiveGradient,
						boxShadow: isCompleted ? "none" : boxShadow,
						"& #icon-container": {
							background: `${isCompleted ? iconCompletedGradient : iconActiveGradient} !important`,
						},
					},
				}}
			>
				<Box
					className={`flex items-center gap-[20px] bg-neutral-950 w-full ${borderRadius}`}
					padding="23px 20px 23px 24px"
				>
					<Box
						id="icon-container"
						className="flex rounded-[10px] p-px"
						sx={{
							background: isActive
								? iconActiveGradient
								: isCompleted
								? iconCompletedGradient
								: iconGradient,
						}}
					>
						<Box className="flex items-center justify-center w-[44px] h-[44px] min-w-[44px] min-h-[43px] bg-neutral-950 rounded-[10px]">
							<Icon size="20px" color="#FFF" />
						</Box>
					</Box>
					<Typography color="#FFF" fontSize="20px" fontWeight="600" lineHeight="22px">
						{title}
					</Typography>
				</Box>
			</Box>
		)
	}

	return (
		<Box className="flex flex-col w-full" height="var(--window-height)">
			<Box className="flex flex-row gap-2 justify-between bg-[#0A0A0A]" padding="16px 32px 10px 40px" zIndex={isOpen ? "99999": "0"}>
				<img src={AssetsManager.LOGO_PLUS_NAMED} width="161.6px" height="36px" />
				<OutlinedBorderButton
					icon={Magicpen}
					filledIcon={Magicpen}
					iconProps={{ variant: "Bold" }}
					sx={{ ":hover": { color: "#F5BE3D !important" } }}
					gradient="linear-gradient(135deg,#E0B517 2.29%, #DFD8C0 44.53%, #151413 97.18%, #151413 97.18%)"
					boxShadow="0px 0px 19px 2px rgba(234, 180, 63, 0.41)"
					borderRadius="50px"
					onClick={onOpen}
				>
					Upcoming features
				</OutlinedBorderButton>
			</Box>
			<UpcomingFeature isOpen={isOpen} onOpenChange={onOpenChange} />
			<Box className="flex relative" padding="0px 24px">
				<GradientBox
					to="/cluster-overview"
					icon={Share}
					title="Cluster overview"
					zIndex="z-[1]"
					isActive={PATH_META_DATA[pathname].label === "CLUSTER_OVERVIEW"}
					isCompleted={PATH_META_DATA[pathname].pos > 1}
				/>
				<Box
					className="flex absolute z-10 top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2 rounded-full p-px"
					sx={{
						background:
							PATH_META_DATA[pathname].pos === 1
								? "#292929"
								: PATH_META_DATA[pathname].pos === 2
								? CENTER_ARROW_MIDDLE_GRADIENT
								: CENTER_ARROW_COMPLETE_GRADIENT,
					}}
				>
					<Box className="flex bg-neutral-950 min-w-[31px] min-h-[31px] rounded-full items-center justify-center">
						<ArrowRight2 color="#FFF" size="16px" />
					</Box>
				</Box>
				<GradientBox
					to="/upgrade-assistant"
					icon={Convertshape2}
					title="Upgrade assistant"
					borderRadius="rounded-r-[10px]"
					zIndex="z-0"
					isActive={PATH_META_DATA[pathname].label === "UPGRADE_ASSISTANT"}
					isCompleted={PATH_META_DATA[pathname].pos > 2}
				/>
			</Box>
			<Outlet />
		</Box>
	)
}

export default ConfigLayout
