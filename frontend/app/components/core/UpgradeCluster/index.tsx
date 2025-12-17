import { Checkbox, Spinner, Table, TableBody, TableCell, TableColumn, TableHeader, TableRow } from "@heroui/react"
import { Box, Typography } from "@mui/material"
import { useMutation, useQuery } from "@tanstack/react-query"
import { CloseCircle, DocumentText, Flash, More, Refresh, TickCircle, Warning2 } from "iconsax-react"
import { type Key, useCallback, useState } from "react"
import { toast } from "sonner"
import { OutlinedBorderButton } from "~/components/utilities/Buttons"
import ProgressBar from "./widgets/progress"
import { cn } from "~/lib/Utils"
import { useRealtimeEventListener } from "~/lib/hooks/useRealtimeEventListener"
import UpgradeLogs from "../UpgradeLogs"
import { AppDropdown, type DropdownItem } from "~/components/utilities/AppDropdown"
import { ClusterActions } from "~/components/core/UpgradeCluster/widgets/ClusterActions"
import NodeConfiguration from "~/components/core/NodeConfiguration"
import NodeUpgradePlan from "~/components/core/NodeUpgradePlan"
import { useParams } from "react-router"
import { clusterApi } from "~/apis/ClusterApi"
import { clusterUpgradeApi } from "~/apis/ClusterUpgradeApi"
import { useConfirmationModal } from "~/components/utilities/ConfirmationModal"

const UPGRADE_ENUM = {
	completed: (
		<Typography
			className="inline-flex gap-[6px] items-center"
			color="#52D97F"
			fontSize="14px"
			fontWeight="500"
			lineHeight="normal"
		>
			<Box className="size-[15px]">
				<TickCircle color="currentColor" size="15px" />
			</Box>
			Upgrade complete
		</Typography>
	),
	failed: (
		<Typography
			className="inline-flex gap-[6px] items-center"
			color="#E87D65"
			fontSize="14px"
			fontWeight="500"
			lineHeight="normal"
		>
			<Box className="size-[15px] inline">
				<CloseCircle color="currentColor" size="15px" />
			</Box>
			Upgrade failed
		</Typography>
	),
}

const columns: TColumn = [
	{
		key: "node_name",
		label: "Node name",
		align: "start",
		width: 200,
	},
	{
		key: "ip",
		label: "IP address",
		align: "start",
		width: 120,
	},
	{
		key: "role",
		label: "Role",
		align: "start",
		width: 120,
	},
	{
		key: "os",
		label: "OS",
		align: "start",
		width: 120,
	},
	{
		key: "version",
		label: "Version",
		align: "start",
		width: 100,
	},
	{
		key: "action",
		label: "Action",
		align: "end",
		width: 140,
	},
]

