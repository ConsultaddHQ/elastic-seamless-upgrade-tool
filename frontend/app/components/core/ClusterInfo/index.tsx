import { Box, Typography } from "@mui/material"
import { useQuery } from "@tanstack/react-query"
import _ from "lodash"
import { useEffect, useState } from "react"
import DetailBox from "./widgets/DetailBox"
import { useRealtimeEventListener } from "~/lib/hooks/useRealtimeEventListener"
import TargetVersionDropdown from "~/components/utilities/TargetVersionDropdown"
import AllocationExplain from "~/components/core/AllocationExplain"
import { InfoCircle } from "iconsax-react"
import { useParams } from "react-router"
import { clusterApi } from "~/apis/ClusterApi"

const CLUSTER_STATUS_COLOR: { [key: string]: string } = {
	yellow: "#E0B517",
	green: "#52D97F",
	red: "#E87D65",
}

function ClusterInfo() {
	const { clusterId } = useParams()
	const [showAllocation, setShowAllocation] = useState(false)

	const { data, isLoading, refetch, isRefetching, error } = useQuery({
		queryKey: ["cluster-info"],
		queryFn: () => clusterApi.getClusterOverview(clusterId!),
		staleTime: Infinity,
		enabled: false,
	})
	useRealtimeEventListener("CLUSTER_INFO_CHANGE", () => refetch())
	useEffect(() => {
		refetch()
	}, [clusterId])

	return (
		<Box
			className="flex p-px rounded-2xl w-full h-[calc(var(--window-height)-196px)]"
			sx={{
				background: "radial-gradient(#927CC5, #1D1D1D)",
			}}
		>
			{showAllocation && <AllocationExplain onOpenChange={() => setShowAllocation(false)} />}
			<Box
				className="flex flex-col gap-6 rounded-2xl bg-[#0D0D0D] overflow-auto w-full"
				padding={{ xs: "14px 16px", md: "24px 32px" }}
			>
				<Box className="flex flex-row gap-3 justify-between">
					<Typography
						color="#FFF"
						fontSize="16px"
						fontWeight="600"
						lineHeight="normal"
						letterSpacing="0.16px"
					>
						Details
					</Typography>
					<TargetVersionDropdown />
				</Box>
				<Box className="flex flex-col gap-6 overflow-auto">
					<Box className="flex flex-col sm:flex-row gap-6 sm:gap-16">
						<Box className="flex flex-col gap-[24px] w-2/4">
							<DetailBox
								title="Cluster name"
								description={error ? "--" : data?.clusterName}
								isLoading={isLoading || isRefetching}
							/>
							<DetailBox
								title="Cluster UUID"
								description={error ? "--" : data?.clusterUUID}
								isLoading={isLoading || isRefetching}
							/>
							<DetailBox
								title="Infrastructure type"
								description={error ? "--" : data?.infrastructureType}
								isLoading={isLoading || isRefetching}
							/>
						</Box>
						<Box className="flex flex-col gap-[24px] w-1/2">
							<DetailBox
								title="Cluster status"
								customDescription={
									<Box className="flex flex-row items-center gap-2 h-[20px]">
										<Box
											component="span"
											className="flex min-w-[6px] min-h-[6px] rounded-[2px]"
											sx={{ background: CLUSTER_STATUS_COLOR[error ? "red" : data?.status] }}
										/>
										<Typography
											color={CLUSTER_STATUS_COLOR[error ? "red" : data?.status]}
											fontFamily="Inter"
											fontSize="12px"
											fontWeight="500"
											lineHeight="normal"
											textTransform="capitalize"
										>
											{error ? "red" : data?.status}
										</Typography>
									</Box>
								}
								isLoading={isLoading || isRefetching}
							/>
							<DetailBox
								title="ES Version"
								description={error ? "--" : data?.version}
								isLoading={isLoading || isRefetching}
							/>
							<DetailBox
								title="Timed out"
								description={data?.timeOut ? "True" : "False"}
								isLoading={isLoading || isRefetching}
							/>
						</Box>
					</Box>
					<Box
						className="grid col-auto grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-[14px] bg-[#161616] rounded-2xl"
						padding="14px 16px"
					>
						<DetailBox
							title="Number of data nodes"
							description={error ? "--" : data?.numberOfDataNodes}
							isLoading={isLoading || isRefetching}
						/>
						<DetailBox
							title="Number of nodes"
							description={error ? "--" : data?.numberOfNodes}
							isLoading={isLoading || isRefetching}
						/>
						<DetailBox
							title="Number of master nodes"
							description={error ? "--" : data?.numberOfMasterNodes}
							isLoading={isLoading || isRefetching}
						/>
						<DetailBox
							title="Current Master"
							description={error ? "--" : data?.currentMasterNode}
							isLoading={isLoading || isRefetching}
						/>
						<DetailBox
							title="Total Indices"
							description={error ? "--" : data?.totalIndices}
							isLoading={isLoading || isRefetching}
						/>
						<DetailBox
							title="Adaptive Replica Enabled"
							description={error ? "--" : data?.adaptiveReplicaEnabled}
							isLoading={isLoading || isRefetching}
						/>
						<DetailBox
							title="Active primary shards"
							description={error ? "--" : data?.activePrimaryShards}
							isLoading={isLoading || isRefetching}
						/>
						<DetailBox
							title="Active shards"
							description={error ? "--" : data?.activeShards}
							isLoading={isLoading || isRefetching}
						/>
						<DetailBox
							title="Relocating shards"
							description={error ? "--" : data?.relocatingShards}
							isLoading={isLoading || isRefetching}
						/>
						<DetailBox
							title="Initializing shards"
							description={error ? "--" : data?.initializingShards}
							isLoading={isLoading || isRefetching}
						/>
						<DetailBox
							title="Unassigned shards"
							description={error ? "--" : data?.unassignedShards}
							isLoading={isLoading || isRefetching}
							action={
								data?.unassignedShards ? (
									<InfoCircle size={14} color="#aabbcc" onClick={() => setShowAllocation(true)} />
								) : undefined
							}
						/>
					</Box>
				</Box>
			</Box>
		</Box>
	)
}

export default ClusterInfo
