import { Box, Typography } from "@mui/material"
import { useMutation, useQuery } from "@tanstack/react-query"
import { Folder, Refresh } from "iconsax-react"
import { useEffect, useRef, useState } from "react"
import { toast } from "sonner"
import axiosJSON from "~/apis/http"
import { OutlinedBorderButton } from "~/components/utilities/Buttons"
import StringManager from "~/constants/StringManager"
import { useLocalStore } from "~/store/common"
import { useSocketStore } from "~/store/socket"
import Loading from "./loading/Loading"
import LogAccordion from "./widgets/LogAccordion"
import NodeListItem from "./widgets/NodeListItem"

export enum PrecheckStatus {
	PENDING = "PENDING",
	RUNNING = "RUNNING",
	FAILED = "FAILED",
	COMPLETED = "COMPLETED",
}

type TNodeData = {
	nodeId: string
	ip: string
	name: string
	status: PrecheckStatus
	prechecks: TPrecheck[]
}

type TPrecheck = {
	id: string
	name: string
	status: PrecheckStatus
	duration: string
	logs: string[]
	startTime: string
	endTime?: string
}

type TIndexData = {
	index: string
	name: string
	status: PrecheckStatus
	prechecks: TPrecheck[]
}

const NoPrechecks = () => {
	return (
		<Box className="flex flex-col items-center gap-4 p-6 pt-[127px]">
			<Box className="flex items-center justify-center min-h-12 min-w-12 rounded-[10px] bg-[#1A1A1A]">
				<Folder size="24px" color="#ADADAD" />
			</Box>
			<Typography
				color="#F1F0F0"
				textAlign="center"
				fontSize="16px"
				fontWeight="400"
				lineHeight="18px"
				letterSpacing="0.32px"
			>
				No prechecks available to display
			</Typography>
		</Box>
	)
}

const PrecheckNotTriggered = ({ refetch }: { refetch: () => void }) => {
	const clusterId = useLocalStore((state: any) => state.clusterId)

	const reReunPrecheck = async () => {
		await axiosJSON
			.post(`/api/elastic/clusters/${clusterId}/prechecks`)
			.then(() => refetch())
			.catch((err) => {
				console.log("Err", err)
				toast.error(err?.response?.data.err ?? StringManager.GENERIC_ERROR)
			})
	}

	const { mutate: HandleRerun, isPending } = useMutation({
		mutationKey: ["re-run-prechecks"],
		mutationFn: reReunPrecheck,
	})

	return (
		<Box className="flex gap-4 h-auto">
			<Box className="flex py-3 flex-col w-full gap-[6px] ">
				<Typography color="#A9AAB6" fontSize="12px" fontWeight="500" lineHeight="normal" letterSpacing="0.12px">
					Nodes
				</Typography>
				<Box className="flex p-4 flex-col gap-6 items-center pt-[86px]">
					<Box className="flex flex-col items-center gap-4">
						<Box className="flex items-center justify-center min-h-12 min-w-12 rounded-[10px] bg-[#1A1A1A]">
							<Folder size="24px" color="#ADADAD" />
						</Box>
						<Box className="flex flex-col items-center gap-[5px]">
							<Typography
								color="#F1F0F0"
								textAlign="center"
								fontSize="16px"
								fontWeight="400"
								lineHeight="18px"
								letterSpacing="0.32px"
							>
								No nodes available to display
							</Typography>
							<Typography
								color="#A6A6A6"
								fontSize="12px"
								fontWeight="400"
								lineHeight="normal"
								letterSpacing="0.24px"
							>
								[Rename] Please run prechecks to validate nodes.
							</Typography>
						</Box>
					</Box>
					<OutlinedBorderButton onClick={HandleRerun} disabled={isPending}>
						<Refresh color="currentColor" size="18px" /> {isPending ? "Running..." : "Run"}
					</OutlinedBorderButton>
				</Box>
			</Box>
		</Box>
	)
}

const PrechecList = ({ prechecks }: { prechecks?: TPrecheck[] }) => {
	const [expanded, setExpanded] = useState<string[]>([])
	const handleChange = (panel: string) => () => {
		if (expanded.includes(panel)) {
			setExpanded(expanded.filter((item: string) => item !== panel))
		} else {
			setExpanded([...expanded, panel])
		}
	}
	return (
		<Box className="flex flex-col gap-1 overflow-scroll scrollbar-hide">
			{prechecks?.length ? (
				prechecks.map((item: TPrecheck, idx: number) => {
					return (
						<LogAccordion
							key={idx}
							title={item.name}
							status={item.status}
							logs={item.logs}
							expanded={expanded.includes(item.id)}
							onChange={handleChange(item.id)}
							duration={item.duration}
						/>
					)
				})
			) : (
				<NoPrechecks />
			)}
		</Box>
	)
}

