import { Box, Typography } from "@mui/material"
import { ArrowRight2, Convertshape2, HambergerMenu, Share } from "iconsax-react"
import { Link, Outlet, useLocation, useNavigate, useParams } from "react-router"
import { toast } from "sonner"
import { cn } from "~/lib/Utils"
import useSafeRouteStore from "~/store/safeRoutes"
import AppBreadcrumb from "~/components/utilities/AppBreadcrumb"

const getPathMetaData = (path?: string) => {
	if (path?.includes("/cluster-overview")) {
		return { label: "CLUSTER_OVERVIEW", pos: 1 }
	} else if (path?.includes("/upgrade-assistant")) {
		return { label: "UPGRADE_ASSISTANT", pos: 2 }
	}
}

const CENTER_ARROW_MIDDLE_GRADIENT = "linear-gradient(90deg, #52D97F 30%, #6B46C5 99%)"
const CENTER_ARROW_COMPLETE_GRADIENT = "linear-gradient(90deg, #52D97F 30%, #52D97F 99%)"

function ConfigLayout() {
	const { pathname } = useLocation()
	const { clusterId } = useParams()
	const navigate = useNavigate()
	const upgradeAllowed = useSafeRouteStore((state) => state.upgradeAssistAllowed)

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
		isDisabled = false,
		disabledClickEvent = () => {},
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
		isDisabled?: boolean
		disabledClickEvent?: () => void
	}) => {
		const Icon = icon
		return (
			<>
				<span
					className={cn("absolute top-0 bottom-0 right-0 left-0 cursor-pointer", {
						"pointer-events-auto": isDisabled,
					})}
					onClick={disabledClickEvent}
				/>
				<Box
					className={cn(`flex items-center p-px w-full cursor-pointer ${borderRadius} ${zIndex}`, {
						"pointer-events-none": isDisabled,
					})}
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
			</>
		)
	}

	return (
		<>
			<Box className="flex flex-col gap-[10px]" padding="0px 24px">
				<AppBreadcrumb
					items={[
						{
							label: "Cluster details",
							icon: <HambergerMenu color="currentColor" size="14px" />,
							onClick: () => navigate("/"),
						},
						{
							label: "Cluster overview",
							color: "#BDA0FF",
						},
					]}
				/>
				<Box className="flex relative bg-[#0A0A0A]">
					<GradientBox
						to={`/${clusterId}/cluster-overview`}
						icon={Share}
						title="Cluster overview"
						zIndex="z-[1]"
						isActive={getPathMetaData(pathname)?.label === "CLUSTER_OVERVIEW"}
						isCompleted={(getPathMetaData(pathname)?.pos ?? 0) > 1}
					/>
					<Box
						className="flex absolute z-10 top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2 rounded-full p-px"
						sx={{
							background:
								getPathMetaData(pathname)?.pos === 1
									? "#292929"
									: getPathMetaData(pathname)?.pos === 2
									? CENTER_ARROW_MIDDLE_GRADIENT
									: CENTER_ARROW_COMPLETE_GRADIENT,
						}}
					>
						<Box className="flex bg-neutral-950 min-w-[31px] min-h-[31px] rounded-full items-center justify-center">
							<ArrowRight2 color="#FFF" size="16px" />
						</Box>
					</Box>
					<GradientBox
						to={`/${clusterId}/upgrade-assistant`}
						icon={Convertshape2}
						title="Upgrade assistant"
						borderRadius="rounded-r-[10px]"
						zIndex="z-0"
						isActive={getPathMetaData(pathname)?.label === "UPGRADE_ASSISTANT"}
						isCompleted={(getPathMetaData(pathname)?.pos ?? 0) > 2}
						isDisabled={!upgradeAllowed}
						disabledClickEvent={() => toast.info("Please select update available to access the page.")}
					/>
				</Box>
			</Box>
			<Outlet />
		</>
	)
}

export default ConfigLayout
