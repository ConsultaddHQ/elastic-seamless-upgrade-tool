import { Spinner, Table, TableBody, TableCell, TableColumn, TableHeader, TableRow } from "@heroui/react"
import { Box, Typography } from "@mui/material"
import { useMutation, useQuery } from "@tanstack/react-query"
import { CloseCircle, Flash, TickCircle } from "iconsax-react"
import { useCallback, type Key } from "react"
import { toast } from "sonner"
import axiosJSON from "~/apis/http"
import { OutlinedBorderButton } from "~/components/utilities/Buttons"
import StorageManager from "~/constants/StorageManager"
import LocalStorageHandler from "~/lib/LocalHanlder"
import ProgressBar from "./widgets/progress"
import StringManager from "~/constants/StringManager"

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

const columns: TUpgradeColumn = [
	{
		key: "node_name",
		label: "Node name",
		align: "start",
		width: 300,
	},
	{
		key: "role",
		label: "Role",
		align: "start",
		width: 150,
	},
	{
		key: "os",
		label: "OS",
		align: "start",
		width: 150,
	},
	{
		key: "version",
		label: "Version",
		align: "start",
		width: 150,
	},
	{
		key: "action",
		label: "Action",
		align: "end",
		width: 140,
	},
]

function UpgradeCluster({ clusterType }: TUpgradeCluster) {
	const getNodeStatus = async (nodeId: string) => {
		try {
			const response = await axiosJSON.get(`/api/elastic/clusters/nodes/${nodeId}`)

			// Assuming the API returns a status or progress field
			const { status, progress } = response.data
			return { status, progress }
		} catch (error) {
			console.error("Status check error:", error)
			throw error
		}
	}

	const getNodesInfo = async () => {
		const clusterId = LocalStorageHandler.getItem(StorageManager.CLUSTER_ID) || "cluster-id"
		let response: any = []
		await axiosJSON
			.get(`/api/elastic/clusters/${clusterId}/nodes`)
			.then((res) => {
				response = res.data.map((item: any) => ({
					key: item.nodeId,
					node_name: item.name,
					role: item.roles[0],
					os: item.os.name,
					version: item.version,
					status: item.status,
					progress: item.progress,
					isMaster: item.isMaster,
					disabled: item.disabled ? item.disabled : false,
						// (item.isMaster && res.data.filter((i: any) => i.status !== "UPGRADED" && i.isMaster).length > 0) ||
						// res.data.some((i: any) => i.status === "UPGRADING"),
				}))
			})
			.catch((err) => toast.error(err?.response?.data.err ?? StringManager.GENERIC_ERROR))

		return response
	}

	const performUpgrade = async (nodeId: string) => {
		const clusterId = LocalStorageHandler.getItem(StorageManager.CLUSTER_ID) || "cluster-id"
		console.log("triggered")
		await axiosJSON
			.post(`/api/elastic/clusters/${clusterId}/nodes/upgrade`, {
				nodes: [nodeId],
			})
			.then((res) => {
				refetch()
				toast.success("Upgrade started")
			})
			.catch((error) => {
				toast.error("Failed to start upgrade")
			})
	}
	const performUpgradeAll = async () => {
		const clusterId = LocalStorageHandler.getItem(StorageManager.CLUSTER_ID) || "cluster-id"
		await axiosJSON.post(`/api/elastic/clusters/${clusterId}/upgrade-all`).then((res) => {
			refetch()
			toast.success("Upgrade started")
		}
		).catch((error) => {	
			toast.error("Failed to start upgrade")
		}
		)
	}
	const { data, isLoading, refetch, isRefetching } = useQuery({
		queryKey: ["nodes-info"],
		queryFn: getNodesInfo,
		refetchInterval: (data) => {
			const nodes = data.state.data
			const isUpgrading = nodes?.some((node: any) => node.status === "UPGRADING")
			return isUpgrading ? 1000 : false
		},
		refetchIntervalInBackground: true,
		staleTime: 0,
	})

	const { mutate: PerformUpgrade, isPending } = useMutation({
		mutationKey: ["node-upgrade"],
		mutationFn: performUpgrade,
	})
	const renderCell = useCallback(
		(row: TUpgradeRow, columnKey: Key) => {
			const cellValue = row[columnKey as keyof TUpgradeRow]

			switch (columnKey) {
				case "node_name":
					return row.node_name
				case "role":
					return row.role
				case "os":
					return row.os
				case "version":
					return row.version
				case "action":
					return (
						<>
							{row.status === "AVAILABLE" ? (
								<Box className="flex justify-end">
									<OutlinedBorderButton
										onClick={() => {
											PerformUpgrade(row.key)
										}}
										icon={Flash}
										filledIcon={Flash}
										disabled={row?.disabled || isPending}
									>
										Upgrade
									</OutlinedBorderButton>
								</Box>
							) : row.status === "UPGRADING" ? (
								<ProgressBar progress={row.progress ? row.progress : 0} />
							) : row.status === "UPGRADED" ? (
								UPGRADE_ENUM["completed"]
							) : (
								UPGRADE_ENUM["failed"]
							)}
						</>
					)
				default:
					return cellValue
			}
		},
		[data, isPending, isRefetching]
	)

	return (
		<Box className="flex w-full p-px rounded-2xl" sx={{ background: "radial-gradient(#6E687C, #1D1D1D)" }}>
			<Box className="flex flex-col gap-4 w-full rounded-2xl bg-[#0d0d0d]" padding="16px 24px">
				<Box className="flex flex-row items-center gap-2 justify-between w-full">
					<Typography color="#FFF" fontSize="14px" fontWeight="600" lineHeight="22px">
						Node Details
					</Typography>
					<OutlinedBorderButton onClick={performUpgradeAll} icon={Flash} filledIcon={Flash} disabled={isPending || (data && (data.filter((item: any) => (item.status !== "AVAILABLE" && item.status !== "UPGRADED")).length > 0))}>
						Upgrade all
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
		</Box>
	)
}

export default UpgradeCluster
