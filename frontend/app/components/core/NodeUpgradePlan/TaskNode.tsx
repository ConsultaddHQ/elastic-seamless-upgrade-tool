import { Box, Typography } from "@mui/material"
import { Handle, Position } from "@xyflow/react"
import { TickCircle, CloseCircle, Refresh } from "iconsax-react"

export default function TaskNode({
	data,
}: {
	data: { label: string; status: NodeUpgradeStatus; isFirst: boolean; isLast: boolean }
}) {
	const { label, status, isFirst, isLast } = data
	const getStatusIcon = () => {
		switch (status) {
			case "UPGRADED":
				return <TickCircle size="20" color="#22c55e" />
			case "FAILED":
				return <CloseCircle size="20" color="#ef4444" />
			case "UPGRADING":
				return <Refresh size="20" color="#eab308" className="animate-spin" />
			default:
				return <Refresh size="20" color="#9ca3af" />
		}
	}
	const getBorderColor = () => {
		switch (status) {
			case "UPGRADED":
				return "border-green-500"
			case "FAILED":
				return "border-red-500"
			case "UPGRADING":
				return "border-yellow-500"
			default:
				return "border-gray-500"
		}
	}
	return (
		<Box className={`rounded-xl shadow px-4 py-3 border ${getBorderColor()} min-w-[200px] max-w-[250px]`}>
			<Box className="flex items-center gap-2">
				{getStatusIcon()}
				<Typography color="#E5E0E0" fontFamily="Manrope" fontSize="10px" fontWeight="600" lineHeight="20px">
					{label}
				</Typography>
			</Box>
			{!isFirst && <Handle type="target" position={Position.Left} />}
			{!isLast && <Handle type="source" position={Position.Right} />}
		</Box>
	)
}
