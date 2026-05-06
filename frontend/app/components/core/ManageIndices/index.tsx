import {
	Spinner,
	Table,
	TableBody,
	TableCell,
	TableColumn,
	TableHeader,
	TableRow,
	Tooltip,
	Tabs,
	Tab,
	Progress,
} from "@heroui/react"
import { Box, Typography } from "@mui/material"
import { useMutation, useQuery } from "@tanstack/react-query"
import { Convertshape2, TickCircle, Warning2, Trash, Refresh } from "iconsax-react"
import { useCallback, type Key, useState, useEffect } from "react"
import { useNavigate, useParams } from "react-router"
import { clusterUpgradeApi } from "~/apis/ClusterUpgradeApi"
import { OutlinedBorderButton } from "~/components/utilities/Buttons"
import AppBreadcrumb from "~/components/utilities/AppBreadcrumb"
import { toast } from "sonner"

const columns = [
	{ key: "name", label: "Index Name", align: "start" as const },
	{ key: "docsCount", label: "Docs Count", align: "start" as const },
	{ key: "size", label: "Total Size", align: "start" as const },
	{ key: "storageTier", label: "Storage Tier", align: "start" as const },
	{ key: "estimateSummary", label: "Reindex Estimate summary", align: "start" as const },
	{ key: "estimateTime", label: "Reindex Estimate time", align: "start" as const },
	{ key: "actions", label: "Actions", align: "end" as const },
]

type TaskProgress = {
	progressPercentage: number
	remainingDocs: number
	isCompleted: boolean
}

