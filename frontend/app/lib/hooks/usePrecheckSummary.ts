import { useQuery } from "@tanstack/react-query"
import { useRealtimeEventListener } from "./useRealtimeEventListener"
import { useParams } from "react-router"
import { clusterApi } from "~/apis/ClusterApi"

export function usePrecheckSummary() {
	const { clusterId } = useParams()
	const { refetch, data } = useQuery({
		queryKey: ["getPrecheckSummary", clusterId],
		queryFn: () => clusterApi.getClusterPrecheckSummary(clusterId!),
		staleTime: 0,
	})
	useRealtimeEventListener("PRECHECK_PROGRESS_CHANGE", () => refetch(), true)
	return { critical: data?.critical ?? 0, warning: data?.warning ?? 0, skipped: data?.skipped ?? 0 }
}
