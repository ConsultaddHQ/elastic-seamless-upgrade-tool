import { Box, Menu, MenuItem } from "@mui/material"
import { ArrowDown2 } from "iconsax-react"
import PopupState, { bindMenu, bindTrigger } from "material-ui-popup-state"
import { OutlinedBorderButton } from "~/components/utilities/Buttons"
import { OneLineSkeleton } from "~/components/utilities/Skeletons"
import { useMutation, useQuery } from "@tanstack/react-query"
import axiosJSON from "~/apis/http"
import useSafeRouteStore from "~/store/safeRoutes"
import { useEffect } from "react"
import { useNavigate, useParams } from "react-router"

const STYLES = {
	MENU_ITEMS: {
		transition: "all 800ms",
		borderRadius: "6px",
		marginTop: "3px",
		padding: "6px 14px",
		color: "#898484",
		fontSize: "13px",
		fontWeight: "500",
		lineHeight: "20px",
	},
	MENU_PAPER: {
		style: {
			padding: "0px 6px",
			width: "156.73px",
			borderRadius: "8px",
			border: "1px solid #292929",
			background: "#121212",
		},
	},
	MENU_ROOT: {
		style: {
			top: "5px",
		},
	},
}

function TargetVersionDropdown() {
	const { clusterId } = useParams()
	const setUpgradeAssistAllowed = useSafeRouteStore((state) => state.setUpgradeAssistAllowed)
	const navigate = useNavigate()

	const { data, isLoading, isRefetching , refetch} = useQuery({
		queryKey: ["get-target-version-info"],
		queryFn: async () => {
			const response = await axiosJSON.get(`/clusters/${clusterId}/upgrades/jobs/target-version`)
			const data = response.data
			setUpgradeAssistAllowed(data?.targetVersion)
			return data
		},
		staleTime: Infinity,
		enabled: false,
	})

	const handleVersionSelect = async (ver: string) => {
		const response = await axiosJSON.post(`/clusters/${clusterId}/upgrades/jobs`, { targetVersion: ver })
		const data = response.data
		setUpgradeAssistAllowed(data?.targetVersion)
		navigate(`/${clusterId}/upgrade-assistant`)
	}

	const { mutate: HandleVersion, isPending } = useMutation({
		mutationKey: ["version-select"],
		mutationFn: handleVersionSelect,
	})
	useEffect(() => {
		refetch()
	}, [])

	return (
		<OneLineSkeleton
			className="rounded-[10px] max-w-[250px] w-[154px]"
			show={isLoading || isRefetching}
			component={
				<PopupState variant="popover" popupId="demo-popup-menu">
					{(popupState) => (
						<Box className="relative">
							<OutlinedBorderButton {...bindTrigger(popupState)} disabled={data?.underUpgrade}>
								{isPending ? "Please wait..." : data?.targetVersion ?? "Upgrade available"}{" "}
								<ArrowDown2 size="14px" color="#959595" />
							</OutlinedBorderButton>
							<Menu
								{...bindMenu(popupState)}
								transformOrigin={{
									vertical: "top",
									horizontal: "left",
								}}
								slotProps={{
									root: STYLES.MENU_ROOT,
									paper: STYLES.MENU_PAPER,
								}}
							>
								{data?.possibleUpgradeVersions?.map((update: string, index: number) => {
									return (
										<MenuItem
											key={index}
											sx={STYLES.MENU_ITEMS}
											onClick={() => {
												popupState.close()
												HandleVersion(update)
											}}
										>
											{update}
										</MenuItem>
									)
								})}
							</Menu>
						</Box>
					)}
				</PopupState>
			}
			height="36px"
		/>
	)
}

export default TargetVersionDropdown