function ManageIndices() {
	const { clusterId } = useParams()
	const navigate = useNavigate()

	const [deletedIndices, setDeletedIndices] = useState<string[]>([])
	const [activeActionIndex, setActiveActionIndex] = useState<string | null>(null)
	const [activeTasks, setActiveTasks] = useState<Record<string, TaskProgress>>({})

	// Multi-Select State
	const [selectedKeys, setSelectedKeys] = useState<any>(new Set([]))

	const {
		data: migrationInfo,
		refetch: refetchMigrationInfo,
		isLoading: isLoadingMigrationInfo,
	} = useQuery({
		queryKey: ["migration-info", clusterId],
		queryFn: () => clusterUpgradeApi.getMigrationInfo(clusterId!),
		enabled: !!clusterId,
	})

	const { isPending: isMigratingSystemFeatures, mutate: migrateSystemFeatures } = useMutation({
		mutationFn: (data: { clusterId: string }) => clusterUpgradeApi.migrateSystemFeatures(data.clusterId),
		onSuccess: () => {
			toast.success("System features migration initiated.")
			refetchMigrationInfo()
		},
	})

	const { isPending: isReindexingSingle, mutate: reindexSingleIndex } = useMutation({
		mutationFn: (data: { clusterId: string; indexName: string }) =>
			clusterUpgradeApi.reindexSingle(data.clusterId, data.indexName),
		onSuccess: (data: any, variables) => {
			toast.success(data?.message || `Reindex started for ${variables.indexName}`)
			setActiveTasks((prev) => ({
				...prev,
				[variables.indexName]: { progressPercentage: 0, remainingDocs: 0, isCompleted: false },
			}))
		},
		onSettled: () => setActiveActionIndex(null),
	})

	const { isPending: isDeleting, mutate: deleteSingleIndex } = useMutation({
		mutationFn: (data: { clusterId: string; indexName: string }) =>
			clusterUpgradeApi.deleteIndex(data.clusterId, data.indexName),
		onSuccess: (data: any, variables) => {
			toast.success(data?.message || `Index deleted: ${variables.indexName}`)
			setDeletedIndices((prev) => [...prev, variables.indexName])
		},
		onSettled: () => setActiveActionIndex(null),
	})

	const systemIndicesStatus = migrationInfo?.systemIndices?.status
	const isSystemMigrationInProgress = systemIndicesStatus === "IN_PROGRESS"
	const isSystemMigrationCompleted =
		systemIndicesStatus === "NO_MIGRATION_NEEDED" || systemIndicesStatus === "COMPLETED"
	const isValidUpgradePath = migrationInfo?.isValidUpgradePath

	useEffect(() => {
		if (isSystemMigrationInProgress) {
			const interval = setInterval(() => refetchMigrationInfo(), 2000)
			return () => clearInterval(interval)
		}
	}, [isSystemMigrationInProgress, refetchMigrationInfo])

	useEffect(() => {
		if (!clusterId) return
		const indicesToPoll = Object.keys(activeTasks).filter((name) => !activeTasks[name].isCompleted)
		if (indicesToPoll.length === 0) return

		const intervalId = setInterval(() => {
			indicesToPoll.forEach(async (indexName) => {
				try {
					const status = await clusterUpgradeApi.checkReindexStatus(clusterId, indexName)

					if (status.progressPercentage === 0 && !status.taskId) {
						toast.error(
							`Reindex aborted for ${indexName}. It is likely empty. Please use Delete instead.`,
							{ duration: 6000 }
						)
						setActiveTasks((prev) => {
							const newTasks = { ...prev }
							delete newTasks[indexName]
							return newTasks
						})
						setActiveActionIndex(null)
						return
					}

					setActiveTasks((prev) => ({
						...prev,
						[indexName]: {
							progressPercentage: status.progressPercentage || 0,
							remainingDocs: status.remainingDocs || 0,
							isCompleted: status.progressPercentage === 100,
						},
					}))
				} catch (error) {
					console.error(`Failed to fetch status for ${indexName}`, error)
				}
			})
		}, 4000)
		return () => clearInterval(intervalId)
	}, [activeTasks, clusterId])

	const allIndices = migrationInfo?.reindexNeedingIndices || []
	const dataStreamList = allIndices.filter((item: any) => item.dataStream)
	const systemIndicesList = allIndices.filter((item: any) => item.systemIndex && !item.dataStream)
	const customIndicesList = allIndices.filter((item: any) => !item.systemIndex && !item.dataStream)

	const handleReindex = (indexName: string) => {
		if (clusterId) {
			setActiveActionIndex(indexName)
			reindexSingleIndex({ clusterId, indexName })
		}
	}

	const handleDelete = (indexName: string) => {
		if (clusterId) {
			setActiveActionIndex(indexName)
			deleteSingleIndex({ clusterId, indexName })
		}
	}

	// Bulk Action Handlers
	const handleBulkReindex = (currentList: any[]) => {
		if (!clusterId) return

		let keysToProcess: string[] = []
		if (selectedKeys === "all") {
			keysToProcess = currentList.map((i: any) => i.name)
		} else {
			keysToProcess = Array.from(selectedKeys) as string[]
		}

		keysToProcess.forEach((name) => {
			// Only reindex if not already processing or deleted
			if (!activeTasks[name] && !deletedIndices.includes(name)) {
				reindexSingleIndex({ clusterId, indexName: name })
			}
		})

		setSelectedKeys(new Set([])) // Clear checkboxes after firing
	}

	const handleBulkDelete = (currentList: any[]) => {
		if (!clusterId) return

		let keysToProcess: string[] = []
		if (selectedKeys === "all") {
			keysToProcess = currentList.map((i: any) => i.name)
		} else {
			keysToProcess = Array.from(selectedKeys) as string[]
		}

		keysToProcess.forEach((name) => {
			if (!activeTasks[name] && !deletedIndices.includes(name)) {
				deleteSingleIndex({ clusterId, indexName: name })
			}
		})

		setSelectedKeys(new Set([])) // Clear checkboxes after firing
	}

	const renderCell = useCallback(
		(row: any, columnKey: Key) => {
			const cellValue = row[columnKey as keyof typeof row]

			switch (columnKey) {
				case "name":
					return <span className="text-[#ADADAD] font-medium">{cellValue}</span>
				case "docsCount":
				case "size":
				case "storageTier":
				case "estimateSummary":
				case "estimateTime":
					return <span className="text-[#ADADAD]">{cellValue || "-"}</span>
				case "actions":
					if (deletedIndices.includes(row.name)) {
						return (
							<Box className="flex flex-row items-center justify-end w-full h-full">
								<Box className="bg-[#FF6B6B]/10 border border-[#FF6B6B]/20 px-3 py-1 rounded-md">
									<Typography color="#FF6B6B" fontSize="12px" fontWeight="600">
										Index Deleted
									</Typography>
								</Box>
							</Box>
						)
					}

					const localProgress = activeTasks[row.name]
					const isThisRowReindexing = isReindexingSingle && activeActionIndex === row.name
					const isThisRowDeleting = isDeleting && activeActionIndex === row.name
					const isAnyActionRunning = isReindexingSingle || isDeleting

					if (localProgress) {
						const isTaskCompleted = localProgress.isCompleted
						return (
							<Box className="flex flex-row items-center justify-end w-full h-full">
								<Box className="flex flex-col w-[200px] gap-1 justify-center">
									<Box className="flex justify-between items-center w-full">
										<Typography
											color={isTaskCompleted ? "#52D97F" : "#BDA0FF"}
											fontSize="12px"
											fontWeight="600"
											lineHeight="1"
										>
											{isTaskCompleted ? "Completed" : "Reindexing..."}
										</Typography>
										<Typography color="#FFF" fontSize="12px" fontWeight="600" lineHeight="1">
											{localProgress.progressPercentage}%
										</Typography>
									</Box>
									<Progress
										size="sm"
										aria-label="Reindexing progress"
										value={localProgress.progressPercentage}
										classNames={{
											track: "bg-[#2F2F2F] h-[4px]",
											indicator: isTaskCompleted
												? "bg-[#52D97F] h-[4px]"
												: "bg-[#BDA0FF] h-[4px]",
										}}
									/>
									<Typography color="#6E6E6E" fontSize="10px" textAlign="right" lineHeight="1">
										{isTaskCompleted
											? "Data converted successfully"
											: `${localProgress.remainingDocs.toLocaleString()} docs remaining`}
									</Typography>
								</Box>
							</Box>
						)
					}

					return (
						<Box className="flex flex-row items-center justify-end gap-2 w-full h-full">
							<Tooltip content="Delete Data (Permanent)" placement="top">
								<Box
									className={`flex items-center justify-center w-8 h-8 rounded-lg border transition-all ${
										isAnyActionRunning
											? "opacity-50 cursor-not-allowed border-[#FF6B6B]/30 bg-[#FF6B6B]/5"
											: "cursor-pointer border-[#FF6B6B]/30 bg-[#FF6B6B]/10 hover:bg-[#FF6B6B]/20 hover:border-[#FF6B6B]/50"
									}`}
									onClick={() => !isAnyActionRunning && handleDelete(row.name)}
								>
									{isThisRowDeleting ? (
										<Spinner size="sm" color="danger" />
									) : (
										<Trash size="16" color="#FF6B6B" />
									)}
								</Box>
							</Tooltip>
							<Tooltip content="Convert to new format" placement="top">
								<Box>
									<OutlinedBorderButton
										onClick={() => handleReindex(row.name)}
										disabled={!isValidUpgradePath || isAnyActionRunning}
									>
										<Box className="flex items-center gap-[6px]">
											{isThisRowReindexing ? (
												<Spinner size="sm" color="current" />
											) : (
												<Refresh size="14" />
											)}
											<span>Reindex</span>
										</Box>
									</OutlinedBorderButton>
								</Box>
							</Tooltip>
						</Box>
					)
				default:
					return cellValue
			}
		},
		[isValidUpgradePath, isReindexingSingle, isDeleting, activeActionIndex, activeTasks, deletedIndices]
	)

	const renderIndicesTable = (dataList: any[], emptyTitle: string, emptySub: string) => {
		// Build Dynamic Toolbar when items are selected
		const hasSelection = selectedKeys === "all" || selectedKeys.size > 0
		const selectedCount = selectedKeys === "all" ? dataList.length : selectedKeys.size

		const topContent = hasSelection ? (
			<Box className="flex flex-row items-center justify-between w-full bg-[#BDA0FF]/10 border border-[#BDA0FF]/20 rounded-xl p-3 mb-2 animate-appearance-in">
				<Typography color="#BDA0FF" fontSize="14px" fontWeight="600">
					{selectedCount} item{selectedCount !== 1 ? "s" : ""} selected
				</Typography>
				<Box className="flex items-center gap-3">
					<button
						onClick={() => handleBulkDelete(dataList)}
						className="flex items-center gap-2 px-3 py-1.5 rounded-lg border border-[#FF6B6B]/30 bg-[#FF6B6B]/10 text-[#FF6B6B] text-[13px] font-medium hover:bg-[#FF6B6B]/20 transition-all"
					>
						<Trash size="14" />
						Delete Selected
					</button>
					<button
						onClick={() => handleBulkReindex(dataList)}
						disabled={!isValidUpgradePath}
						className={`flex items-center gap-2 px-3 py-1.5 rounded-lg border text-[13px] font-medium transition-all ${
							isValidUpgradePath
								? "bg-[#BDA0FF] border-[#BDA0FF] text-[#0D0D0D] hover:bg-[#A886FF]"
								: "bg-[#3A3A3A] border-[#2F2F2F] text-[#6E6E6E] cursor-not-allowed"
						}`}
					>
						<Refresh size="14" variant="Bold" />
						Reindex Selected
					</button>
				</Box>
			</Box>
		) : null

		return (
			<Table
				removeWrapper
				layout="fixed"
				selectionMode="multiple" // Enables checkboxes
				selectedKeys={selectedKeys}
				onSelectionChange={setSelectedKeys}
				topContent={topContent}
				classNames={{
					base: "w-full h-auto",
					table: "w-full min-w-full",
					th: "text-[#9D90BB] text-xs bg-[#161616] first:rounded-l-xl last:rounded-r-xl border-none",
					td: "text-sm font-normal leading-normal border-b-[0.5px] border-solid border-[#1E1E1E] first:rounded-l-xl last:rounded-r-xl",
					tr: "[&>th]:h-[42px] [&>td]:h-[60px] hover:bg-[#28282A] transition-colors group-data-[selected=true]:bg-[#BDA0FF]/5",
				}}
			>
				<TableHeader columns={columns}>
					{(column) => (
						<TableColumn key={column.key} align={column.align}>
							{column.label}
						</TableColumn>
					)}
				</TableHeader>
				<TableBody
					items={
						dataList.map((item: any) => ({
							...item,
							uid: item.index || item.name,
							name: item.index || item.name,
						})) || []
					}
					isLoading={isLoadingMigrationInfo}
					loadingContent={<Spinner color="secondary" />}
					emptyContent={
						<Box className="flex flex-col items-center h-full w-full gap-4 py-10">
							<Box className="flex items-center justify-center bg-[#1A1A1A] rounded-[10px] size-12">
								<TickCircle size="24px" color="#52D97F" />
							</Box>
							<Box className="flex flex-col items-center gap-[5px]">
								<Typography color="#F1F0F0" fontSize="16px" fontWeight="400">
									{emptyTitle}
								</Typography>
								<Typography color="#A6A6A6" fontSize="12px" fontWeight="400">
									{emptySub}
								</Typography>
							</Box>
						</Box>
					}
				>
					{(item: any) => (
						<TableRow key={item.uid}>
							{(columnKey) => <TableCell>{renderCell(item, columnKey)}</TableCell>}
						</TableRow>
					)}
				</TableBody>
			</Table>
		)
	}

	return (
		<Box className="flex flex-col w-full min-h-full gap-6 pb-10">
			<Box className="flex flex-row justify-between items-center">
				<AppBreadcrumb
					items={[
						{
							label: "Assist",
							icon: <Convertshape2 size="14px" color="currentColor" />,
							onClick: () => navigate(`/${clusterId}/upgrade-assistant`),
						},
						{
							label: "Prepare Data for Upgrade",
							color: "#BDA0FF",
						},
					]}
				/>
			</Box>

			<Box className="flex flex-col gap-1 px-2">
				<Typography color="#FFF" fontSize="20px" fontWeight="600">
					Data Migration & Reindexing
				</Typography>
				<Typography color="#A6A6A6" fontSize="14px" fontWeight="400" className="max-w-7xl">
					Before upgrading your cluster, older data formats need to be converted to match the new system
					requirements.
				</Typography>
			</Box>

			{isValidUpgradePath != null && !isValidUpgradePath && (
				<Box className="flex flex-row items-center gap-2 p-4 rounded-xl bg-[#FFF7E6] border border-[#FFE066]">
					<Warning2 size="20" color="#B28C00" variant="Bold" />
					<Typography color="#665200" fontSize="14px" fontWeight="500">
						Currently the cluster is in view-only mode. Select a valid upgrade path to enable data
						migration.
					</Typography>
				</Box>
			)}

			<Box className="flex flex-col p-4 md:p-6 rounded-2xl bg-[#0d0d0d] border border-[#2F2F2F] gap-4">
				<Tabs
					aria-label="Indices Categories"
					variant="underlined"
					onSelectionChange={() => setSelectedKeys(new Set([]))} // Clear selections on tab switch
					classNames={{
						tabList: "gap-6 w-full relative rounded-none p-0 border-b border-[#2F2F2F]",
						cursor: "w-full bg-[#BDA0FF]",
						tab: "max-w-fit px-0 h-12",
						tabContent: "group-data-[selected=true]:text-[#FFF] text-[#ADADAD] text-base font-medium",
					}}
				>
					<Tab key="custom" title={`Custom Indices (${customIndicesList.length})`}>
						<Box className="flex flex-col gap-6 pt-4">
							<Box className="flex flex-col gap-1 max-w-7xl">
								<Box className="flex flex-row items-center gap-2">
									<Typography color="#FFF" fontSize="16px" fontWeight="600" lineHeight="normal">
										Your Application Data
									</Typography>
								</Box>
							</Box>
							{renderIndicesTable(
								customIndicesList,
								"Application Data Ready",
								"All of your custom data is already compatible."
							)}
						</Box>
					</Tab>

					<Tab key="system" title={`System Indices (${systemIndicesList.length})`}>
						<Box className="flex flex-col gap-6 pt-4">
							<Box className="flex flex-row justify-between items-start">
								<Box className="flex flex-col gap-1 max-w-4xl">
									<Typography color="#FFF" fontSize="16px" fontWeight="600" lineHeight="normal">
										Internal System Data
									</Typography>
								</Box>
								<Box className="pt-2">
									{isSystemMigrationInProgress ? (
										<Box className="flex flex-row w-fit items-center gap-2 px-[12px] py-[6px] rounded-3xl bg-[#BDA0FF]/10 text-[#BDA0FF] border border-[#BDA0FF]/20">
											<Spinner size="sm" color="current" />
											<span className="text-[13px] font-medium">Migrating System...</span>
										</Box>
									) : !isSystemMigrationCompleted || !isValidUpgradePath ? (
										<OutlinedBorderButton
											disabled={
												!isValidUpgradePath ||
												isMigratingSystemFeatures ||
												systemIndicesStatus === "MIGRATION_UNAVAILABLE"
											}
											onClick={() => migrateSystemFeatures({ clusterId: clusterId! })}
										>
											Auto-Migrate System
										</OutlinedBorderButton>
									) : (
										<Box className="flex flex-row w-fit items-center gap-2 px-[7px] py-[5px] rounded-3xl bg-[#52D97F21] text-[#52D97F]">
											<TickCircle size="16" color="#52D97F" variant="Bold" />
											Auto-Migration Complete
										</Box>
									)}
								</Box>
							</Box>
							{renderIndicesTable(
								systemIndicesList,
								"System Data Ready",
								"No older system data requires manual reindexing."
							)}
						</Box>
					</Tab>

					<Tab key="data-streams" title={`Data Streams (${dataStreamList.length})`}>
						<Box className="flex flex-col gap-6 pt-4">
							<Box className="flex flex-col gap-1 max-w-7xl">
								<Typography color="#FFF" fontSize="16px" fontWeight="600" lineHeight="normal">
									Data Streams
								</Typography>
							</Box>
							{renderIndicesTable(
								dataStreamList,
								"Data Streams Ready",
								"All of your data streams are already compatible."
							)}
						</Box>
					</Tab>
				</Tabs>
			</Box>
		</Box>
	)
}

export default ManageIndices
