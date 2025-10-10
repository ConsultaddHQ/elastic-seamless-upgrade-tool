import { Box } from "@mui/material"
import { useMutation } from "@tanstack/react-query"
import { useMemo } from "react"
import BreakingChangesLogs from "./BreakingChanges"
import { toast } from "sonner"
import GroupedPrecheck from "~/components/core/Precheck/widgets/GroupedPrecheck"
import Prechecks from "~/components/core/Precheck/widgets/Prechecks"
import { useParams } from "react-router"
import { precheckApi } from "~/apis/PrecheckApi"
import { useConfirmationModal } from "~/components/utilities/ConfirmationModal"
import { ArrowRight } from "iconsax-react"

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
	const { openConfirmation, ConfirmationModal } = useConfirmationModal()

	const { mutate: HandleRerun, isPending } = useMutation({
		mutationKey: ["handle-rerun"],
		mutationFn: async (payload: any) => {
			await precheckApi.rerunPrechecks(clusterId!, payload)
			refetchData()
		},
	})

	const handlePrecheckSkip = async (id: string, skip: boolean) => {
		const onConfrimSkip = async () => {
			await precheckApi.skipPrecheck(clusterId!, id, skip)
			toast.success(`Precheck ${skip ? "skipped" : "unskipped"} successfully`)
		}
		if (!skip) {
			onConfrimSkip()
			return
		}
		openConfirmation({
			title: "Skip Precheck",
			message: `Are you sure you want to skip this precheck?`,
			confirmText: "Skip",
			onConfirm: onConfrimSkip,
			Icon: ArrowRight,
		})
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

	return (
		<Box className="flex flex-row gap-[10px] w-full h-[calc(var(--window-height)-185px)]">
			{layout}
			{ConfirmationModal}
		</Box>
	)
}

export default LogGroup