function UpgradeCluster({ clusterType }: TUpgradeCluster) {
	const { clusterId } = useParams()
	const [showNodeLogs, setShowNodeLogs] = useState<TUpgradeRow | undefined>()
	const [showNodeConfig, setShowNodeConfig] = useState<TUpgradeRow | undefined>()
	const [showNodeUpgradePlan, setShowNodeUpgradePlan] = useState<TUpgradeRow | undefined>()
	const { ConfirmationModal, openConfirmation } = useConfirmationModal()
	const [skipHealth, setSkipHealth] = useState(false)

	useRealtimeEventListener("UPGRADE_PROGRESS_CHANGE", () => refetch(), true)

	const getNodesInfo = async () => {
		let response: any = []
		await clusterApi.getNodes(clusterId!, clusterType).then((data) => {
			response = data.map((item: any) => ({
				key: item.id,
				ip: item.ip,
				node_name: item.name,
				role: item.roles.join(","),
				os: item.os.name,
				version: item.version,
				status: item.status,
				progress: item.progress,
				isMaster: item.isMaster,
				disabled: !item.upgradable,
				id: item.id,
			}))
		})
		return response
	}

	const performUpgrade = async (nodeId: string) => {
		await clusterUpgradeApi.upgradeNode(clusterId!, nodeId)
		refetch()
		toast.success("Upgrade started")
	}

	const retryNodeUpgrade = async (nodeId: string, skipHealth: boolean = false) => {
		await clusterUpgradeApi.retryNodeUpgrade(clusterId!, nodeId, { skipHealth })
		refetch()
		toast.success("Upgrade started")
	}

	const { data, isLoading, refetch, isRefetching } = useQuery({
		queryKey: ["nodes-info"],
		queryFn: getNodesInfo,
		staleTime: 0,
	})

	const { mutate: PerformUpgrade, isPending } = useMutation({
		mutationKey: ["node-upgrade"],
		mutationFn: performUpgrade,
	})

	const { mutate: PerformRetryUpgrade, isPending: isRetryPending } = useMutation({
		mutationKey: ["retry-node-upgrade"],
		mutationFn: async ({ nodeId, skipHealth }: { nodeId: string; skipHealth: boolean }) =>
			await retryNodeUpgrade(nodeId, skipHealth),
	})

	const getNodeAction = (row: TUpgradeRow) => {
		if (row.disabled && row.status === "AVAILABLE") {
			return (
				<Box
					className="flex gap-1 items-center"
					color="#EFC93D"
					fontSize="12px"
					fontWeight="500"
					lineHeight="normal"
				>
					<Box className="min-w-4 min-h-4">
						<Warning2 size="16px" color="currentColor" variant="Bold" />
					</Box>
					Upgrade other nodes first.
				</Box>
			)
		} else if (row.status === "AVAILABLE") {
			return (
				<Box className="flex justify-end">
					<OutlinedBorderButton
						onClick={() => {
							openConfirmation({
								title: "Confirm Node Upgrade",
								message: `Do you want to proceed with upgrading node ${row.node_name}?`,
								confirmText: "Confirm",
								onConfirm: () => PerformUpgrade(row.key),
							})
						}}
						icon={Flash}
						filledIcon={Flash}
						disabled={row?.disabled || isPending}
					>
						Upgrade
					</OutlinedBorderButton>
				</Box>
			)
		} else if (row.status === "UPGRADING") {
			return <ProgressBar progress={row.progress ? row.progress : 0} />
		} else if (row.status === "UPGRADED") {
			return UPGRADE_ENUM["completed"]
		} else {
			return (
				<Box className="flex justify-end">
					<OutlinedBorderButton
						onClick={() => {
							openConfirmation({
								title: "Retry Upgrade",
								message: (
									<Box className="flex flex-col gap-4">
										<Box className="flex ">
											<Typography
												color="#ADADAD"
												fontSize="16px"
												fontWeight="500"
												lineHeight="22px"
												align="center"
												className="w-full"
												fontStyle={"Figtree"}
											>
												Do you want to proceed with upgrading node ${row.node_name}?
											</Typography>
										</Box>
										<Box className="flex ">
											<Checkbox
												color="warning"
												checked={skipHealth}
												onChange={(e) => {
													setSkipHealth(e.target.checked)
												}}
											>
												Skip health check
											</Checkbox>
										</Box>
									</Box>
								),
								confirmText: "Retry",
								onConfirm: () =>
									setTimeout(() => PerformRetryUpgrade({ nodeId: row.key, skipHealth }), 2000),
							})
						}}
						icon={Refresh}
						filledIcon={Refresh}
						disabled={row?.disabled || isRetryPending}
					>
						Retry
					</OutlinedBorderButton>
				</Box>
			)
		}
	}
	const getMoreAction = (row: TUpgradeRow) => {
		const items: DropdownItem[] = [
			{
				label: "Logs",
				onClick: () => {
					setShowNodeLogs(row)
				},
				icon: <Flash size="14px" color="currentColor" />,
			},
			{
				label: "Configuration",
				onClick: () => {
					setShowNodeConfig(row)
				},
				icon: <DocumentText size="14px" color="currentColor" />,
			},
			{
				label: "Upgrade Plan",
				onClick: () => {
					setShowNodeUpgradePlan(row)
				},
				icon: <DocumentText size="14px" color="currentColor" />,
			},
		]
		return (
			<AppDropdown
				label={<More size="14px" color="currentColor" style={{ transform: "rotate(90deg)" }} />}
				items={items}
				iconOnly={true}
			/>
		)
	}
	const renderCell = useCallback(
		(row: TUpgradeRow, columnKey: Key) => {
			const cellValue = row[columnKey as keyof TUpgradeRow]

			switch (columnKey) {
				case "node_name":
					return row.node_name
				case "ip":
					return (
						<span
							className={cn({
								"text-[#ADADAD]": row.status !== "UPGRADED",
								"text[#E75547]": row.status !== "FAILED",
							})}
						>
							{row.ip}
						</span>
					)
				case "role":
					return (
						<span
							className={cn({
								"text-[#ADADAD]": row.status !== "UPGRADED",
								"text[#E75547]": row.status !== "FAILED",
							})}
						>
							{row.role}
						</span>
					)
				case "os":
					return (
						<span
							className={cn({
								"text-[#ADADAD]": row.status !== "UPGRADED",
								"text[#E75547]": row.status !== "FAILED",
							})}
						>
							{row.os}
						</span>
					)
				case "version":
					return (
						<span
							className={cn({
								"text-[#ADADAD]": row.status !== "UPGRADED",
								"text[#E75547]": row.status !== "FAILED",
							})}
						>
							{row.version}
						</span>
					)
				case "action":
					return (
						<Box className="flex justify-end">
							{getNodeAction(row)}
							{getMoreAction(row)}
						</Box>
					)
				default:
					return cellValue
			}
		},
		[data, isPending, isRefetching]
	)

	return (
		<Box className="flex w-full p-px rounded-2xl" sx={{ background: "radial-gradient(#6E687C, #1D1D1D)" }}>
			{showNodeLogs && <UpgradeLogs node={showNodeLogs} onOpenChange={() => setShowNodeLogs(undefined)} />}
			{showNodeConfig && (
				<NodeConfiguration node={showNodeConfig} onOpenChange={() => setShowNodeConfig(undefined)} />
			)}
			{showNodeUpgradePlan && (
				<NodeUpgradePlan node={showNodeUpgradePlan} onOpenChange={() => setShowNodeUpgradePlan(undefined)} />
			)}
			<Box className="flex flex-col gap-4 w-full rounded-2xl bg-[#0d0d0d]" padding="16px 24px">
				<Box className="flex flex-row items-center gap-2 justify-between w-full">
					<Typography color="#FFF" fontSize="14px" fontWeight="600" lineHeight="22px">
						Node Details
					</Typography>
					<ClusterActions clusterType={clusterType} openConfirmation={openConfirmation} />
				</Box>
				<Box className="flex">
					<Table
						removeWrapper
						layout="auto"
						isHeaderSticky
						classNames={{
							base: "max-h-[calc(var(--window-height)-212px)] h-[calc(var(--window-height)-212px)] overflow-scroll",
							// table: "min-h-[400px] min-w-[600px]",
							th: "text-[#9D90BB] text-xs bg-[#161616] first:rounded-l-xl last:rounded-r-xl",
							td: "text-sm font-normal leading-normal border-b-[0.5px] border-solid border-[#1E1E1E]",
							tr: "[&>th]:h-[42px] [&>td]:h-[60px]",
						}}
					>
						<TableHeader columns={columns}>
							{(column) => (
								<TableColumn key={column.key} align={column.align} width={column.width}>
									{column.label}
								</TableColumn>
							)}
						</TableHeader>
						<TableBody
							items={data || []}
							isLoading={isLoading}
							loadingContent={<Spinner color="secondary" />}
							emptyContent="No nodes upgrades found."
						>
							{(item: TUpgradeRow) => (
								<TableRow key={item.key}>
									{(columnKey) => <TableCell>{renderCell(item, columnKey)}</TableCell>}
								</TableRow>
							)}
						</TableBody>
					</Table>
				</Box>
			</Box>
			{ConfirmationModal}
		</Box>
	)
}

export default UpgradeCluster
