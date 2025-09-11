import {
	Input,
	Skeleton,
	Spinner,
	Table,
	TableBody,
	TableCell,
	TableColumn,
	TableHeader,
	TableRow,
} from "@heroui/react"
import { Box, Typography } from "@mui/material"
import { useQuery } from "@tanstack/react-query"
import { Alarm, SearchNormal1 } from "iconsax-react"
import { type Key, useCallback, useState } from "react"
import { FiAlertTriangle } from "react-icons/fi"
import { toast } from "sonner"
import axiosJSON from "~/apis/http"
import StringManager from "~/constants/StringManager"
import { useLocalStore } from "~/store/common"

const columns: TDeprecationColumn = [
	{
		key: "status",
		label: "Status",
		align: "start",
		width: 100,
	},
	{
		key: "issue",
		label: "Issue",
		align: "start",
		width: 150,
	},
	{
		key: "issue_details",
		label: "Issue details",
		align: "start",
		width: 150,
	},
	{
		key: "resolutions",
		label: "Resolutions",
		align: "start",
		width: 150,
	},
]

function DeprecationLogs({ clusterType }: { clusterType: "ELASTIC" | "KIBANA" }) {
	const clusterId = useLocalStore((state) => state.clusterId)
	const [search, setSearch] = useState<string>("")

	const getLogs = async () => {
		const response = await axiosJSON.get(
			`/clusters/${clusterId}/deprecations/${clusterType === "ELASTIC" ? "elastic-search" : "kibana"}`
		)
		const deprecations = response.data
		return deprecations?.map((item: any, index: number): TDeprecationRow => {
			return {
				key: String(index),
				issue: item?.issue,
				status: item?.type.toUpperCase(),
				issue_details: item?.issueDetails,
				resolutions: item?.resolutions,
			}
		})
	}

	const { data, isLoading, isRefetching, refetch } = useQuery({
		queryKey: ["get-deprecation-logs"],
		queryFn: getLogs,
		staleTime: Infinity,
	})

	const renderCell = useCallback((row: TDeprecationRow, columnKey: Key) => {
		const cellValue = row[columnKey as keyof TDeprecationRow]

		switch (columnKey) {
			case "status":
				return (
					<Typography
						sx={{
							padding: "5px 7px",
							background:
								row.status === "CRITICAL" ? "rgba(206, 98, 75, 0.13)" : "rgba(227, 192, 69, 0.13)",
						}}
						className="flex w-max flex-row items-center gap-1 rounded-3xl"
						color={row.status === "CRITICAL" ? "#E87D65" : "#E0B517"}
						fontFamily="Inter"
						fontSize="12px"
						fontWeight="500"
						lineHeight="normal"
						textTransform="capitalize"
					>
						{row.status === "CRITICAL" ? (
							<FiAlertTriangle size="14px" color="currentColor" />
						) : (
							<Alarm size="14px" color="currentColor" />
						)}{" "}
						{row.status.toLowerCase()}
					</Typography>
				)
			case "issue":
				return row.issue
			case "issue_details":
				return row.issue_details
			case "resolutions":
				return row.resolutions.map((item, index) => {
					return (
						<li key={index}>
							<span className="relative -left-[5px]">{item}</span>
						</li>
					)
				})

			default:
				return cellValue
		}
	}, [])

	const filteredData =
		data?.filter((item: TDeprecationRow) => {
			const searchL = search.toLowerCase()
			const resCheck = item.resolutions.includes(searchL)
			return (
				item.issue.toLowerCase().includes(searchL) ||
				item.issue_details.toLowerCase().includes(searchL) ||
				resCheck
			)
		}) || []

	return (
		<Box className="flex rounded-2xl p-px w-full" sx={{ background: "radial-gradient(#6E687C, #1D1D1D)" }}>
			<Box className="flex flex-col gap-4 py-4 px-6 w-full rounded-2xl bg-[#0d0d0d]">
				<Box className="flex flex-col gap-[6px] w-full">
					<Typography
						color="#FFF"
						fontSize="18px"
						fontWeight="600"
						lineHeight="normal"
						letterSpacing="0.18px"
					>
						{clusterType === "ELASTIC" ? "Elasticserach" : "Kibana"} deprecated logs
					</Typography>
					<Typography
						maxWidth="737px"
						color="#6E6E6E"
						fontSize="13px"
						fontWeight="400"
						lineHeight="20px"
						letterSpacing="0.26px"
					>
						Resolve all critical issues before upgrading. Before making changes, ensure you have a current
						snapshot of your cluster. To start multiple reindexing tasks in a single request, use the Kibana
						batch reindexing API.
					</Typography>
				</Box>
				<Box className="flex flex-col gap-[10px]">
					<Box className="flex flex-row gap-3 justify-between items-center">
						<Box className="flex flex-row items-center gap-6">
							<Typography
								className="flex flex-row items-center gap-2"
								color="#E87D65"
								fontSize="12px"
								fontWeight="500"
								lineHeight="normal"
							>
								<Box className="min-h-2 min-w-2 w-min h-min rounded-[2px] bg-[#E87D65]" /> Critical:{" "}
								{isLoading ? (
									<Skeleton className="rounded-sm">
										<Box height="16px" width="10px" />
									</Skeleton>
								) : (
									data?.filter((item: TDeprecationRow) => item.status === "CRITICAL").length
								)}
							</Typography>
							<Typography
								className="flex flex-row items-center gap-2"
								color="#E0B517"
								fontSize="12px"
								fontWeight="500"
								lineHeight="normal"
							>
								<Box className="min-h-2 min-w-2 w-min h-min rounded-[2px] bg-[#E0B517]" /> Warning:{" "}
								{isLoading ? (
									<Skeleton className="rounded-sm">
										<Box height="16px" width="10px" />
									</Skeleton>
								) : (
									data?.filter((item: TDeprecationRow) => item.status === "WARNING").length
								)}
							</Typography>
						</Box>
						<Box className="flex max-w-[264px] w-full">
							<Input
								classNames={{
									inputWrapper:
										"rounded-[10px] border border-solid border-[#2B2B2B] bg-[#161616] group-data-[focus=true]:bg-[#161616] data-[hover=true]:bg-default-50",
								}}
								type="text"
								placeholder="Search"
								startContent={<SearchNormal1 size="14px" color="#6A6A6A" />}
								value={search}
								onChange={(e) => setSearch(e.target.value)}
							/>
						</Box>
					</Box>
					<Table
						removeWrapper
						layout="auto"
						isHeaderSticky
						classNames={{
							base: "max-h-[calc(var(--window-height)-292px)] h-[calc(var(--window-height)-292px)] overflow-scroll",
							table: "min-h-[400px] min-w-[600px]",
							th: "text-[#9D90BB] text-xs bg-[#161616] first:rounded-l-xl last:rounded-r-xl",
							td: "text-sm font-normal leading-normal border-b-[0.5px] border-solid border-[#1E1E1E] align-top px-[17.5px] py-6",
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
							items={(filteredData as TDeprecationRow[]) || []}
							isLoading={isLoading || isRefetching}
							loadingContent={
								<Spinner
									classNames={{
										circle2: "border-b-[#8351F5]",
										circle1: "border-b-[#8351F5]",
									}}
								/>
							}
							emptyContent={
								<Typography fontSize="13px" fontWeight="400" lineHeight="20px" color="#6E6E6E">
									No deprecation available.
								</Typography>
							}
						>
							{(item) => (
								<TableRow key={item?.key}>
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

export default DeprecationLogs
