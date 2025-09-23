import { Box, Typography } from "@mui/material"
import { Refresh, SearchNormal1 } from "iconsax-react"
import { useEffect, useState } from "react"
import { OutlinedBorderButton } from "~/components/utilities/Buttons"
import ListLoader from "../../loading/ListLoader"
import NoData from "../NoData"
import NodeListItem from "../NodeListItem"
import Prechecks from "../Prechecks"
import { Input } from "@heroui/react"

function GroupedPrecheck({
	groupName,
	groups,
	handleRerun,
	isPending = false,
	isLoading = false,
	handlePrecheckSkip,
	handleGroupRerun,
}: {
	groupName: string
	groups: TGroupedPrecheck[]
	handleRerun: (payload: any) => void
	handlePrecheckSkip: (id: string, skip: boolean) => void
	isPending: boolean
	isLoading: boolean
	handleGroupRerun: (group: TGroupedPrecheck) => void
}) {
	const [selectedGroup, setSelectedGroup] = useState<TGroupedPrecheck | null>(null)
	const [search, setSearch] = useState<string>("")

	useEffect(() => {
		if (groups?.length > 0) {
			if (selectedGroup === null) {
				setSelectedGroup(groups[0])
			} else {
				setSelectedGroup(groups.find((group) => group.id == selectedGroup?.id) ?? groups[0])
			}
		} else {
			setSelectedGroup(null)
		}
		setSearch("")
	}, [groups, setSelectedGroup])

	if (groups?.length === 0 && !isLoading) {
		return (
			<Box className="h-full p-px rounded-2xl w-full" sx={{ background: "radial-gradient(#6E687C, #1D1D1D)" }}>
				<Box className="flex w-full h-full flex-col gap-[6px] p-4 bg-[#0D0D0D] rounded-[15px]">
					<Box className="flex flex-row items-center gap-2 justify-between">
						<Typography
							color="#A6A6A6"
							fontFamily="Manrope"
							fontSize="12px"
							fontWeight="400"
							lineHeight="normal"
							letterSpacing="0.24px"
						>
							Prechecks
						</Typography>
						<OutlinedBorderButton onClick={handleGroupRerun} disabled={isPending || isLoading}>
							<Refresh color="currentColor" size="14px" />
							{isPending ? "Running..." : "Rerun"}
						</OutlinedBorderButton>
					</Box>
					<Box className="flex flex-col gap-1">
						<NoData
							title="No index available to display"
							subtitle="There are no indexes to show right now."
						/>
					</Box>
				</Box>
			</Box>
		)
	}

	return (
		<>
			<Box className="h-full flex flex-col w-1/3 gap-[6px]">
				<Typography
					marginTop="12px"
					color="#A9AAB6"
					fontFamily="Manrope"
					fontSize="12px"
					fontWeight="500"
					lineHeight="normal"
					letterSpacing="0.12px"
				>
					{groupName}
				</Typography>
				<Input
					classNames={{
						inputWrapper:
							"rounded-[10px] border border-solid border-[#2B2B2B] bg-[#161616] group-data-[focus=true]:bg-[#161616] data-[hover=true]:bg-default-50 my-1",
					}}
					type="text"
					placeholder="Search"
					startContent={<SearchNormal1 size="14px" color="#6A6A6A" />}
					value={search}
					onChange={(e) => setSearch(e.target.value)}
				/>
				<Box className="flex flex-col gap-1 overflow-y-scroll">
					{!isLoading ? (
						groups
							?.filter((g) => g.name.toLowerCase().includes(search.toLowerCase().trim()))
							.map((group: TGroupedPrecheck, idx: number) => (
								<NodeListItem
									key={idx}
									status={group?.status}
									severity={group?.severity}
									isSelected={selectedGroup?.id === group.id}
									name={group?.name}
									onClick={() => setSelectedGroup(group)}
								/>
							))
					) : (
						<ListLoader />
					)}
				</Box>
			</Box>
			<Prechecks
				prechecks={selectedGroup?.prechecks ?? []}
				handleRerun={handleRerun}
				handlePrecheckSkip={handlePrecheckSkip}
				isPending={isPending}
				isLoading={isLoading}
				handleRerunAll={() => selectedGroup && handleGroupRerun(selectedGroup)}
			/>
		</>
	)
}

export default GroupedPrecheck
