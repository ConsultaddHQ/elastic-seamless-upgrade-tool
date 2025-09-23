import { Spinner } from "@heroui/react"
import { Box, Typography } from "@mui/material"
import { TickCircle, Warning2 } from "iconsax-react"
import { cn } from "~/lib/Utils"

function StatusIcon({ status, severity }: { status: string; severity?: SEVERITY }) {
	if (status === "PENDING" || status === "RUNNING") {
		return <Spinner color="default" variant="simple" classNames={{ wrapper: "size-4 text-inherit" }} />
	} else if (status === "COMPLETED") {
		return <TickCircle size="20px" color={severity === "SKIPPED" ? "#98959E" : "#4CDB9D"} variant="Bold" />
	} else {
		const isNonError = severity === "WARNING" || severity === "INFO" || severity === "SKIPPED"
		const color = isNonError ? "#E0B517" : "#E75547"
		return <Warning2 size="20px" color={severity === "SKIPPED" ? "#98959E" : color} variant="Bold" />
	}
}

function NodeListItem({
	name,
	isSelected,
	status = "PENDING",
	onClick = () => {},
	duration,
	severity,
}: {
	status?: "PENDING" | "COMPLETED" | "FAILED" | "RUNNING"
	severity?: SEVERITY
	name: string
	isSelected: boolean
	onClick: () => void
	duration?: string
}) {
	return (
		<Box
			className={cn("rounded-md p-px min-w-[102px] cursor-pointer", {
				"bg-gradient-to-tl from-[#1D1D1D] via-[#8171A6] to-[#1D1D1D]": isSelected,
				"bg-transparent": !isSelected,
			})}
			onClick={onClick}
		>
			<Box
				className={cn(
					"flex items-center justify-between gap-2 py-3 px-[14px] text-[#C3C4CB] rounded-md transition-all",
					{
						"bg-[#1F1F1F] text-white": isSelected,
						"hover:bg-[#1D1D1D]": !isSelected,
					}
				)}
			>
				<Box className="flex flex-row items-center gap-3">
					<Box className="min-w-5 min-h-5 max-w-5 max-h-5">
						<StatusIcon status={status} severity={severity} />
					</Box>
					<Typography fontSize="13px" fontStyle="normal" fontWeight="500" lineHeight="20px">
						{name}
					</Typography>
				</Box>
				{duration ? (
					<Typography
						color="#A9AAB6"
						textAlign="right"
						fontFamily="Roboto Mono"
						fontSize="13px"
						fontWeight="400"
						lineHeight="normal"
					>
						{duration}
					</Typography>
				) : null}
			</Box>
		</Box>
	)
}

export default NodeListItem
