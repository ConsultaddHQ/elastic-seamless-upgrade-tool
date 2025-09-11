import { Box, Typography } from "@mui/material"
import { useQuery } from "@tanstack/react-query"
import axiosJSON from "~/apis/http"
import { useLocalStore } from "~/store/common"
import { useRealtimeEventListener } from "~/lib/hooks/useRealtimeEventListener"
import { FullScreenDrawer } from "~/components/utilities/FullScreenDrawer"
import AppBreadcrumb from "~/components/utilities/AppBreadcrumb"
import { ArrowLeft } from "iconsax-react"
import NoData from "~/components/core/Precheck/widgets/NoData"
import { Skeleton, Spinner, Table, TableBody, TableCell, TableColumn, TableHeader, TableRow } from "@heroui/react"
import type { IAllocationExplain } from "./types"

function AllocationExplainBreadcrumb({ onBack }: { onBack: () => void }) {
	return (
		<AppBreadcrumb
			items={[
				{
					label: "Go back",
					icon: <ArrowLeft size="14px" color="currentColor" />,
					onClick: onBack,
				},
				{
					label: "Allocation Explain",
					color: "#BDA0FF",
				},
			]}
		/>
	)
}

function useAllocationExplain() {
	const clusterId = useLocalStore((state) => state.clusterId)
	const fetchAllocationExplain = async () => {
		const res = await axiosJSON.get<IAllocationExplain[]>(`/clusters/${clusterId}/allocation-explanations`)
		return res.data ?? []
	}
	const { refetch, data, isLoading } = useQuery({
		queryKey: ["getAllocationExplain", clusterId],
		queryFn: fetchAllocationExplain,
		staleTime: 0,
	})

	useRealtimeEventListener("UPGRADE_PROGRESS_CHANGE", () => refetch(), true)
	return { data, isLoading, refetch }
}

function Loading() {
	return (
		<Box className="flex flex-col w-full gap-2 ">
			{new Array(15).fill(0).map(() => (
				<Skeleton className="rounded-lg">
					<Box height="80px"></Box>
				</Skeleton>
			))}
		</Box>
	)
}
function AllocationExplainTable({ data }: { data: IAllocationExplain[] | undefined }) {
	const columns: TColumn = [
		{
			key: "index",
			label: "Index",
			align: "start",
			width: 80,
		},
		{
			key: "shard",
			label: "Shard",
			align: "start",
			width: 30,
		},
		{
			key: "explanation",
			label: "Allocation Explanation",
			align: "start",
			width: 400,
		},
	]

	if (!data || data.length === 0) {
		return (
			<NoData
				title="No allocation explanations available to display"
				subtitle="There are no allocation explaination to show at the moment."
			/>
		)
	}

	return (
		<Box className="flex w-full">
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
					loadingContent={<Spinner color="secondary" />}
					emptyContent="No nodes upgrades found."
				>
					{(item: IAllocationExplain) => (
						<TableRow key={`${item.index}-${item.shard}`}>
							{(columnKey) => (
								<TableCell>
									<span>{item[columnKey as keyof IAllocationExplain]}</span>
								</TableCell>
							)}
						</TableRow>
					)}
				</TableBody>
			</Table>
		</Box>
	)
}

function AllocationExplain({ onOpenChange }: { onOpenChange: () => void }) {
	const { data, isLoading } = useAllocationExplain()

	return (
		<FullScreenDrawer isOpen={true} onOpenChange={onOpenChange}>
			<Box minHeight="58px" />
			<Box className="flex items-center gap-3 justify-between">
				<AllocationExplainBreadcrumb onBack={onOpenChange} />
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
								Allocation Explain
							</Typography>
						</Box>
						{isLoading ? <Loading /> : <AllocationExplainTable data={data} />}
					</Box>
				</Box>
			</Box>
		</FullScreenDrawer>
	)
}

export default AllocationExplain
