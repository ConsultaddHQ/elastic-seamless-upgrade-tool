import { Spinner, Table, TableBody, TableCell, TableColumn, TableHeader, TableRow } from "@heroui/react"
import { Box, Typography } from "@mui/material"
import { useQuery } from "@tanstack/react-query"
import { Folder } from "iconsax-react"
import React, { useCallback, type Key } from "react"
import { useNavigate } from "react-router"
import { toast } from "sonner"
import axiosJSON from "~/apis/http"
import StringManager from "~/constants/StringManager"
import { cn } from "~/lib/Utils"
import { useLocalStore } from "~/store/common"
import useSafeRouteStore from "~/store/safeRoutes"

const columns: TColumn = [
	{
		key: "cluster_name",
		label: "Cluster name",
		align: "start",
		width: 180,
	},
	{
		key: "infrastructure_type",
		label: "Infrastructure Type",
		align: "start",
		width: 320,
	},
	{
		key: "es_version",
		label: "ES version",
		align: "start",
		width: 120,
	},
	{
		key: "status",
		label: "Status",
		align: "start",
		width: 40,
	},
]

const STATUS_COLOR_MAP: TStatusColorMap = {
	yellow: {
		background: "#E3C04521",
		color: "#E0B517",
	},
	green: {
		background: "#52D97F21",
		color: "#52D97F",
	},
	red: {
		background: "#E7554721",
		color: "#E75547",
	},
}

function ClusterList() {
	const navigate = useNavigate()
	const setClusterAdded = useSafeRouteStore((state: any) => state.setClusterAdded)
	const setClusterId = useLocalStore((state: any) => state.setClusterId)
	const setInfraType = useLocalStore((state: any) => state.setInfraType)

	const getClustersData = async () => {
		let response = null
		await axiosJSON
			.get("/clusters")
			.then((res: any) => {
				console.log(res)
				response = res.data
			})
			.catch((err: any) => toast.error(err?.response?.data.err ?? StringManager.GENERIC_ERROR))
		return response
	}

	const { data, isLoading, refetch, isRefetching } = useQuery({
		queryKey: ["get-all-clusters"],
		queryFn: getClustersData,
		staleTime: 0,
	})

	const renderCell = useCallback(
		(row: TClusterRow, columnKey: Key) => {
			const cellValue = row[columnKey as keyof TClusterRow]
			switch (columnKey) {
				case "cluster_name":
					return <span className="text-[#ADADAD]">{row.name}</span>
				case "infrastructure_type":
					return (
						<span className="text-[#ADADAD] capitalize">
							{row.typeDisplayName.replaceAll("_", " ").toLowerCase()}
						</span>
					)
				case "es_version":
					return <span className="text-[#FFF]">{row.version}</span>
				case "status":
					return (
						<Box
							className={cn(
								"flex flex-row w-fit items-center gap-2 px-[7px] py-[5px] rounded-3xl capitalize",
								{
									"bg-[#E3C04521] text-[#E0B517]": row.status === "yellow",
									"bg-[#E7554721] text-[#E75547]": row.status === "red",
									"bg-[#52D97F21] text-[#52D97F]": row.status === "green",
								}
							)}
						>
							<span
								className={cn("w-[6px] h-[6px] min-h-[6px] min-w-[6px] rounded-sm", {
									"bg-[#E0B517]": row.status === "yellow",
									"bg-[#E75547]": row.status === "red",
									"bg-[#52D97F]": row.status === "green",
								})}
							/>
							{row.status}
						</Box>
					)
				default:
					return cellValue
			}
		},
		[data, isLoading, isRefetching]
	)

	const handleClusterSelect = (clusterId: Key) => {
		const selectedCluster = data?.filter((item: any) => item.id === clusterId)[0]
		if (selectedCluster.length !== 0) {
			setClusterId(clusterId)
			setInfraType(selectedCluster.type)
			setClusterAdded(true)
			navigate("/cluster-overview")
		}
	}

	return (
		<Table
			removeWrapper
			layout="auto"
			isHeaderSticky
			classNames={{
				base: "max-h-[calc(var(--window-height)-212px)] h-[calc(var(--window-height)-212px)] overflow-scroll",
				// table: "min-h-[400px] min-w-[600px]",
				th: "text-[#9D90BB] text-xs bg-[#161616] first:rounded-l-xl last:rounded-r-xl",
				td: "text-sm font-normal leading-normal border-b-[0.5px] border-solid border-[#1E1E1E] first:rounded-l-xl last:rounded-r-xl",
				tr: "[&>th]:h-[42px] [&>td]:h-[60px] hover:bg-[#28282A]",
			}}
			onRowAction={handleClusterSelect}
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
				emptyContent={
					<Box className="flex flex-col items-center h-full w-full gap-4">
						<Box
							className="flex items-center justify-center bg-[#1A1A1A] rounded-[10px] size-12"
							marginTop="100px"
						>
							<Folder size="24px" color="#ADADAD" />
						</Box>
						<Box className="flex flex-col items-center gap-[5px]">
							<Typography
								color="#F1F0F0"
								textAlign="center"
								fontFamily="Manrope"
								fontSize="16px"
								fontWeight="400"
								lineHeight="18px"
								letterSpacing="0.32px"
							>
								No cluster available to display
							</Typography>
							<Typography
								maxWidth="298px"
								color="#A6A6A6"
								textAlign="center"
								fontFamily="Manrope"
								fontSize="12px"
								fontWeight="400"
								lineHeight="normal"
								letterSpacing="0.24px"
							>
								There are no clusters to display right now. Please add one to the display list.
							</Typography>
						</Box>
					</Box>
				}
			>
				{(item: TClusterRow) => (
					<TableRow key={item.id}>
						{(columnKey) => <TableCell>{renderCell(item, columnKey)}</TableCell>}
					</TableRow>
				)}
			</TableBody>
		</Table>
	)
}

export default ClusterList
