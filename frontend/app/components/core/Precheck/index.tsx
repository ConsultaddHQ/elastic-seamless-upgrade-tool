import { Box, Typography } from "@mui/material"
import { useMutation, useQuery } from "@tanstack/react-query"
import { Folder, Refresh } from "iconsax-react"
import axiosJSON from "~/apis/http"
import { OutlinedBorderButton } from "~/components/utilities/Buttons"
import { useLocalStore } from "~/store/common"
import LogGroup from "./widgets/LogGroup"
import { useRealtimeEventListener } from "~/lib/hooks/useRealtimeEventListener"

const PrecheckNotTriggered = ({ refetch }: { refetch: () => void }) => {
	const clusterId = useLocalStore((state) => state.clusterId)

	const reRunPrecheck = async () => {
		await axiosJSON.post(`/clusters/${clusterId}/prechecks`).then(() => refetch())
	}

	const { mutate: HandleRerun, isPending } = useMutation({
		mutationKey: ["re-run-prechecks"],
		mutationFn: reRunPrecheck,
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

function Precheck({ selectedTab }: { selectedTab: TCheckTab }) {
	const clusterId = useLocalStore((state) => state.clusterId)

	const getPrecheck = async () => {
		const response = await axiosJSON.get<{
			index: TIndexData[]
			node: TNodeData[]
			cluster: TPrecheck[]
			breakingChanges: TPrecheck[]
		}>(`/clusters/${clusterId}/prechecks`)
		return response.data
	}

	const { data, isLoading, refetch } = useQuery({
		queryKey: ["get-prechecks"],
		queryFn: getPrecheck,
		staleTime: 0,
	})
	useRealtimeEventListener("PRECHECK_PROGRESS_CHANGE", refetch, true)

	return (
		<>
			{data ? (
				<LogGroup dataFor={selectedTab} data={data} isLoading={isLoading} refetchData={refetch} />
			) : (
				<PrecheckNotTriggered refetch={refetch} />
			)}
		</>
	)
}

export default Precheck
