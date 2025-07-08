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

type TNodeData = {
	nodeId: string
	ip: string
	name: string
	status: "FAILED" | "SUCCEEDED" | "PENDING"
	prechecks: {
		id: string
		name: string
		status: "FAILED" | "SUCCEEDED" | "PENDING"
		duration: string
		logs: string[]
		startTime: string
		endTime?: string
	}[]
}

function Precheck() {
	const clusterId = useLocalStore((state: any) => state.clusterId)
	const [expanded, setExpanded] = useState<string[]>([])
	const [nodeSelected, setNodeSelected] = useState<TNodeData | null>(null)
	const { socket, isConnected } = useSocketStore()
	const [isExportPending, setIsExportPending] = useState(false)
	const debounceRef = useRef(null)

	function useDebounce<T>(value: T, delay: number): T {
		const [debouncedValue, setDebouncedValue] = useState(value)

		useEffect(() => {
			const handler = setTimeout(() => {
				setDebouncedValue(value)
			}, delay)

			// Cleanup timeout if value or delay changes
			return () => {
				clearTimeout(handler)
			}
		}, [value, delay])

		return debouncedValue
	}

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

	const handleChange = (panel: string) => (event: React.SyntheticEvent, newExpanded: boolean) => {
		if (expanded.includes(panel)) {
			setExpanded(expanded.filter((item: string) => item !== panel))
		} else {
			setExpanded([...expanded, panel])
		}
	}

	const getNodes = async () => {
		let response: TNodeData[] = []
		await axiosJSON
			.get(`/api/elastic/clusters/${clusterId}/prechecks`)
			.then((res) => {
				setNodeSelected(res?.data?.node[0])
				response = res?.data?.node
			})
			.catch((err) => {
				toast.error(err?.response?.data?.message ?? StringManager.GENERIC_ERROR)
			})
		return response
	}

	const { data, isLoading, refetch, isRefetching } = useQuery({
		queryKey: ["get-nodes-prechecks"],
		queryFn: getNodes,
		staleTime: 0,
	})

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
		<Box className="flex gap-4 h-[calc(var(--window-height)-129px)]">
			{data?.length !== 0 ? (
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
							{data?.map((item: any, index: number) => {
								return (
									<NodeListItem
										key={index}
										name={item["name"]}
										status={item["status"]}
										isSelected={item["ip"] === nodeSelected?.["ip"]}
										onClick={() => setNodeSelected(item)}
									/>
								)
							})}
						</Box>
					</Box>
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
										Logs
									</Typography>
									<Typography
										color="#A6A6A6"
										fontSize="12px"
										fontWeight="400"
										lineHeight="normal"
										letterSpacing="0.24px"
									>
										Succeded last month in 1m 8s
									</Typography>
								</Box>
								<Box className="flex flex-row gap-[6px]">
									<OutlinedBorderButton onClick={HandleRerun} disabled={isPending}>
										<Refresh color="currentColor" size="14px" /> {isPending ? "Running" : "Re-run"}
									</OutlinedBorderButton>
									<OutlinedBorderButton onClick={handleExport} disable={isExportPending}>
										<ExportCurve color="currentColor" size="14px" />{" "}
										{isExportPending ? "Exporting" : "Export"}
									</OutlinedBorderButton>
								</Box>
							</Box>
							<Box className="flex flex-col gap-1 overflow-scroll scrollbar-hide" padding="0px 24px">
								{nodeSelected?.["prechecks"].length !== 0 ? (
									nodeSelected?.["prechecks"]?.map((item: any, idx: number) => {
										return (
											<LogAccordion
												key={idx}
												title={item["name"]}
												status={item["status"]}
												logs={item["logs"]}
												expanded={expanded.includes(item["id"])}
												onChange={handleChange(item["id"])}
												duration={item["duration"]}
											/>
										)
									})
								) : (
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
								)}
							</Box>
						</Box>
					</Box>
				</>
			) : (
				<Box className="flex py-3 flex-col w-full gap-[6px] ">
					<Typography
						color="#A9AAB6"
						fontSize="12px"
						fontWeight="500"
						lineHeight="normal"
						letterSpacing="0.12px"
					>
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
			)}
		</Box>
	)
}

export default Precheck
