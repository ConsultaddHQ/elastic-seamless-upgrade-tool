import { Box, Typography } from "@mui/material"
import { useQuery } from "@tanstack/react-query"
import { useRealtimeEventListener } from "~/lib/hooks/useRealtimeEventListener"
import { FullScreenDrawer } from "~/components/utilities/FullScreenDrawer"
import AppBreadcrumb from "~/components/utilities/AppBreadcrumb"
import { ArrowLeft } from "iconsax-react"
import NoData from "~/components/core/Precheck/widgets/NoData"
import {
	Skeleton,
	Spinner,
	Table,
	TableBody,
	TableCell,
	TableColumn,
	TableHeader,
	TableRow,
	Accordion,
	AccordionItem,
	Chip,
} from "@heroui/react"
import { useParams } from "react-router"
import { clusterApi } from "~/apis/ClusterApi"
import { DECIDER_EXPLANATIONS } from "~/constants/ShardAllocationDecidersList"

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
	const { clusterId } = useParams()
	const { refetch, data, isLoading } = useQuery({
		queryKey: ["getAllocationExplain", clusterId],
		queryFn: () => clusterApi.getAllocationExplain(clusterId!),
		staleTime: 0,
	})

	useRealtimeEventListener("UPGRADE_PROGRESS_CHANGE", () => refetch(), true)
	return { data, isLoading, refetch }
}

function Loading() {
	return (
		<Box className="flex flex-col w-full gap-2 ">
			{new Array(15).fill(0).map((_, i) => (
				<Skeleton key={i} className="rounded-lg">
					<Box height="80px"></Box>
				</Skeleton>
			))}
		</Box>
	)
}

function AllocationExplainTable({ data }: { data: IAllocationExplain[] | undefined }) {
	const columns = [
		{ key: "index", label: "Index", align: "start", width: 100 },
		{ key: "shard", label: "Shard", align: "start", width: 60 },
		{ key: "explanation", label: "Brief Explanation", align: "start", width: 220 },
		{ key: "decidersSet", label: "Root Cause & Resolution", align: "start", width: 380 },
		{ key: "fullExplanation", label: "Full Explanation Details", align: "start", width: 350 },
	]

	if (!data || data.length === 0) {
		return (
			<NoData
				title="No allocation explanations available to display"
				subtitle="There are no allocation explanations to show at the moment."
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
					base: "max-h-[calc(var(--window-height)-212px)] h-[calc(var(--window-height)-212px)] overflow-scroll custom-scrollbar",
					th: "text-[#9D90BB] text-xs bg-[#161616] first:rounded-l-xl last:rounded-r-xl",
					td: "text-sm font-normal leading-normal border-b-[0.5px] border-solid border-[#1E1E1E] py-4",
					tr: "[&>th]:h-[42px]",
				}}
			>
				<TableHeader columns={columns}>
					{(column) => (
						<TableColumn key={column.key} align={column.align as any} width={column.width}>
							{column.label}
						</TableColumn>
					)}
				</TableHeader>
				<TableBody
					items={data}
					loadingContent={<Spinner color="secondary" />}
					emptyContent="No nodes upgrades found."
				>
					{(item: IAllocationExplain) => (
						<TableRow key={`${item.index}-${item.shard}`}>
							{(columnKey) => (
								<TableCell>
									{columnKey === "decidersSet" ? (
										<Box className="flex flex-col gap-3">
											{item.decidersSet && item.decidersSet.length > 0 ? (
												item.decidersSet.map((decider) => {
													const info = DECIDER_EXPLANATIONS[decider] || {
														cause: "Unknown allocation block.",
														fix: "Check Elasticsearch logs for deeper details.",
													}

													return (
														<Box
															key={decider}
															className="flex flex-col p-3 gap-2.5 rounded-lg bg-[#161616] border border-[#2A2A2A] w-full"
														>
															<Box>
																<Chip
																	size="sm"
																	variant="flat"
																	color="warning"
																	className="text-[10px] h-5"
																>
																	{decider}
																</Chip>
															</Box>
															<Box className="flex items-start gap-2">
																<Typography
																	fontSize="12px"
																	color="#E5E0E0"
																	lineHeight="1.5"
																>
																	<span className="font-semibold text-[#BDA0FF]">
																		Cause:{" "}
																	</span>
																	{info.cause}
																</Typography>
															</Box>
															<Box className="flex items-start gap-2">
																<Typography
																	fontSize="12px"
																	color="#E5E0E0"
																	lineHeight="1.5"
																>
																	<span className="font-semibold text-[#A8E6CF]">
																		Fix:{" "}
																	</span>
																	{info.fix}
																</Typography>
															</Box>
														</Box>
													)
												})
											) : (
												<span className="text-xs text-[#B0B0B0]">N/A</span>
											)}
										</Box>
									) : columnKey === "explanation" ? (
										<span className="text-[#E5E0E0] first-letter:uppercase">
											{item[columnKey as keyof IAllocationExplain]}
										</span>
									) : columnKey === "fullExplanation" ? (
										<Accordion variant="light" className="px-0">
											<AccordionItem
												key="explain"
												aria-label="View Details"
												title={
													<span className="text-xs text-[#BDA0FF]">
														View Details ({item.fullExplanation.length})
													</span>
												}
												classNames={{
													title: "text-xs",
													content: "text-tiny text-[#B0B0B0] flex flex-col gap-2 pb-4",
												}}
											>
												{item.fullExplanation.map((text, idx) => (
													<div key={idx} className="border-l-2 border-[#BDA0FF] pl-2 py-1">
														{text}
													</div>
												))}
											</AccordionItem>
										</Accordion>
									) : (
										<span className="text-[#E5E0E0]">
											{item[columnKey as keyof IAllocationExplain]}
										</span>
									)}
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
