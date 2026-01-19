import { Spinner, Table, TableBody, TableCell, TableColumn, TableHeader, TableRow } from "@heroui/react"
import { Box, Breadcrumbs, Typography } from "@mui/material"
import { useQuery } from "@tanstack/react-query"
import { ArrowRight2, Convertshape2, Folder } from "iconsax-react"
import { useCallback, type Key } from "react"
import { Link, useParams } from "react-router"
import { clusterUpgradeApi } from "~/apis/ClusterUpgradeApi"
import { cn } from "~/lib/Utils"

const columns = [
	{
		key: "name",
		label: "Name",
		align: "start" as const,
	},
	{
		key: "size",
		label: "Size",
		align: "start" as const,
	},
	{
		key: "docsCount",
		label: "Docs Count",
		align: "start" as const,
	},
	{
		key: "migrated",
		label: "Migrated",
		align: "start" as const,
	},
]

function MigrateCustomIndices() {
	const { clusterId } = useParams()

	const { data, isLoading } = useQuery({
		queryKey: ["custom-indices-migration", clusterId],
		queryFn: () => clusterUpgradeApi.getCustomIndicesToMigrate(clusterId!),
		enabled: !!clusterId,
	})

	const renderCell = useCallback((row: any, columnKey: Key) => {
		const cellValue = row[columnKey as keyof typeof row]
		switch (columnKey) {
			case "name":
				return <span className="text-[#ADADAD]">{cellValue}</span>
			case "size":
				return <span className="text-[#ADADAD]">{cellValue}</span>
			case "docsCount":
				return <span className="text-[#ADADAD]">{cellValue}</span>
			case "migrated":
				return (
					<Box
						className={cn(
							"flex flex-row w-fit items-center gap-2 px-[7px] py-[5px] rounded-3xl capitalize",
							{
								"bg-[#52D97F21] text-[#52D97F]": cellValue === true,
								"bg-[#E7554721] text-[#E75547]": cellValue === false,
							}
						)}
					>
						<span
							className={cn("w-[6px] h-[6px] min-h-[6px] min-w-[6px] rounded-sm", {
								"bg-[#52D97F]": cellValue === true,
								"bg-[#E75547]": cellValue === false,
							})}
						/>
						{cellValue ? "Yes" : "No"}
					</Box>
				)
			default:
				return cellValue
		}
	}, [])

	return (
		<Box className="flex w-full p-px rounded-2xl" sx={{ background: "radial-gradient(#6E687C, #1D1D1D)" }}>
			<Box className="flex flex-col gap-4 w-full rounded-2xl bg-[#0d0d0d]" padding="16px 24px">
				<Box className="flex flex-row gap-2 justify-between items-center pl-2">
					{/* Breadcrumb Navigation */}
					<Box
						className="flex gap-[6px] w-max items-center rounded-lg border border-solid border-[#2F2F2F] bg-[#141415]"
						padding="6px 10px 8px 10px"
					>
						<Breadcrumbs separator={<ArrowRight2 color="#ADADAD" size="14px" />}>
							<Link to={`/${clusterId}/upgrade-assistant`}>
								<Typography
									className="flex items-center gap-[6px]"
									color="#ADADAD"
									fontSize="12px"
									fontWeight="500"
									lineHeight="normal"
								>
									<Convertshape2 color="currentColor" size="14px" /> Assist
								</Typography>
							</Link>
							<Typography color="#BDA0FF" fontSize="12px" fontWeight="500" lineHeight="normal">
								Migrate Custom Indices
							</Typography>
						</Breadcrumbs>
					</Box>
				</Box>
				<Table
					removeWrapper
					layout="auto"
					isHeaderSticky
					classNames={{
						base: "max-h-[calc(var(--window-height)-212px)] h-[calc(var(--window-height)-212px)] overflow-scroll",
						th: "text-[#9D90BB] text-xs bg-[#161616] first:rounded-l-xl last:rounded-r-xl",
						td: "text-sm font-normal leading-normal border-b-[0.5px] border-solid border-[#1E1E1E] first:rounded-l-xl last:rounded-r-xl",
						tr: "[&>th]:h-[42px] [&>td]:h-[60px] hover:bg-[#28282A]",
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
							data?.map((item: any) => ({
								...item,
								uid: item.index,
								name: item.index,
								migrated: false, // Default to false as API doesn't return this
							})) || []
						}
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
										No indices to migrate
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

export default MigrateCustomIndices
