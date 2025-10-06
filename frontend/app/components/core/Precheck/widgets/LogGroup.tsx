import { Box } from "@mui/material"
import { useMutation } from "@tanstack/react-query"
import { useMemo } from "react"
import BreakingChangesLogs from "./BreakingChanges"
import axiosJSON from "~/apis/http"
import { toast } from "sonner"
import GroupedPrecheck from "~/components/core/Precheck/widgets/GroupedPrecheck"
import Prechecks from "~/components/core/Precheck/widgets/Prechecks"
import { useParams } from "react-router"

function LogGroup({
	dataFor,
	data,
	isLoading,
	refetchData,
}: {
	dataFor: TCheckTab
	data: any
	isLoading: boolean
	refetchData: any
}) {
	const { clusterId } = useParams()

	const { mutate: HandleRerun, isPending } = useMutation({
		mutationKey: ["handle-rerun"],
		mutationFn: async (payload: any) => {
			await axiosJSON.post(`/clusters/${clusterId}/prechecks/rerun`, payload)
			refetchData()
		},
	})

	const handlePrecheckSkip = async (id: string, skip: boolean) => {
		await axiosJSON.put(`/clusters/${clusterId}/prechecks/${id}/skip?skip=${skip}`)
		toast.success(`Precheck ${skip ? "skipped" : "unskipped"} successfully`)
	}

	const layout = useMemo(() => {
		if (dataFor === "CLUSTER") {
			return (
				<Prechecks
					prechecks={data.cluster as TPrecheck[]}
					handleRerun={(payload) => HandleRerun(payload)}
					handlePrecheckSkip={handlePrecheckSkip}
					isPending={isPending}
					isLoading={isLoading}
					handleRerunAll={() => HandleRerun({ cluster: true })}
				/>
			)
		} else if (dataFor === "NODES") {
			return (
				<GroupedPrecheck
					groupName={"Nodes"}
					groups={data?.node as TGroupedPrecheck[]}
					handleGroupRerun={(group) => {
						HandleRerun({
							nodeIds: [group.id],
						})
					}}
					handleRerun={(payload) => HandleRerun(payload)}
					handlePrecheckSkip={handlePrecheckSkip}
					isPending={isPending}
					isLoading={isLoading}
				/>
			)
		} else if (dataFor === "INDEX") {
			return (
				<GroupedPrecheck
					groupName={"Indexes"}
					groups={data?.index as TGroupedPrecheck[]}
					handleGroupRerun={(group) => {
						HandleRerun({
							indexNames: [group.id],
						})
					}}
					handleRerun={(payload) => HandleRerun(payload)}
					handlePrecheckSkip={handlePrecheckSkip}
					isPending={isPending}
					isLoading={isLoading}
				/>
			)
		} else if (dataFor === "BREAKING_CHANGES") {
			return <BreakingChangesLogs />
		}
	}, [dataFor, data])

	return <Box className="flex flex-row gap-[10px] w-full h-[calc(var(--window-height)-185px)]">{layout}</Box>
}

export default LogGroup