const PrecheckGroup = ({ groups, label }: { groups: (TNodeData | TIndexData)[]; label: string }) => {
	const [selectedIndex, setSelectedIndex] = useState(0)

	useEffect(() => {
		if (groups.length === 0) return

		// If the current selected index is out of bounds, reset to 0
		if (selectedIndex >= groups.length) {
			setSelectedIndex(0)
		}
	}, [groups])

	return (
		<>
			<Box className="flex gap-4 h-auto">
				{groups.length !== 0 && (
					<Box
						className="flex w-full p-px rounded-2xl"
						sx={{ background: "radial-gradient(#6E687C, #1D1D1D)" }}
					>
						<Box className="flex flex-col  gap-4 w-full rounded-2xl bg-[#0d0d0d]" padding="16px 0px">
							<Box className="flex flex-row gap-2 justify-between items-center" padding="0px 24px">
								<Box>
									<Typography
										color="#FFF"
										fontSize="16px"
										fontWeight="600"
										lineHeight="normal"
										letterSpacing="0.16px"
									>
										{label}
									</Typography>
								</Box>
							</Box>

							<Box className="flex flex-row gap-1 overflow-scroll scrollbar-hide" padding="0px 24px">
								{/* Left - 20% */}
								<Box className="flex flex-col gap-[6px]">
									<Typography
										color="#A9AAB6"
										fontSize="12px"
										fontWeight="500"
										lineHeight="normal"
										letterSpacing="0.12px"
									>
										Nodes
									</Typography>
									<Box className="flex flex-col gap-[6px] overflow-scroll scrollbar-hide min-w-[282px]">
										{groups.map((item, index) => {
											return (
												<NodeListItem
													key={index}
													name={item.name}
													status={item.status}
													isSelected={item.name === groups[selectedIndex].name}
													onClick={() => setSelectedIndex(index)}
												/>
											)
										})}
									</Box>
								</Box>

								{/* Right - 80% */}
								<div className="w-full">
									<PrechecList prechecks={groups[selectedIndex].prechecks} />
								</div>
							</Box>
						</Box>
					</Box>
				)}
			</Box>
		</>
	)
}

const ClusterPrecheckGroup = ({ prechecks }: { prechecks: TPrecheck[] }) => {
	return (
		<>
			<Box className="flex gap-4 h-auto">
				<Box className="flex w-full p-px rounded-2xl" sx={{ background: "radial-gradient(#6E687C, #1D1D1D)" }}>
					<Box className="flex flex-col  gap-4 w-full rounded-2xl bg-[#0d0d0d]" padding="16px 0px">
						<Box className="flex flex-row gap-2 justify-between items-center" padding="0px 24px">
							<Box>
								<Typography
									color="#FFF"
									fontSize="16px"
									fontWeight="600"
									lineHeight="normal"
									letterSpacing="0.16px"
								>
									Cluster Prechecks
								</Typography>
							</Box>
						</Box>
						<Box padding="0px 24px">
							<PrechecList prechecks={prechecks} />
						</Box>
					</Box>
				</Box>
			</Box>
		</>
	)
}

function Precheck() {
	const clusterId = useLocalStore((state: any) => state.clusterId)
	const { socket } = useSocketStore()
	const debounceRef = useRef(null)

	const getPrecheck = async () => {
		try {
			const response = await axiosJSON.get<{ index: TIndexData[]; node: TNodeData[]; cluster: TPrecheck[] }>(
				`/api/elastic/clusters/${clusterId}/prechecks`
			)
			return response.data
		} catch (err: any) {
			toast.error(err?.response?.data?.message ?? StringManager.GENERIC_ERROR)
			throw err
		}
	}

	const { data, isLoading, refetch, error } = useQuery({
		queryKey: ["get-prechecks"],
		queryFn: getPrecheck,
		staleTime: 0,
	})
	const _debounceRefetch = () => {
		if (debounceRef.current) {
			clearTimeout(debounceRef.current)
		}

		// @ts-ignore
		debounceRef.current = setTimeout(() => {
			refetch()
		}, 1000)
	}

	useEffect(() => {
		if (!socket) return
		const listner = () => {
			_debounceRefetch()
		}
		socket.on("PRECHECK_PROGRESS_CHANGE", listner)
		return () => {
			socket.off("PRECHECK_PROGRESS_CHANGE", listner)
		}
	}, [socket])

	if (isLoading) return <Loading />

	return (
		<>
			{data ? (
				<>
					<ClusterPrecheckGroup prechecks={data?.cluster} />
					<PrecheckGroup groups={data?.node} label="Node Prechecks" />
					<PrecheckGroup groups={data?.index} label="Index Prechecks" />
				</>
			) : (
				<PrecheckNotTriggered refetch={refetch} />
			)}
		</>
	)
}

export default Precheck
