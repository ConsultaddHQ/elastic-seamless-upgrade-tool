import { getKeyValue, Table, TableBody, TableCell, TableColumn, TableHeader, TableRow } from "@heroui/react"
import { Box, LinearProgress, Typography } from "@mui/material"
import { Flash } from "iconsax-react"
import { useQuery } from "@tanstack/react-query"
import { useCallback, useEffect, useState, type Key } from "react"
import { OutlinedBorderButton } from "~/components/utilities/Buttons"
import axiosJSON from "~/apis/http"
import LocalStorageHandler from "~/lib/LocalHanlder"
import { toast } from "sonner"
import CustomProgressBar from "~/components/utilities/Progress"
import { FaCheckCircle } from "react-icons/fa"
import StorageManager from "~/constants/StorageManager"

type UpgradeCompleteProps = {}

const UpgradeComplete: React.FC<UpgradeCompleteProps> = () => {
	return (
		<Box display="flex" alignItems="center" gap={1}>
			<FaCheckCircle style={{ color: "#4caf50", fontSize: "24px" }} />
			<Typography variant="body1" style={{ color: "#4caf50", fontWeight: 500 }}>
				Upgrade complete
			</Typography>
		</Box>
	)
}

const rows: any = []
const columns: UpgradeColumnType = [
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
		width: 100,
	},
]

function UpgradeCluster({ clusterType }: UpgradeClusterType) {
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
				}))
			})
			.catch((err) => toast.error(err?.response?.data.err))

		return response
	}
	const performUpgrade = async (nodeId: string) => {
		const clusterId = LocalStorageHandler.getItem(StorageManager.CLUSTER_ID) || "cluster-id"
		console.log("triggered")
		await axiosJSON
			.post(`/api/elastic/clusters/${clusterId}/nodes/upgrade`, {
				nodes: [nodeId],
			})
			.then(async (res) => {
				await refetch()
				toast.success("Upgrade started")
			})
			.catch((error) => {
				toast.error("Failed to start upgrade")
				console.error(error)
			})
	}
	const { data, isLoading, refetch, isRefetching } = useQuery({
		queryKey: ["nodes-info"],
		queryFn: getNodesInfo,
		initialData: [],
		refetchInterval: (data) => {
			const nodes = data.state.data
			const isUpgrading = nodes?.some((node: any) => node.status === "upgrading")
			return isUpgrading ? 1000 : false
		},
		refetchIntervalInBackground: true,
		staleTime: 0,
	})

	const renderCell = useCallback(
		(row: UpgradeRowType, columnKey: Key) => {
			const cellValue = row[columnKey as keyof UpgradeRowType]

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
							{row.status === "available" ? (
								<Box className="flex justify-end">
									<OutlinedBorderButton
										onClick={() => {
											performUpgrade(row.key)
										}}
										icon={Flash}
										filledIcon={Flash}
									>
										Upgrade
									</OutlinedBorderButton>
								</Box>
							) : row.status === "upgrading" ? (
								<CustomProgressBar progress={row.progress ? row.progress : 0} />
							) : (
								<UpgradeComplete />
							)}
						</>
					)
				default:
					return cellValue
			}
		},
		[rows]
	)

	return (
		<Box className="flex w-full p-px rounded-2xl" sx={{ background: "radial-gradient(#6E687C, #1D1D1D)" }}>
			<Box className="flex flex-col gap-4 w-full rounded-2xl bg-[#0d0d0d]" padding="16px 24px">
				<Box className="flex flex-row items-center gap-2 justify-between w-full">
					<Typography color="#FFF" fontSize="14px" fontWeight="600" lineHeight="22px">
						Node Details
					</Typography>
					<OutlinedBorderButton icon={Flash} filledIcon={Flash}>
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
							table: "min-h-[400px] min-w-[600px]",
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
						<TableBody items={data}>
							{(item: UpgradeRowType) => (
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
