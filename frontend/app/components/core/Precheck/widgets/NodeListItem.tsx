import { Spinner } from "@heroui/react"
import { Box, Typography } from "@mui/material"
import { TickCircle, Warning2 } from "iconsax-react"
import { cn } from "~/lib/Utils"

function NodeListItem({
	name,
	isSelected,
	status = "PENDING",
	onClick = () => {},
}: {
	status?: "PENDING" | "COMPLETED" | "FAILED" | "RUNNING"
	name: string
	isSelected: boolean
	onClick: () => void
}) {
	return (
		<Box
			className={cn("rounded-md p-px min-w-[282px] cursor-pointer", {
				"bg-gradient-to-tl from-[#1D1D1D] via-[#8171A6] to-[#1D1D1D]": isSelected,
				"bg-transparent": !isSelected,
			})}
			onClick={onClick}
		>
			<Box
				className={cn("flex items-center gap-2 py-3 px-[14px] text-[#C3C4CB] rounded-md transition-all", {
					"bg-[#1F1F1F] text-white": isSelected,
					"hover:bg-[#1D1D1D]": !isSelected,
				})}
			>
				{status === "PENDING" || status === "RUNNING" ? (
					<Spinner color="default" variant="simple" classNames={{ wrapper: "size-4 text-inherit" }} />
				) : status === "COMPLETED" ? (
					<TickCircle size="20px" color="#4CDB9D" variant="Bold" />
				) : (
					<Warning2 size="20px" color="#E75547" variant="Bold" />
				)}
				<Typography fontSize="13px" fontStyle="normal" fontWeight="500" lineHeight="20px">
					{name}
				</Typography>
			</Box>
		</Box>
	)
}

export default NodeListItem
