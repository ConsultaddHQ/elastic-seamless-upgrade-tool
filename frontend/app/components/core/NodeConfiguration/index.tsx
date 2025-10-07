import React from "react"
import { Box, Typography } from "@mui/material"
import { FullScreenDrawer } from "~/components/utilities/FullScreenDrawer"
import AppBreadcrumb from "~/components/utilities/AppBreadcrumb"
import { ArrowLeft } from "iconsax-react"
import YamlEditor from "~/components/utilities/YamlEditor"
import { useMutation, useQuery } from "@tanstack/react-query"
import { OutlinedBorderButton } from "~/components/utilities/Buttons"
import { toast } from "sonner"
import { useParams } from "react-router"
import { clusterApi } from "~/apis/ClusterApi"
import { useConfirmationModal } from "~/components/utilities/ConfirmationModal"

function NodeConfigurationBreadcrumb({ onBack }: { onBack: () => void }) {
	return (
		<AppBreadcrumb
			items={[
				{
					label: "Go back",
					icon: <ArrowLeft size="14px" color="currentColor" />,
					onClick: onBack,
				},
				{
					label: "Configuration",
					color: "#BDA0FF",
				},
			]}
		/>
	)
}

function useNodeConfiguration(nodeId: string) {
	const { clusterId } = useParams()
	const [updatedConfig, setUpdatedConfig] = React.useState<string | undefined>()

	const { refetch, data, isLoading } = useQuery({
		queryKey: ["getNodeYamlConfig", clusterId, nodeId],
		queryFn: () => clusterApi.getNodeConfig(clusterId!, nodeId),
		staleTime: 0,
	})

	const { mutate, isPending } = useMutation({
		mutationKey: ["updateNodeYamlConfig", clusterId, nodeId],
		mutationFn: (config: string) => clusterApi.updateNodeConfig({ clusterId: clusterId!, nodeId, config }),
		onSuccess: (data) => {
			toast.success(data.message)
			setUpdatedConfig(undefined)
			refetch()
		},
	})

	return {
		config: data,
		isLoading,
		refetch,
		isUpdating: isPending,
		onConfigChange: setUpdatedConfig,
		updateConfig: () => updatedConfig && mutate(updatedConfig),
		updatedConfig,
	}
}

function NodeConfiguration({ onOpenChange, node }: { node: TUpgradeRow; onOpenChange: () => void }) {
	const { config, isLoading, isUpdating, onConfigChange, updateConfig, updatedConfig } = useNodeConfiguration(node.id)
	const { ConfirmationModal, openConfirmation } = useConfirmationModal()
	return (
		<FullScreenDrawer isOpen={true} onOpenChange={onOpenChange}>
			<Box minHeight="58px" />
			<Box className="flex items-center gap-3 justify-between">
				<NodeConfigurationBreadcrumb onBack={onOpenChange} />
				<OutlinedBorderButton
					disabled={isUpdating || isLoading || !updatedConfig}
					onClick={() => {
						openConfirmation({
							title: "Update Configuration",
							message: `Are you sure you want to update the configuration for node ${node.node_name}?`,
							confirmText: "Update",
							onConfirm: () => updateConfig(),
						})
					}}
				>
					{isUpdating ? "Updating" : "Update"}
				</OutlinedBorderButton>
			</Box>
			<Box
				className="flex p-px rounded-2xl h-[calc(var(--window-height)-120px)]"
				sx={{ background: "radial-gradient(#6E687C, #1D1D1D)" }}
			>
				<Box className="flex flex-col rounded-2xl bg-[#0D0D0D] w-full h-full items-start">
					<Box
						className="flex flex-col h-full w-full gap-3 overflow-auto items-center"
						padding="16px 24px 16px 24px"
					>
						<Box className="flex w-full flex-row items-start gap-[18px]">
							<Typography
								color="#E5E0E0"
								fontFamily="Manrope"
								fontSize="14px"
								fontWeight="600"
								lineHeight="20px"
							>
								{node.node_name}
							</Typography>
						</Box>
						<Box className="flex w-full h-full overflow-scroll rounded-lg">
							<YamlEditor
								language="yaml"
								value={config}
								isLoading={isLoading}
								onChange={onConfigChange}
							/>
						</Box>
					</Box>
				</Box>
			</Box>
			{ConfirmationModal}
		</FullScreenDrawer>
	)
}

export default NodeConfiguration
