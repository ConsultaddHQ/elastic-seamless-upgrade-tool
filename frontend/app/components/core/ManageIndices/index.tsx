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
import { Convertshape2, TickCircle, Warning2, Trash, Refresh, DocumentCopy, Copy } from "iconsax-react"
import { useCallback, type Key, useState, useEffect, useMemo } from "react"
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

	const [selectedKeys, setSelectedKeys] = useState<any>(new Set([]))

	// Disable checkboxes for rows that are already processing or deleted
	const disabledKeys = useMemo(() => {
		return new Set([...deletedIndices, ...Object.keys(activeTasks)])
	}, [deletedIndices, activeTasks])

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
		onError: (error: any) => toast.error(error?.message || "Failed to initiate system migration."),
	})

	const { isPending: isReindexingSingle, mutate: reindexSingleIndex } = useMutation({
		mutationFn: (data: { clusterId: string; indexName: string }) =>
			clusterUpgradeApi.reindexSingle(data.clusterId, data.indexName),
		onSuccess: (data: any, variables) => {
			setActiveTasks((prev) => ({
				...prev,
				[variables.indexName]: { progressPercentage: 0, remainingDocs: 0, isCompleted: false },
			}))
		},
		onError: (error: any) => toast.error(error?.message || "Failed to start reindex process."),
		onSettled: () => setActiveActionIndex(null),
	})

	const { isPending: isDeleting, mutate: deleteSingleIndex } = useMutation({
		mutationFn: (data: { clusterId: string; indexName: string }) =>
			clusterUpgradeApi.deleteIndex(data.clusterId, data.indexName),
		onSuccess: (data: any, variables) => {
			setDeletedIndices((prev) => [...prev, variables.indexName])
		},
		onError: (error: any) => toast.error(error?.message || "Failed to delete index."),
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

	// =========================================================================
	// ACTION HANDLERS
	// =========================================================================
	const handleReindex = (indexName: string) => {
		if (clusterId) {
			setActiveActionIndex(indexName)
			reindexSingleIndex({ clusterId, indexName })
			toast.success(`Reindex started for ${indexName}`)
		}
	}

	const handleDelete = (indexName: string) => {
		if (clusterId) {
			setActiveActionIndex(indexName)
			deleteSingleIndex({ clusterId, indexName })
			toast.success(`Index deleted: ${indexName}`)
		}
	}

	const handleBulkReindex = (filteredList: any[]) => {
		if (!clusterId) return
		const keysToProcess =
			selectedKeys === "all" ? filteredList.map((i: any) => i.name) : (Array.from(selectedKeys) as string[])
		const validKeys = keysToProcess.filter((name) => !activeTasks[name] && !deletedIndices.includes(name))

		if (validKeys.length > 0) {
			validKeys.forEach((name) => reindexSingleIndex({ clusterId, indexName: name }))
			toast.success(`Bulk reindex initiated for ${validKeys.length} indices`)
		}
		setSelectedKeys(new Set([]))
	}

	const handleBulkDelete = (filteredList: any[]) => {
		if (!clusterId) return
		const keysToProcess =
			selectedKeys === "all" ? filteredList.map((i: any) => i.name) : (Array.from(selectedKeys) as string[])
		const validKeys = keysToProcess.filter((name) => !activeTasks[name] && !deletedIndices.includes(name))

		if (validKeys.length > 0) {
			validKeys.forEach((name) => deleteSingleIndex({ clusterId, indexName: name }))
			toast.success(`Bulk delete initiated for ${validKeys.length} indices`)
		}
		setSelectedKeys(new Set([]))
	}

	// Intercept row clicks so clicking text doesn't select the checkbox
	const stopClick = (e: React.MouseEvent) => e.stopPropagation()

	const renderCell = useCallback(
		(row: any, columnKey: Key) => {
			const cellValue = row[columnKey as keyof typeof row]
			const localProgress = activeTasks[row.name]
			const isThisRowReindexing = isReindexingSingle && activeActionIndex === row.name
			const isThisRowDeleting = isDeleting && activeActionIndex === row.name
			const isAnyActionRunning = isReindexingSingle || isDeleting

			switch (columnKey) {
				case "name":
					return (
						<div onClick={stopClick} className="flex items-center gap-3 w-full cursor-default py-2 group">
							<span className="text-[#ADADAD] font-medium break-all">{cellValue}</span>
							<Tooltip content="Copy name" placement="top">
								<button
									onClick={(e) => {
										e.stopPropagation()
										navigator.clipboard.writeText(cellValue)
										toast.success("Copied to clipboard", { duration: 2000 })
									}}
									className="opacity-0 group-hover:opacity-100 p-[5px] rounded border border-[#2F2F2F] bg-[#1E1E1E] text-[#ADADAD] hover:bg-[#BDA0FF]/10 hover:border-[#BDA0FF]/30 hover:text-[#BDA0FF] transition-all flex-shrink-0"
								>
									<DocumentCopy size="14" color="#FF8A65" />
								</button>
							</Tooltip>
						</div>
					)
				case "docsCount":
				case "size":
				case "storageTier":
				case "estimateSummary":
				case "estimateTime":
					return (
						<div onClick={stopClick} className="w-full h-full flex items-center cursor-default">
							<span className="text-[#ADADAD]">{cellValue || "-"}</span>
						</div>
					)
				case "actions":
					if (localProgress) {
						return (
							<div
								onClick={stopClick}
								className="flex flex-row items-center justify-end w-full h-full cursor-default"
							>
								<Box className="flex flex-col w-[200px] gap-1 justify-center">
									<Box className="flex justify-between items-center w-full">
										<Typography color="#BDA0FF" fontSize="12px" fontWeight="600" lineHeight="1">
											Reindexing...
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
											indicator: "bg-[#BDA0FF] h-[4px]",
										}}
									/>
									<Typography color="#6E6E6E" fontSize="10px" textAlign="right" lineHeight="1">
										{`${localProgress.remainingDocs.toLocaleString()} docs remaining`}
									</Typography>
								</Box>
							</div>
						)
					}

					return (
						<div
							onClick={stopClick}
							className="flex flex-row items-center justify-end gap-3 w-full h-full cursor-default"
						>
							<button
								onClick={(e) => {
									e.stopPropagation()
									!isAnyActionRunning && handleDelete(row.name)
								}}
								disabled={isAnyActionRunning}
								className={`flex items-center justify-center gap-[6px] px-3 py-1.5 rounded-lg border transition-all text-[12px] font-medium outline-none ${
									isAnyActionRunning
										? "opacity-50 cursor-not-allowed border-[#FF6B6B]/20 bg-[#FF6B6B]/5 text-[#FF6B6B]/50"
										: "cursor-pointer border-[#FF6B6B]/30 bg-[#FF6B6B]/10 hover:bg-[#FF6B6B]/20 hover:border-[#FF6B6B]/50 text-[#FF6B6B] active:scale-95"
								}`}
							>
								{isThisRowDeleting ? (
									<Spinner size="sm" color="danger" />
								) : (
									<Trash size="14" color="white" />
								)}
								<span>Delete</span>
							</button>

							<button
								onClick={(e) => {
									e.stopPropagation()
									isValidUpgradePath && !isAnyActionRunning && handleReindex(row.name)
								}}
								disabled={!isValidUpgradePath || isAnyActionRunning}
								className={`flex items-center justify-center gap-[6px] px-3 py-1.5 rounded-lg border transition-all text-[12px] font-medium outline-none ${
									!isValidUpgradePath || isAnyActionRunning
										? "opacity-50 cursor-not-allowed border-[#BDA0FF]/20 bg-[#BDA0FF]/5 text-[#BDA0FF]/50"
										: "cursor-pointer border-[#BDA0FF]/30 bg-[#BDA0FF]/10 hover:bg-[#BDA0FF]/20 hover:border-[#BDA0FF]/50 text-[#BDA0FF] active:scale-95"
								}`}
							>
								{isThisRowReindexing ? (
									<Spinner size="sm" color="current" />
								) : (
									<Refresh size="14" color="white" />
								)}
								<span>Reindex</span>
							</button>
						</div>
					)
				default:
					return cellValue
			}
		},
		[isValidUpgradePath, isReindexingSingle, isDeleting, activeActionIndex, activeTasks]
	)

	const renderIndicesTable = (dataList: any[], emptyTitle: string, emptySub: string) => {
		// FILTER: Completely remove deleted and fully reindexed items from the UI array instantly
		const filteredList = dataList.filter(
			(item: any) => !deletedIndices.includes(item.name) && !activeTasks[item.name]?.isCompleted
		)

		const hasSelection = selectedKeys === "all" || selectedKeys.size > 0
		const selectedCount = selectedKeys === "all" ? filteredList.length : selectedKeys.size

		const topContent = hasSelection ? (
			<Box className="flex flex-row items-center justify-between w-full bg-[#BDA0FF]/10 border border-[#BDA0FF]/20 rounded-xl p-3 mb-2 animate-appearance-in">
				<Typography color="#BDA0FF" fontSize="14px" fontWeight="600">
					{selectedCount} item{selectedCount !== 1 ? "s" : ""} selected
				</Typography>
				<Box className="flex items-center gap-3">
					<button
						onClick={() => handleBulkDelete(filteredList)}
						className="flex items-center gap-2 px-3 py-1.5 rounded-lg border border-[#FF6B6B]/30 bg-[#FF6B6B]/10 text-[#FF6B6B] text-[13px] font-medium hover:bg-[#FF6B6B]/20 transition-all active:scale-95 outline-none"
					>
						<Trash color="white" size="14" />
						Delete Selected
					</button>
					<button
						onClick={() => handleBulkReindex(filteredList)}
						disabled={!isValidUpgradePath}
						className={`flex items-center gap-2 px-3 py-1.5 rounded-lg border text-[13px] font-medium transition-all outline-none ${
							isValidUpgradePath
								? "bg-[#BDA0FF] border-[#BDA0FF] text-[#0D0D0D] hover:bg-[#A886FF] active:scale-95"
								: "bg-[#3A3A3A] border-[#2F2F2F] text-[#6E6E6E] cursor-not-allowed"
						}`}
					>
						<Refresh color="white" size="14" variant="Bold" />
						Reindex Selected
					</button>
				</Box>
			</Box>
		) : null

		return (
			<Table
				selectionBehavior="toggle"
				disallowEmptySelection={false}
				onRowAction={() => {}} // disables row click selection
				removeWrapper
				layout="fixed"
				selectionMode="multiple"
				selectedKeys={selectedKeys}
				onSelectionChange={setSelectedKeys}
				disabledKeys={disabledKeys}
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
						<TableColumn
							key={column.key}
							align={column.align}
							className={
								column.key === "name" ? "w-[40%]" : column.key === "actions" ? "w-[24%]" : "w-auto"
							}
						>
							{column.label}
						</TableColumn>
					)}
				</TableHeader>
				<TableBody
					items={
						filteredList.map((item: any) => ({
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
					onSelectionChange={() => setSelectedKeys(new Set([]))}
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
