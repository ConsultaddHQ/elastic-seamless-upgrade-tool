import { useQuery } from "@tanstack/react-query"
import axiosJSON from "~/apis/http"
import { useRealtimeEventListener } from "./useRealtimeEventListener"
import { useParams } from "react-router"

export function usePrecheckSummary() {
	const { clusterId } = useParams()
	const fetchPrecheckSummary = async () => {
		const res = await axiosJSON.get(`/clusters/${clusterId}/prechecks/summary`)
		return res.data
	}
	const { refetch, data } = useQuery({
		queryKey: ["getPrecheckSummary", clusterId],
		queryFn: fetchPrecheckSummary,
		staleTime: 0,
	})
	useRealtimeEventListener("PRECHECK_PROGRESS_CHANGE", () => refetch(), true)
	return { critical: data?.critical ?? 0, warning: data?.warning ?? 0, skipped: data?.skipped ?? 0 }
}
