import { Spinner, Table, TableBody, TableCell, TableColumn, TableHeader, TableRow } from "@heroui/react"
import { Box, Typography } from "@mui/material"
import { useQuery } from "@tanstack/react-query"
import { Edit, Folder } from "iconsax-react"
import { type Key, useCallback, useState } from "react"
import axiosJSON from "~/apis/http"
import { cn } from "~/lib/Utils"
import { OutlinedBorderButton } from "~/components/utilities/Buttons"
import EditPlugin from "~/components/core/plugins/EditPlugin"

const columns: TColumn = [
	{
		key: "name",
		label: "Plugin name",
		align: "start",
		width: 80,
	},
	{
		key: "type",
		label: "Type",
		align: "start",
		width: 40,
	},
	{
		key: "sourcePattern",
		label: "Source pattern",
		align: "start",
		width: 10,
	},
	{
		key: "actions",
		label: "Actions",
		align: "end",
		width: 10,
	},
]

function ClusterList() {
	const [editPluginName, setEditPluginName] = useState<string | null>(null)
	const getPlugins = async () => {
		const response = await axiosJSON.get<TPlugin[]>("/plugin-artifacts")
		return response.data
	}

	const { data, isLoading, isRefetching } = useQuery({
		queryKey: ["get-all-plugins"],
		queryFn: getPlugins,
		staleTime: 0,
	})

	const renderCell = useCallback(
		(row: TPlugin, columnKey: Key) => {
			switch (columnKey) {
				case "name":
					return <span className="text-[#ADADAD]">{row.name}</span>
				case "type":
					return (
						<Box
							className={cn(
								"flex flex-row w-fit items-center gap-2 px-[7px] py-[5px] rounded-3xl capitalize",
								{
									"bg-[#52D97F21] text-[#52D97F]": row.official,
									"bg-[#A480FF21] text-[#A480FF]": !row.official,
								}
							)}
						>
							{row.official ? "Official" : "Custom"}
						</Box>
					)
				case "sourcePattern":
					return <span className="text-[#ADADAD]">{row.official ? "-" : row.sourcePattern}</span>
				case "actions":
					return (
						<Box className="flex justify-end">
							<OutlinedBorderButton
								onClick={() => {
									setEditPluginName(row.name)
								}}
								icon={Edit}
								filledIcon={Edit}
								disabled={row.official}
							>
								Edit
							</OutlinedBorderButton>
						</Box>
					)
				default:
					return null
			}
		},
		[data, isLoading, isRefetching]
	)

	return (
		<>
			{editPluginName && (
				<EditPlugin
					isOpen={!!editPluginName}
					onOpenChange={() => setEditPluginName(null)}
					pluginName={editPluginName}
				/>
			)}
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
									No plugin available to display
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
									There are no plugins to display right now. Please add one to the display list.
								</Typography>
							</Box>
						</Box>
					}
				>
					{(item: TPlugin) => (
						<TableRow key={item.name}>
							{(columnKey) => <TableCell>{renderCell(item, columnKey)}</TableCell>}
						</TableRow>
					)}
				</TableBody>
			</Table>
		</>
	)
}

export default ClusterList
