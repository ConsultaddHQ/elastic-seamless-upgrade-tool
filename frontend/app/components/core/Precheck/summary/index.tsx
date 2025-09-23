import { Alarm, ArrowCircleRight2 } from "iconsax-react"
import { FiAlertTriangle } from "react-icons/fi"
import { usePrecheckSummary } from "~/lib/hooks/usePrecheckSummary"
import { Box } from "@mui/material"
import useFilters from "~/lib/hooks/useFilter.ts"

const config: Record<
	SEVERITY,
	{
		bg: (selected: boolean) => string
		color: (selected: boolean) => string
		label: string
		Icon: React.ComponentType<{ size?: string; color?: string }>
	}
> = {
	WARNING: {
		bg: (selected) => (selected ? "bg-[#E3C045]" : "bg-amber-300/10"),
		color: (selected) => (selected ? "#2B2719" : "#E3C045"),
		label: "Warning",
		Icon: Alarm,
	},
	ERROR: {
		bg: (selected) => (selected ? "bg-[#E87D65]" : "bg-red-500/10"),
		color: (selected) => (selected ? "#1B0D0A" : "#E87D65"),
		label: "Critical",
		Icon: FiAlertTriangle,
	},
	SKIPPED: {
		bg: (selected) => (selected ? "bg-[#98959E]" : "bg-[#98959E21]"),
		color: (selected) => (selected ? "#212125" : "#98959E"),
		label: "Skipped",
		Icon: ArrowCircleRight2,
	},
	INFO: {
		bg: (selected) => "",
		color: (selected) => "",
		label: "Info",
		Icon: ArrowCircleRight2,
	},
}

function PrecheckSummaryItem({ type, count }: { type: SEVERITY; count: number }) {
	const { bg, color, label, Icon } = config[type]
	const [{ severity }, updateFilters] = useFilters<{ severity?: SEVERITY }>({})

	return (
		<Box
			className={`px-[7px] py-[5px] ${bg(
				severity == type
			)} rounded-3xl inline-flex justify-center items-center gap-1 overflow-hidden`}
			onClick={() => updateFilters("severity", type == severity ? undefined : type)}
		>
			<Box className="flex justify-start items-center gap-1">
				<Icon size="14px" color={color(severity == type)} />
				<Box
					className="justify-start text-[12px] font-medium font-['Inter']"
					style={{ color: color(severity == type) }}
				>
					{label} {count}
				</Box>
			</Box>
		</Box>
	)
}

export function PrecheckSummary() {
	const precheckSummary = usePrecheckSummary()
	return (
		<Box className="flex items-center justify-center gap-[6px]">
			<PrecheckSummaryItem count={precheckSummary.critical} type="ERROR" />
			<PrecheckSummaryItem count={precheckSummary.warning} type="WARNING" />
			<PrecheckSummaryItem count={precheckSummary.skipped} type="SKIPPED" />
		</Box>
	)
}
