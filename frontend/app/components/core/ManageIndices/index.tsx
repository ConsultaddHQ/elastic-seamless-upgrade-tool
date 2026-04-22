import { Spinner, Table, TableBody, TableCell, TableColumn, TableHeader, TableRow, Tooltip } from "@heroui/react"
import { Box, Typography } from "@mui/material"
import { useMutation, useQuery } from "@tanstack/react-query"
import { Convertshape2, Folder, InfoCircle, TickCircle, Warning2, Trash, Refresh } from "iconsax-react"
import { useCallback, type Key } from "react"
import { useNavigate, useParams } from "react-router"
import { clusterUpgradeApi } from "~/apis/ClusterUpgradeApi"
import { OutlinedBorderButton } from "~/components/utilities/Buttons"
import AppBreadcrumb from "~/components/utilities/AppBreadcrumb"

// Updated to match the design requirements
const columns = [
	{ key: "name", label: "Index Name", align: "start" as const },
	{ key: "size", label: "Total Size", align: "start" as const },
	{ key: "storageTier", label: "Storage Tier", align: "start" as const },
	{ key: "systemIndex", label: "System Index", align: "start" as const },
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

	const { isPending: isMigratingSystemFeatures, mutate: migrateSystemFeatures } = useMutation({
		mutationFn: (data: { clusterId: string }) => clusterUpgradeApi.migrateSystemFeatures(data.clusterId),
		onSuccess: () => {
			refetchMigrationInfo()
		},
	})

	// Single Index Reindex Mutation
	const { isPending: isReindexingSingle, mutate: reindexSingleIndex } = useMutation({
		mutationFn: (data: { clusterId: string; indexName: string }) =>
			clusterUpgradeApi.reindexSingle(data.clusterId, data.indexName),
		onSuccess: () => {
			refetchMigrationInfo()
		},
	})

	// Single Index Delete Mutation
	const { isPending: isDeleting, mutate: deleteSingleIndex } = useMutation({
		mutationFn: (data: { clusterId: string; indexName: string }) =>
			clusterUpgradeApi.deleteIndex(data.clusterId, data.indexName),
		onSuccess: () => {
			refetchMigrationInfo()
		},
	})

	const systemIndicesStatus = migrationInfo?.systemIndices?.status
	const isSystemMigrationInProgress = systemIndicesStatus === "IN_PROGRESS"
	const isSystemMigrationCompleted =
		systemIndicesStatus === "NO_MIGRATION_NEEDED" || systemIndicesStatus === "COMPLETED"

	const reindexNeedingIndices = migrationInfo?.reindexNeedingIndices
	const isValidUpgradePath = migrationInfo?.isValidUpgradePath

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
				case "size":
				case "storageTier":
				case "estimateSummary":
				case "estimateTime":
					return <span className="text-[#ADADAD]">{cellValue || "-"}</span>
				case "systemIndex":
					return (
						<span className={cellValue ? "text-[#BDA0FF]" : "text-[#ADADAD]"}>
							{cellValue ? "true" : "false"}
						</span>
					)
				case "actions":
					return (
						<Box className="flex flex-row items-center justify-end gap-3">
							<Tooltip content="Delete Index" placement="top">
								<Box
									className="cursor-pointer hover:opacity-70 transition-opacity"
									onClick={() => handleDelete(row.name)}
								>
									<Trash size="18" color="#FF6B6B" />
								</Box>
							</Tooltip>
							<Tooltip content="Start Reindex" placement="top">
								<Box>
									<OutlinedBorderButton
										onClick={() => handleReindex(row.name)}
										disabled={!isValidUpgradePath || isReindexingSingle}
									>
										<Box className="flex items-center gap-2">
											<Refresh size="14" />
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
		[isValidUpgradePath, isReindexingSingle]
	)

	return (
		<Box className="flex flex-col w-full h-full gap-6">
			<Box className="flex flex-row justify-between items-center">
				<AppBreadcrumb
					items={[
						{
							label: "Assist",
							icon: <Convertshape2 size="14px" color="currentColor" />,
							onClick: () => navigate(`/${clusterId}/upgrade-assistant`),
						},
						{
							label: "Migrate Indices",
							color: "#BDA0FF",
						},
					]}
				/>
			</Box>

			{isValidUpgradePath != null && !isValidUpgradePath && (
				<Box className="flex flex-row items-center gap-2 p-4 rounded-xl bg-[#FFF7E6] border border-[#FFE066]">
					<Warning2 size="20" color="#B28C00" variant="Bold" />
					<Typography color="#665200" fontSize="14px" fontWeight="500">
						Currently the cluster is in view only mode, Select a valid upgrade path to migrate features and
						indices
					</Typography>
				</Box>
			)}

			{/* System Indices Section */}
			<Box className="flex flex-col p-6 rounded-2xl bg-[#0d0d0d] border border-[#2F2F2F] gap-4">
				<Box className="flex flex-row justify-between items-center">
					<Box className="flex flex-col gap-1">
						<Typography color="#FFF" fontSize="16px" fontWeight="600" lineHeight="normal">
							Migrate system indices
						</Typography>
						<Typography color="#6E6E6E" fontSize="13px" fontWeight="400">
							Prepare the system indices that store internal information for the upgrade. This step is
							required only for major version upgrades.
						</Typography>
					</Box>
					<Box>
						{isSystemMigrationInProgress ? (
							<Typography color="#6E6E6E" fontSize="13px">
								Migrating system features...
							</Typography>
						) : !isSystemMigrationCompleted || !isValidUpgradePath ? (
							<Tooltip
								content={
									!isValidUpgradePath
										? "Cluster is in view only mode"
										: systemIndicesStatus === "MIGRATION_UNAVAILABLE"
										? "migrating system indices is available fom version 7.16, you need to manually reindex or delete them to continue"
										: null
								}
								isDisabled={!!isValidUpgradePath && systemIndicesStatus !== "MIGRATION_UNAVAILABLE"}
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
										Migrate
									</OutlinedBorderButton>
								</Box>
							</Tooltip>
						) : (
							<Box className="flex flex-row w-fit items-center gap-2 px-[7px] py-[5px] rounded-3xl bg-[#52D97F21] text-[#52D97F]">
								<TickCircle size="16" color="#52D97F" variant="Bold" />
								Completed
							</Box>
						)}
					</Box>
				</Box>
			</Box>

			{/* Custom Indices Section */}
			<Box className="flex flex-col flex-grow p-6 rounded-2xl bg-[#0d0d0d] border border-[#2F2F2F] gap-4 overflow-hidden">
				<Box className="flex flex-row justify-between items-center">
					<Box className="flex flex-row items-center gap-2">
						<Typography color="#FFF" fontSize="16px" fontWeight="600" lineHeight="normal">
							Reindex Indices
						</Typography>
						<Tooltip content="Reindex legacy backing indices" placement="top">
							<Box className="cursor-pointer">
								<InfoCircle size="16" color="#ADADAD" />
							</Box>
						</Tooltip>
					</Box>
				</Box>

				<Table
					removeWrapper
					layout="auto"
					isHeaderSticky
					classNames={{
						base: "h-full overflow-scroll",
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
							reindexNeedingIndices?.map((item: any) => ({
								...item,
								uid: item.index || item.name,
								name: item.index || item.name,
							})) || []
						}
						isLoading={isLoadingMigrationInfo}
						loadingContent={<Spinner color="secondary" />}
						emptyContent={
							<Box className="flex flex-col items-center h-full w-full gap-4 pt-20">
								<Box className="flex items-center justify-center bg-[#1A1A1A] rounded-[10px] size-12">
									<Folder size="24px" color="#ADADAD" />
								</Box>
								<Box className="flex flex-col items-center gap-[5px]">
									<Typography color="#F1F0F0" fontSize="16px" fontWeight="400">
										No indices to migrate
									</Typography>
									<Typography color="#A6A6A6" fontSize="12px" fontWeight="400">
										There are no indices requiring migration at this time.
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
			</Box>
		</Box>
	)
}

export default ManageIndices
