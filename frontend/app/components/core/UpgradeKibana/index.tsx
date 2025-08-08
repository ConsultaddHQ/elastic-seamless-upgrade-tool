import { Spinner, Table, TableBody, TableCell, TableColumn, TableHeader, TableRow } from "@heroui/react"
import { Box, Typography } from "@mui/material"
import { useMutation, useQuery } from "@tanstack/react-query"
import { CloseCircle, Danger, Flash, Refresh, TickCircle, Warning2 } from "iconsax-react"
import { useCallback, type Key } from "react"
import { toast } from "sonner"
import axiosJSON from "~/apis/http"
import { OutlinedBorderButton } from "~/components/utilities/Buttons"
import StringManager from "~/constants/StringManager"
import { useLocalStore } from "~/store/common"
import ProgressBar from "./widgets/progress"
import { cn } from "~/lib/Utils"
import { useRealtimeEventListener } from "~/lib/hooks/useRealtimeEventListener"

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
		width: 120,
	},
	{
		key: "action",
		label: "Action",
		align: "end",
		width: 140,
	},
]

function UpgradeKibana({ clusterType }: TUpgradeKibana) {
	const clusterId = useLocalStore((state: any) => state.clusterId)
	useRealtimeEventListener("UPGRADE_PROGRESS_CHANGE", () => refetch(), true)

	const getNodesInfo = async () => {
		let response: any = []
		await axiosJSON
			.get(`/clusters/${clusterId}/nodes?type=KIBANA`)
			.then((res) => {
				response = res.data.map((item: any) => ({
					key: item.id,
					node_name: item.name,
					ip: item.ip,
					role: item.roles.join(","),
					os: item?.os?.name,
					version: item.version,
					status: item.status,
					progress: item.progress,
					isMaster: false,
					disabled: !item.upgradable,
				}))
			})
			.catch((err) => toast.error(err?.response?.data.err ?? StringManager.GENERIC_ERROR))

		return response
	}

	const performUpgrade = async (nodeId: string) => {
		console.log("triggered")
		await axiosJSON
			.post(`/upgrades/nodes`, {
				nodeId: nodeId,
				clusterId: clusterId,
			})
			.then((res) => {
				refetch()
				toast.success("Upgrade started")
			})
			.catch((error) => {
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
							{row?.disabled && (row.status != "UPGRADING" && row.status != "UPGRADED") ? (
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
							) : row.status === "AVAILABLE" ? (
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
								<Box className="flex justify-end">
									<OutlinedBorderButton
										onClick={() => {
											PerformUpgrade(row.key)
										}}
										icon={Refresh}
										filledIcon={Refresh}
										disabled={row?.disabled || isPending}
									>
										Retry
									</OutlinedBorderButton>
								</Box>
							)}
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
			<Box className="flex flex-col gap-4 w-full rounded-2xl bg-[#0d0d0d]" padding="16px 24px">
				<Box className="flex flex-row items-center gap-2 justify-between w-full">
					<Typography color="#FFF" fontSize="14px" fontWeight="600" lineHeight="22px">
						Node Details
					</Typography>
					<Box className="flex flex-row items-center gap-2">
						{data?.filter((item: any) => item.status === "FAILED").length !== 0 ? (
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
						) : null}
						<OutlinedBorderButton
							icon={Flash}
							filledIcon={Flash}
							disabled
							padding="8px 16px"
							fontSize="13px"
						>
							Upgrade all
						</OutlinedBorderButton>
					</Box>
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
							tr: "[&>th]:h-[42px] [&>td]:min-h-[60px]",
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

export default UpgradeKibana
