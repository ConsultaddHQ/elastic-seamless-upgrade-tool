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
} from "@heroui/react"
import { Box, Typography } from "@mui/material"
import { useMutation, useQuery } from "@tanstack/react-query"
import { Convertshape2, Folder, InfoCircle, TickCircle, Warning2, Trash, Refresh } from "iconsax-react"
import { useCallback, type Key } from "react"
import { useNavigate, useParams } from "react-router"
import { clusterUpgradeApi } from "~/apis/ClusterUpgradeApi"
import { OutlinedBorderButton } from "~/components/utilities/Buttons"
import AppBreadcrumb from "~/components/utilities/AppBreadcrumb"
import { toast } from "sonner" // <-- Added Sonner import

const columns = [
	{ key: "name", label: "Index Name", align: "start" as const },
	{ key: "docsCount", label: "Docs Count", align: "start" as const },
	{ key: "size", label: "Total Size", align: "start" as const },
	{ key: "storageTier", label: "Storage Tier", align: "start" as const },
	{ key: "estimateSummary", label: "Reindex Estimate summary", align: "start" as const },
	{ key: "estimateTime", label: "Reindex Estimate time", align: "start" as const },
	{ key: "actions", label: "Actions", align: "end" as const },
]

function ManageIndices() {
	const { clusterId } = useParams()
	const navigate = useNavigate()

	const {
		data: migrationInfo,
		refetch: refetchMigrationInfo,
		isLoading: isLoadingMigrationInfo,
	} = useQuery({
		queryKey: ["migration-info", clusterId],
		queryFn: () => clusterUpgradeApi.getMigrationInfo(clusterId!),
		enabled: !!clusterId,
	})

	// Auto-Migrate System Features
	const { isPending: isMigratingSystemFeatures, mutate: migrateSystemFeatures } = useMutation({
		mutationFn: (data: { clusterId: string }) => clusterUpgradeApi.migrateSystemFeatures(data.clusterId),
		onSuccess: () => {
			toast.success("System features migration initiated successfully.")
			refetchMigrationInfo()
		},
		onError: (error: any) => {
			const errorMessage = error.response?.data?.message || "Failed to migrate system features."
			toast.error(errorMessage)
		},
	})

	// Single Index Reindex
	const { isPending: isReindexingSingle, mutate: reindexSingleIndex } = useMutation({
		mutationFn: (data: { clusterId: string; indexName: string }) =>
			clusterUpgradeApi.reindexSingle(data.clusterId, data.indexName),
		onSuccess: (data: any) => {
			toast.success(data?.message || "Reindex initiated successfully.")
			refetchMigrationInfo()
		},
		onError: (error: any) => {
			const errorMessage = error.response?.data?.message || "Failed to reindex the target index."
			toast.error(errorMessage)
		},
	})

	// Single Index Delete
	const { isPending: isDeleting, mutate: deleteSingleIndex } = useMutation({
		mutationFn: (data: { clusterId: string; indexName: string }) =>
			clusterUpgradeApi.deleteIndex(data.clusterId, data.indexName),
		onSuccess: (data: any) => {
			// Displays the specific success message from your Spring Boot response
			toast.success(data?.message || "Index deleted successfully.")
			refetchMigrationInfo()
		},
		onError: (error: any) => {
			// Captures your Spring Boot error message or falls back to a generic one
			const errorMessage = error.response?.data?.message || "An unexpected error occurred while deleting."
			toast.error(errorMessage)
		},
	})

	const systemIndicesStatus = migrationInfo?.systemIndices?.status
	const isSystemMigrationInProgress = systemIndicesStatus === "IN_PROGRESS"
	const isSystemMigrationCompleted =
		systemIndicesStatus === "NO_MIGRATION_NEEDED" || systemIndicesStatus === "COMPLETED"

	const isValidUpgradePath = migrationInfo?.isValidUpgradePath

	// Separate the indices into Custom and System lists
	const allIndices = migrationInfo?.reindexNeedingIndices || []
	const systemIndicesList = allIndices.filter((item: any) => item.systemIndex)
	const customIndicesList = allIndices.filter((item: any) => !item.systemIndex)

	const handleReindex = (indexName: string) => {
		if (clusterId) reindexSingleIndex({ clusterId, indexName })
	}

	const handleDelete = (indexName: string) => {
		if (clusterId) deleteSingleIndex({ clusterId, indexName })
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
					return (
						<Box className="flex flex-row items-center justify-end gap-3">
							<Tooltip content="Delete Data (Permanent)" placement="top">
								<Box
									className={`transition-opacity ${
										isDeleting ? "opacity-50 cursor-not-allowed" : "cursor-pointer hover:opacity-70"
									}`}
									onClick={() => !isDeleting && handleDelete(row.name)}
								>
									<Trash size="18" color="#FF6B6B" />
								</Box>
							</Tooltip>
							<Tooltip content="Convert to new format" placement="top">
								<Box>
									<OutlinedBorderButton
										onClick={() => handleReindex(row.name)}
										disabled={!isValidUpgradePath || isReindexingSingle || isDeleting}
									>
										<Box className="flex items-center gap-2">
											{isReindexingSingle ? (
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
		[isValidUpgradePath, isReindexingSingle, isDeleting] // <-- Added isDeleting to dependencies
	)

	// Helper function to render a table
	const renderIndicesTable = (dataList: any[], emptyTitle: string, emptySub: string) => (
		<Table
			removeWrapper
			layout="fixed"
			classNames={{
				base: "w-full h-auto",
				table: "w-full min-w-full",
				th: "text-[#9D90BB] text-xs bg-[#161616] first:rounded-l-xl last:rounded-r-xl border-none",
				td: "text-sm font-normal leading-normal border-b-[0.5px] border-solid border-[#1E1E1E] first:rounded-l-xl last:rounded-r-xl",
				tr: "[&>th]:h-[42px] [&>td]:h-[60px] hover:bg-[#28282A] transition-colors",
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

			{/* Non-Technical Page Introduction */}
			<Box className="flex flex-col gap-1 px-2">
				<Typography color="#FFF" fontSize="20px" fontWeight="600">
					Data Migration & Reindexing
				</Typography>
				<Typography color="#A6A6A6" fontSize="14px" fontWeight="400" className="max-w-7xl">
					Before upgrading your cluster, older data formats need to be converted to match the new system
					requirements. This conversion process is called <strong>Reindexing</strong>. Below, you can
					automatically migrate system configurations and manually convert your application data so everything
					works smoothly after the upgrade.
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

			{/* =========================================
                TABS CONTAINER
            ========================================= */}
			<Box className="flex flex-col p-4 md:p-6 rounded-2xl bg-[#0d0d0d] border border-[#2F2F2F] gap-4">
				<Tabs
					aria-label="Indices Categories"
					variant="underlined"
					classNames={{
						tabList: "gap-6 w-full relative rounded-none p-0 border-b border-[#2F2F2F]",
						cursor: "w-full bg-[#BDA0FF]",
						tab: "max-w-fit px-0 h-12",
						tabContent: "group-data-[selected=true]:text-[#FFF] text-[#ADADAD] text-base font-medium",
					}}
				>
					{/* TAB 1: CUSTOM INDICES */}
					<Tab key="custom" title={`Custom Indices (${customIndicesList.length})`}>
						<Box className="flex flex-col gap-6 pt-4">
							<Box className="flex flex-col gap-1 max-w-7xl">
								<Box className="flex flex-row items-center gap-2">
									<Typography color="#FFF" fontSize="16px" fontWeight="600" lineHeight="normal">
										Your Application Data
									</Typography>
									<Tooltip
										content="Indices created by your applications and data ingestion pipelines."
										placement="top"
									>
										<Box className="cursor-pointer">
											<InfoCircle size="16" color="#ADADAD" />
										</Box>
									</Tooltip>
								</Box>
								<Typography color="#6E6E6E" fontSize="13px" fontWeight="400">
									This is your actual business data and application logs. You must manually initiate a{" "}
									<strong>Reindex</strong> for these older indices so your applications can continue
									reading them after the upgrade. Unneeded logs can safely be deleted.
								</Typography>
							</Box>

							{/* Render Custom Indices Table */}
							{renderIndicesTable(
								customIndicesList,
								"Application Data Ready",
								"All of your custom data is already compatible with the target version."
							)}
						</Box>
					</Tab>

					{/* TAB 2: SYSTEM INDICES */}
					<Tab key="system" title={`System Indices (${systemIndicesList.length})`}>
						<Box className="flex flex-col gap-6 pt-4">
							<Box className="flex flex-row justify-between items-start">
								<Box className="flex flex-col gap-1 max-w-4xl">
									<Box className="flex flex-row items-center gap-2">
										<Typography color="#FFF" fontSize="16px" fontWeight="600" lineHeight="normal">
											Internal System Data
										</Typography>
										<Tooltip
											content="Hidden indices that store Kibana dashboards, users, and automated tasks."
											placement="top"
										>
											<Box className="cursor-pointer">
												<InfoCircle size="16" color="#ADADAD" />
											</Box>
										</Tooltip>
									</Box>
									<Typography color="#6E6E6E" fontSize="13px" fontWeight="400">
										These indices power the internal mechanics of your cluster. Click{" "}
										<strong>Migrate</strong> to let the system automatically update standard
										configurations. Any leftover legacy system files shown in the table below must
										be manually reindexed or deleted.
									</Typography>
								</Box>

								<Box className="pt-2">
									{isSystemMigrationInProgress ? (
										<Typography color="#6E6E6E" fontSize="13px">
											Migrating system features...
										</Typography>
									) : !isSystemMigrationCompleted || !isValidUpgradePath ? (
										<Tooltip
											content={!isValidUpgradePath ? "Cluster is in view only mode" : null}
											isDisabled={!!isValidUpgradePath}
											placement="top"
										>
											<Box>
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
											</Box>
										</Tooltip>
									) : (
										<Box className="flex flex-row w-fit items-center gap-2 px-[7px] py-[5px] rounded-3xl bg-[#52D97F21] text-[#52D97F]">
											<TickCircle size="16" color="#52D97F" variant="Bold" />
											Auto-Migration Complete
										</Box>
									)}
								</Box>
							</Box>

							{/* Render System Indices Table */}
							{renderIndicesTable(
								systemIndicesList,
								"System Data Ready",
								"No older system data requires manual reindexing."
							)}
						</Box>
					</Tab>
				</Tabs>
			</Box>
		</Box>
	)
}

export default ManageIndices
