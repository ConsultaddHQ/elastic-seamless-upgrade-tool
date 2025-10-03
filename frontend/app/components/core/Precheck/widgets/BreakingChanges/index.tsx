import { Skeleton } from "@heroui/react"
import { Box, Typography } from "@mui/material"
import { useEffect, useState } from "react"
import ListLoader from "../../loading/ListLoader"
import LogsList from "../LogsList"
import NoData from "../NoData"
import NodeListItem from "../NodeListItem"
import axiosJSON from "~/apis/http"
import { toast } from "sonner"
import StringManager from "~/constants/StringManager"
import { useQuery } from "@tanstack/react-query"
import { useParams } from "react-router"

function useBreakingChanges() {
	const { clusterId } = useParams()
	const getBreakingChanges = async () => {
		try {
			const response = await axiosJSON.get<TPrecheck[]>(`/clusters/${clusterId}/prechecks/breaking-changes`)
			return response.data
		} catch (err: any) {
			toast.error(err?.response?.data?.message ?? StringManager.GENERIC_ERROR)
			throw err
		}
	}

	const { data, isLoading } = useQuery({
		queryKey: ["get-breaking-changes"],
		queryFn: getBreakingChanges,
		staleTime: 0,
	})
	return { data: data ?? [], isLoading }
}

function BreakingChangesLogs() {
	const { data: breakingChanges, isLoading } = useBreakingChanges()
	const [selectedCheck, setSelectedCheck] = useState<TPrecheck | null>(null)

	useEffect(() => {
		if (!breakingChanges) return
		const selected = breakingChanges.find((c: any) => c.id === selectedCheck?.id)
		setSelectedCheck(selected ?? breakingChanges[0])
	}, [breakingChanges])

	if (breakingChanges.length === 0 && !isLoading) {
		return (
			<Box className="h-full p-px rounded-2xl w-full" sx={{ background: "radial-gradient(#6E687C, #1D1D1D)" }}>
				<Box className="flex w-full h-full flex-col gap-[6px] p-4 bg-[#0D0D0D] rounded-[15px]">
					<Typography
						color="#A6A6A6"
						fontFamily="Manrope"
						fontSize="12px"
						fontWeight="400"
						lineHeight="normal"
						letterSpacing="0.24px"
					>
						Breaking changes
					</Typography>
					<Box className="flex flex-col gap-1">
						<NoData
							title="No Prechecks available to display"
							subtitle="Everything looks stable—no breaking changes detected."
						/>
					</Box>
				</Box>
			</Box>
		)
	}

	return (
		<>
			<Box className="h-full p-px rounded-2xl w-1/3" sx={{ background: "radial-gradient(#6E687C, #1D1D1D)" }}>
				<Box className="flex w-full h-full flex-col gap-[6px] p-4 bg-[#0D0D0D] rounded-[15px]">
					<Typography
						color="#A6A6A6"
						fontFamily="Manrope"
						fontSize="12px"
						fontWeight="400"
						lineHeight="normal"
						letterSpacing="0.24px"
					>
						Breaking changes
					</Typography>
					<Box className="flex flex-col gap-1 overflow-y-scroll">
						<Box className="flex flex-col px-3 py-[14px] gap-1">
							{!isLoading ? (
								breakingChanges.length !== 0 ? (
									breakingChanges.map((change: any, index: number) => {
										return (
											<NodeListItem
												key={index}
												status={change.status}
												severity={change.severity}
												name={change.name}
												isSelected={true}
												onClick={() => setSelectedCheck(change)}
											/>
										)
									})
								) : (
									<NoData
										title="No Prechecks available to display"
										subtitle="Everything looks stable—no breaking changes detected."
									/>
								)
							) : (
								<ListLoader />
							)}
						</Box>
					</Box>
				</Box>
			</Box>

			<Box className="flex p-px rounded-2xl w-2/3" sx={{ background: "radial-gradient(#6E687C, #1D1D1D)" }}>
				<Box className="flex w-full h-full flex-col gap-4 py-4 px-6 bg-[#0D0D0D] rounded-[15px]">
					<Box className="flex flex-col">
						<Typography
							color="#A6A6A6"
							fontFamily="Manrope"
							fontSize="12px"
							fontWeight="400"
							lineHeight="normal"
							letterSpacing="0.24px"
						>
							Logs
						</Typography>
						{!isLoading ? (
							<Typography
								color="#A9AAB6"
								fontFamily="Manrope"
								fontSize="14px"
								fontWeight="500"
								lineHeight="20px"
							>
								{selectedCheck?.name}
							</Typography>
						) : (
							<Skeleton className="rounded-md">
								<Box width="280px" height="20px" />
							</Skeleton>
						)}
					</Box>
					<Box className="flex flex-col w-full gap-[2px] overflow-y-scroll">
						<LogsList logs={selectedCheck?.logs ?? []} isLoading={isLoading} />
					</Box>
				</Box>
			</Box>
		</>
	)
}

export default BreakingChangesLogs
