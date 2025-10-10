import { Box, Typography } from "@mui/material"
import { toast } from "sonner"
import { OutlinedBorderButton } from "~/components/utilities/Buttons"
import { Danger, Flash, Slash } from "iconsax-react"
import { useQuery } from "@tanstack/react-query"
import { useRealtimeEventListener } from "~/lib/hooks/useRealtimeEventListener"
import { useParams } from "react-router"
import { clusterUpgradeApi } from "~/apis/ClusterUpgradeApi"
import type { OpenConfirmationOptions } from "~/components/utilities/ConfirmationModal/useConfirmationModal"

export const ClusterActions = ({
	clusterType,
	openConfirmation,
}: {
	clusterType: string
	openConfirmation: (options: OpenConfirmationOptions) => void
}) => {
	const { clusterId } = useParams()

	const performUpgradeAll = async () => {
		await clusterUpgradeApi.upgradeAllNodes(clusterId!, clusterType)
		toast.success("Upgrade started")
	}
	const performStopUpgrade = async () => {
		await clusterUpgradeApi.stopUpgrade(clusterId!)
		toast.success(
			"Cluster upgrade stop request submitted successfully. The current node will continue upgrading before the stop takes effect."
		)
	}

	const { data, isLoading, refetch, isPending } = useQuery({
		queryKey: ["get-upgrade-job-status"],
		queryFn: async () => {
			return await clusterUpgradeApi.getUpgradeJobStatus(clusterId!)
		},
		staleTime: 0,
	})
	useRealtimeEventListener("UPGRADE_PROGRESS_CHANGE", () => refetch(), true)

	const isUpgrading = data?.status === "UPGRADING"
	const isUpgradingFailed = data?.status === "FAILED"
	const isUpgradingStopped = data?.status === "STOPPED"
	const isStoppingUpgrade = data?.isStopping && !isUpgradingStopped

	const getAction = () => {
		if (isUpgradingStopped) {
			return (
				<OutlinedBorderButton
					onClick={() => {
						openConfirmation({
							title: "Resume Cluster Upgrade",
							message: `Do you want to resume the upgrade for cluster?`,
							confirmText: "Resume",
							onConfirm: performUpgradeAll,
							Icon: Flash,
						})
					}}
					icon={Flash}
					filledIcon={Flash}
					disabled={isPending || isLoading || isUpgrading}
					padding="8px 16px"
					fontSize="13px"
				>
					Resume
				</OutlinedBorderButton>
			)
		} else if (isUpgrading) {
			return (
				<OutlinedBorderButton
					onClick={performStopUpgrade}
					icon={Slash}
					filledIcon={Slash}
					disabled={isStoppingUpgrade}
					padding="8px 16px"
					fontSize="13px"
				>
					{isStoppingUpgrade ? "Stopping" : "Stop"}
				</OutlinedBorderButton>
			)
		} else {
			return (
				<OutlinedBorderButton
					onClick={() => {
						openConfirmation({
							title: "Confirm Cluster Upgrade",
							message: `Do you want to proceed with upgrading cluster?`,
							confirmText: "Confirm",
							onConfirm: performUpgradeAll,
							Icon: Flash,
						})
					}}
					icon={Flash}
					filledIcon={Flash}
					disabled={isPending || isLoading || isUpgrading}
					padding="8px 16px"
					fontSize="13px"
				>
					Upgrade all
				</OutlinedBorderButton>
			)
		}
	}
	return (
		<Box className="flex flex-row items-center gap-2">
			{isUpgradingFailed && (
				<Typography
					className="inline-flex gap-[6px] items-center"
					color="#E87D65"
					fontSize="14px"
					fontWeight="500"
					lineHeight="normal"
				>
					<Box className="size-[15px] inline">
						<Danger color="currentColor" size="15px" />
					</Box>
					Failed to upgrade
				</Typography>
			)}
			{getAction()}
		</Box>
	)
}
