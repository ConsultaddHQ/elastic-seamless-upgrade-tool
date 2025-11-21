import { useEffect, useState } from "react"
import TaskNode from "./TaskNode"
import { FullScreenDrawer } from "~/components/utilities/FullScreenDrawer"
import { Box } from "@mui/system"
import AppBreadcrumb from "~/components/utilities/AppBreadcrumb"
import { ArrowLeft } from "iconsax-react"
import { ReactFlow, Background, Controls, type Node } from "@xyflow/react"
import "@xyflow/react/dist/style.css"
import { clusterUpgradeApi } from "~/apis/ClusterUpgradeApi"
import { useParams } from "react-router"
import { Typography } from "@mui/material"
import { useRealtimeEventListener } from "~/lib/hooks/useRealtimeEventListener"

const nodeTypes = { taskNode: TaskNode }
function NodeUpgradePLanBreadcrumb({ onBack }: { onBack: () => void }) {
	return (
		<AppBreadcrumb
			items={[
				{
					label: "Go back",
					icon: <ArrowLeft size="14px" color="currentColor" />,
					onClick: onBack,
				},
				{
					label: "Node Upgrade Plan",
					color: "#BDA0FF",
				},
			]}
		/>
	)
}
export default function PipelineFlow({ onOpenChange, node }: { onOpenChange: () => void; node: TUpgradeRow }) {
	const { clusterId } = useParams()
	const [tasks, setTasks] = useState<{ id: string; name: string; status: NodeUpgradeStatus }[]>([])

	const getPlan = async () => {
		if (clusterId && node?.id) {
			const data = await clusterUpgradeApi.nodeUpgradePlan(clusterId, node.id)
			setTasks(data.plan)
		}
	}
	useEffect(() => {
		getPlan()
	}, [node?.id, clusterId])

	useRealtimeEventListener("UPGRADE_PROGRESS_CHANGE", () => getPlan(), true)

	const nodes = tasks.map(
		(task, index) =>
			({
				id: task.id,
				type: "taskNode",
				position: { x: index * 300, y: 120 }, // horizontal layout
				data: {
					label: task.name,
					status: task.status,
					isFirst: index === 0,
					isLast: index === tasks.length - 1,
				},
				sourcePosition: "right",
				targetPosition: "left",
			} as Node)
	)

	const edges = tasks.slice(0, -1).map((task, index) => ({
		id: `${task.id}-${tasks[index + 1].id}`,
		source: task.id,
		target: tasks[index + 1].id,
	}))

	return (
		<FullScreenDrawer isOpen={true} onOpenChange={onOpenChange}>
			<Box minHeight="58px" />
			<Box className="flex items-center gap-3 justify-between">
				<NodeUpgradePLanBreadcrumb onBack={onOpenChange} />
			</Box>
			<Box
				className="flex p-px rounded-2xl h-[calc(var(--window-height)-120px)]"
				sx={{ background: "radial-gradient(#6E687C, #1D1D1D)" }}
			>
				<Box className="flex flex-col gap-6 rounded-2xl bg-[#0D0D0D] w-full h-full items-start">
					<Box
						className="flex flex-col h-full w-full gap-3 overflow-auto items-center"
						padding="16px 24px 16px 24px"
					>
						<Box className="flex w-full flex-row items-start gap-[18px]">
							<Typography
								color="#E5E0E0"
								fontFamily="Manrope"
								fontSize="14px"
								fontWeight="600"
								lineHeight="20px"
							>
								Upgrade Plan ({node.node_name})
							</Typography>
						</Box>
						<Box className="flex w-full h-full overflow-scroll rounded-lg">
							<ReactFlow
								colorMode="dark"
								nodes={nodes}
								edges={edges}
								nodeTypes={nodeTypes}
								fitView
								style={{ borderRadius: "20px" }}
							>
								<Background />
								<Controls />
							</ReactFlow>
						</Box>
					</Box>
				</Box>
			</Box>
		</FullScreenDrawer>
	)
}
