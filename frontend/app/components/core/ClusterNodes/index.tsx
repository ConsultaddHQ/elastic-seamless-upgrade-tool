import { Spinner, Table, TableBody, TableCell, TableColumn, TableHeader, TableRow } from "@heroui/react"
import { Box, Typography } from "@mui/material"
import { useMutation, useQuery } from "@tanstack/react-query"
import { DocumentText, More, Refresh } from "iconsax-react"
import { type Key, useCallback, useState } from "react"
import { cn } from "~/lib/Utils"
import { useRealtimeEventListener } from "~/lib/hooks/useRealtimeEventListener"
import UpgradeLogs from "../UpgradeLogs"
import { AppDropdown, type DropdownItem } from "~/components/utilities/AppDropdown"
import NodeConfiguration from "~/components/core/NodeConfiguration"
import { useParams } from "react-router"
import { clusterApi } from "~/apis/ClusterApi"
import { useConfirmationModal } from "~/components/utilities/ConfirmationModal"
import { OutlinedBorderButton } from "~/components/utilities/Buttons"
import { toast } from "sonner"

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

function ClusterNodes() {
	const { clusterId } = useParams()
	const [showNodeLogs, setShowNodeLogs] = useState<TUpgradeRow | undefined>()
	const [showNodeConfig, setShowNodeConfig] = useState<TUpgradeRow | undefined>()
	const { ConfirmationModal, openConfirmation } = useConfirmationModal()

	useRealtimeEventListener("UPGRADE_PROGRESS_CHANGE", () => refetch(), true)

	const getNodesInfo = async () => {
		let response: any = []
		await clusterApi.getNodes(clusterId!).then((data) => {
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

	const { data, isLoading, refetch, isRefetching } = useQuery({
		queryKey: ["nodes-info"],
		queryFn: getNodesInfo,
		staleTime: 0,
	})

	const { isPending: isSyncingNodes, mutate: syncClusterNodes } = useMutation({
		mutationKey: ["sync-cluster-nodes"],
		mutationFn: async () => {
			await clusterApi.syncClusterNodes(clusterId!)
			await refetch()
			toast.success("Cluster nodes synced successfully")
		},
	})

	const getNodeAction = (row: TUpgradeRow) => {
		const items: DropdownItem[] = [
			{
				label: "Configuration",
				onClick: () => {
					setShowNodeConfig(row)
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
					return <Box className="flex justify-end">{getNodeAction(row)}</Box>
				default:
					return cellValue
			}
		},
		[data, isRefetching]
	)

	return (
		<Box className="flex w-full p-px rounded-2xl" sx={{ background: "radial-gradient(#6E687C, #1D1D1D)" }}>
			{showNodeLogs && <UpgradeLogs node={showNodeLogs} onOpenChange={() => setShowNodeLogs(undefined)} />}
			{showNodeConfig && (
				<NodeConfiguration node={showNodeConfig} onOpenChange={() => setShowNodeConfig(undefined)} />
			)}
			<Box className="flex flex-col gap-4 w-full rounded-2xl bg-[#0d0d0d]" padding="16px 24px">
				<Box className="flex flex-row items-center gap-2 justify-between w-full">
					<Typography color="#FFF" fontSize="14px" fontWeight="600" lineHeight="22px">
						Cluster Nodes
					</Typography>
					<OutlinedBorderButton
						onClick={() =>
							openConfirmation({
								title: "Sync Nodes",
								message: `Do you want to sync nodes now?`,
								confirmText: "Sync",
								onConfirm: () => {
									syncClusterNodes()
								},
							})
						}
						disabled={isSyncingNodes}
						icon={Refresh}
						filledIcon={Refresh}
						padding="8px 16px"
						fontSize="13px"
					>
						Sync Nodes
					</OutlinedBorderButton>
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
							isLoading={isSyncingNodes || isLoading}
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

export default ClusterNodes
