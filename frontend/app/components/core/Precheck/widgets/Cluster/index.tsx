import { Skeleton } from "@heroui/react"
import { Box, Typography } from "@mui/material"
import { Refresh } from "iconsax-react"
import { useEffect, useState } from "react"
import { OutlinedBorderButton } from "~/components/utilities/Buttons"
import ListLoader from "../../loading/ListLoader"
import LogsList from "../LogsList"
import NoData from "../NoData"
import NodeListItem from "../NodeListItem"
import Switch from "~/components/utilities/Switch"

function ClusterLogs({
	data,
	handleRerun,
	isPending = false,
	isLoading = false,
	handlePrecheckSkip,
}: {
	data: any
	handleRerun: (payload: any) => void
	handlePrecheckSkip: (id: string, skip: boolean) => void
	isPending: boolean
	isLoading: boolean
}) {
	const [selectedPrecheck, setSelectedPrecheck] = useState<any>(null)

	useEffect(() => {
		if (
			selectedPrecheck === null ||
			data?.cluster?.filter((change: any) => change.id === selectedPrecheck?.id).length === 0
		) {
			if (data?.cluster?.length === 0) {
				setSelectedPrecheck(null)
			} else {
				setSelectedPrecheck(data?.cluster?.[0])
			}
		}
	}, [data])

	const handlePrecheckRerun = () => {
		handleRerun({
			precheckIds: [selectedPrecheck.id],
		})
	}

	if (data?.cluster?.length === 0 && !isLoading) {
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
						<OutlinedBorderButton
							onClick={() => handleRerun({ cluster: true })}
							disabled={isPending || isLoading}
						>
							<Refresh color="currentColor" size="14px" />
							{isPending ? "Running..." : "Rerun"}
						</OutlinedBorderButton>
					</Box>
					<Box className="flex flex-col gap-1">
						<NoData
							title="No cluster available to display"
							subtitle="There are no clusters to display right now."
						/>
					</Box>
				</Box>
			</Box>
		)
	}

	return (
		<>
			<Box className="h-full p-px rounded-2xl w-1/3" sx={{ background: "radial-gradient(#6E687C, #1D1D1D)" }}>
				<Box className="flex h-full w-full flex-col gap-[6px] p-4 bg-[#0D0D0D] rounded-[15px] ">
					<Box className="flex flex-row justify-between gap-2">
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
						<OutlinedBorderButton onClick={() => handleRerun({})} disabled={isPending || isLoading}>
							<Refresh color="currentColor" size="14px" />
							{isPending ? "Running..." : "Rerun"}
						</OutlinedBorderButton>
					</Box>
					<Box className="flex flex-col gap-1 overflow-x-scroll">
						<Box className="flex flex-col px-3 py-[14px] gap-1">
							{!isLoading ? (
								data.cluster.map((change: any, index: number) => {
									return (
										<NodeListItem
											key={index}
											status={change.status}
											severity={change.severity}
											name={change.name}
											isSelected={change.id === selectedPrecheck?.id}
											onClick={() => setSelectedPrecheck(change)}
											duration={`${change.duration}`}
										/>
									)
								})
							) : (
								<ListLoader />
							)}
						</Box>
					</Box>
				</Box>
			</Box>

			<Box className="flex p-px rounded-2xl w-2/3" sx={{ background: "radial-gradient(#6E687C, #1D1D1D)" }}>
				<Box className="flex w-full h-full flex-col gap-4 py-4 px-6 bg-[#0D0D0D] rounded-[15px]">
					{selectedPrecheck ? (
						<>
							<Box className="flex flex-row justify-between gap-2">
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
											{selectedPrecheck?.name}
										</Typography>
									) : (
										<Skeleton className="rounded-md">
											<Box width="280px" height="20px" />
										</Skeleton>
									)}
								</Box>
								<Box className="flex flex-row gap-2">
									<Switch
										checked={selectedPrecheck?.severity === "SKIPPED"}
										onChange={(skip) => handlePrecheckSkip(selectedPrecheck.id, skip)}
										label="Skip"
										disabled={isPending || isLoading}
									/>
									<OutlinedBorderButton
										onClick={handlePrecheckRerun}
										disabled={isPending || isLoading}
									>
										<Refresh color="currentColor" size="14px" />
										{isPending ? "Running..." : "Rerun"}
									</OutlinedBorderButton>
								</Box>
							</Box>
							<Box className="flex flex-col w-full gap-[2px]">
								<LogsList logs={selectedPrecheck?.logs || []} isLoading={isLoading} />
							</Box>
						</>
					) : (
						<NoData
							title="No logs available to display"
							subtitle="There are no logs to show at the moment."
						/>
					)}
				</Box>
			</Box>
		</>
	)
}

export default ClusterLogs
