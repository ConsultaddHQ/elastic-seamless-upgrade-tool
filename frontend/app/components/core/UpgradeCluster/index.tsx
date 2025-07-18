import { Spinner, Table, TableBody, TableCell, TableColumn, TableHeader, TableRow } from "@heroui/react"
import { Box, Typography } from "@mui/material"
import { useMutation, useQuery } from "@tanstack/react-query"
import { CloseCircle, Flash, TickCircle, Warning2 } from "iconsax-react"
import { useCallback, useEffect, type Key } from "react"
import { toast } from "sonner"
import axiosJSON from "~/apis/http"
import { OutlinedBorderButton } from "~/components/utilities/Buttons"
import StringManager from "~/constants/StringManager"
import { useLocalStore } from "~/store/common"
import { useSocketStore } from "~/store/socket"
import ProgressBar from "./widgets/progress"

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
	const clusterId = useLocalStore((state: any) => state.clusterId)
	const { socket, isConnected } = useSocketStore()

	useEffect(() => {
		if (!socket) return
		const listner = () => {
			refetch()
		}
		socket.on("UPGRADE_PROGRESS_CHANGE", listner)
		return () => {
			socket.off("UPGRADE_PROGRESS_CHANGE", listner)
		}
	}, [socket])

	const getNodesInfo = async () => {
		let response: any = []
		await axiosJSON
			.get(`/api/elastic/clusters/${clusterId}/nodes`)
			.then((res) => {
				response = res.data.map((item: any) => ({
					key: item.nodeId,
					ip: item.ip,
					node_name: item.name,
					role: item.roles.join(","),
					os: item.os.name,
					version: item.version,
					status: item.status,
					progress: item.progress,
					isMaster: item.isMaster,
					disabled: item.disabled ? item.disabled : false,
				}))
			})
			.catch((err) => toast.error(err?.response?.data.err ?? StringManager.GENERIC_ERROR))

		return response
	}

	const performUpgrade = async (nodeId: string) => {
		console.log("triggered")
		await axiosJSON
			.post(`/api/elastic/clusters/${clusterId}/nodes/upgrade`, {
				nodes: [nodeId],
			})
			.then(() => {
				refetch()
				toast.success("Upgrade started")
			})
			.catch(() => {
				toast.error("Failed to start upgrade")
			})
	}
	const performUpgradeAll = async () => {
		await axiosJSON
			.post(`/api/elastic/clusters/${clusterId}/upgrade-all`)
			.then(() => {
				refetch()
				toast.success("Upgrade started")
			})
			.catch(() => {
				toast.error("Failed to start upgrade")
			})
	}
	const { data, isLoading, refetch, isRefetching } = useQuery({
		queryKey: ["nodes-info"],
		queryFn: getNodesInfo,
		// refetchInterval: (data) => {
		// 	const nodes = data.state.data
		// 	const isUpgrading = nodes?.some((node: any) => node.status === "UPGRADING")
		// 	return isUpgrading ? 1000 : false
		// },
		// refetchIntervalInBackground: true,
		staleTime: 0,
	})

	const { mutate: PerformUpgrade, isPending } = useMutation({
		mutationKey: ["node-upgrade"],
		mutationFn: performUpgrade,
	})

	const getAction = (row: TUpgradeRow) => {
		if (row.disabled && row.status === "available") {
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
		} else if (row.status === "available") {
			return (
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
			)
		} else if (row.status === "upgrading") {
			return <ProgressBar progress={row.progress ? row.progress : 0} />
		} else if (row.status === "upgraded") {
			return UPGRADE_ENUM["completed"]
		} else {
			return UPGRADE_ENUM["failed"]
		}
	}
	const renderCell = useCallback(
		(row: TUpgradeRow, columnKey: Key) => {
			const cellValue = row[columnKey as keyof TUpgradeRow]

			switch (columnKey) {
				case "node_name":
					return row.node_name
				case "ip":
					return <span className="text-[#ADADAD]">{row.ip}</span>
				case "role":
					return <span className="text-[#ADADAD]">{row.role}</span>
				case "os":
					return <span className="text-[#ADADAD]">{row.os}</span>
				case "version":
					return <span className="text-[#ADADAD]">{row.version}</span>
				case "action":
					return <Box className="flex justify-end">{getAction(row)}</Box>
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
					<OutlinedBorderButton
						onClick={performUpgradeAll}
						icon={Flash}
						filledIcon={Flash}
						disabled={
							isPending ||
							isLoading ||
							(data &&
								data.filter((item: any) => item.status !== "available" && item.status !== "upgraded")
									.length > 0)
						}
						padding="8px 16px"
						fontSize="13px"
					>
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
