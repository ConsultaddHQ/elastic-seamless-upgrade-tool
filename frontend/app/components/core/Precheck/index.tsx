import { Box, Typography } from "@mui/material"
import { useMutation, useQuery } from "@tanstack/react-query"
import { ExportCurve, Folder, Refresh } from "iconsax-react"
import React, { useEffect, useRef, useState } from "react"
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
		<Box className="flex flex-col gap-1 overflow-scroll scrollbar-hide" padding="0px 24px">
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

const PrecheckGroup = ({ prechecks, label }: { prechecks?: TPrecheck[]; label: string }) => {
	return (
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
							{label}
						</Typography>
					</Box>
				</Box>
				<PrechecList prechecks={prechecks} />
			</Box>
		</Box>
	)
}
const IndexPrecheckGroup = ({ groups }: { groups: TIndexData[] }) => {
	const [selectedGroup, setSelectedGroup] = useState<TIndexData>(groups[0])

	return (
		<>
			<Box className="flex gap-4 h-auto">
				{groups.length !== 0 && (
					<>
						<Box className="flex py-4 flex-col gap-[6px]">
							<Typography
								color="#A9AAB6"
								fontSize="12px"
								fontWeight="500"
								lineHeight="normal"
								letterSpacing="0.12px"
							>
								Indexes
							</Typography>
							<Box className="flex flex-col gap-[6px] overflow-scroll scrollbar-hide min-w-[282px]">
								{groups.map((item, index) => {
									return (
										<NodeListItem
											key={index}
											name={item.name}
											status={item.status}
											isSelected={item.name === selectedGroup.name}
											onClick={() => setSelectedGroup(item)}
										/>
									)
								})}
							</Box>
						</Box>
						<PrecheckGroup prechecks={selectedGroup?.prechecks} label="Index Prechecks" />
					</>
				)}
			</Box>
		</>
	)
}

const ClusterPrecheckGroup = ({ prechecks }: { prechecks: TPrecheck[] }) => {
	return (
		<>
			<Box className="flex gap-4 h-auto">
				<Box className="flex py-4 flex-col gap-[6px]">
					<Box className="flex flex-col gap-[6px] overflow-scroll scrollbar-hide min-w-[282px]"></Box>
				</Box>
				<PrecheckGroup prechecks={prechecks} label="Cluster Prechecks" />
			</Box>
		</>
	)
}

const NodePrecheckGroup = ({ groups }: { groups: TNodeData[] }) => {
	const [selectedGroup, setSelectedGroup] = useState<TNodeData>(groups[0])

	return (
		<>
			<Box className="flex gap-4 h-auto">
				{groups.length !== 0 && (
					<>
						<Box className="flex py-4 flex-col gap-[6px]">
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
											isSelected={item.nodeId === selectedGroup.nodeId}
											onClick={() => setSelectedGroup(item)}
										/>
									)
								})}
							</Box>
						</Box>
						<PrecheckGroup prechecks={selectedGroup?.prechecks} label="Node Prechecks" />
					</>
				)}
			</Box>
		</>
	)
}
function Precheck() {
	const clusterId = useLocalStore((state: any) => state.clusterId)
	const { socket } = useSocketStore()
	const [isExportPending, setIsExportPending] = useState(false)
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
	const handleExport = async () => {
		setIsExportPending(true)
		try {
			const response = await axiosJSON.get(`/api/elastic/clusters/${clusterId}/prechecks/report`, {
				responseType: "blob",
			})
			const blob = new Blob([response.data], { type: "text/markdown" })
			const url = URL.createObjectURL(blob)
			const a = document.createElement("a")
			a.href = url
			a.download = "precheck-report.md"
			a.click()

			URL.revokeObjectURL(url)
		} catch (err) {
			toast.error("Something went wrong while exporting the file")
		} finally {
			setIsExportPending(false)
		}
	}

	if (isLoading) return <Loading />

	return (
		<>
			{data ? (
				<>
					<Box className="flex flex-row gap-[6px]">
						<OutlinedBorderButton onClick={HandleRerun} disabled={isPending}>
							<Refresh color="currentColor" size="14px" /> {isPending ? "Running" : "Re-run"}
						</OutlinedBorderButton>
						<OutlinedBorderButton onClick={handleExport} disable={isExportPending}>
							<ExportCurve color="currentColor" size="14px" /> {isExportPending ? "Exporting" : "Export"}
						</OutlinedBorderButton>
					</Box>

					<ClusterPrecheckGroup prechecks={data?.cluster} />
					<NodePrecheckGroup groups={data?.node} />
					<IndexPrecheckGroup groups={data?.index} />
				</>
			) : (
				<PrecheckNotTriggered refetch={refetch} />
			)}
		</>
	)
}

export default Precheck
