import { Spinner } from "@heroui/react"
import { Box, styled, Typography, type AccordionProps } from "@mui/material"
import MuiAccordion from "@mui/material/Accordion"
import MuiAccordionSummary, {
	type AccordionSummaryProps,
	accordionSummaryClasses,
} from "@mui/material/AccordionSummary"
import MuiAccordionDetails from "@mui/material/AccordionDetails"
import { ArrowRight2, TickCircle, Warning2 } from "iconsax-react"
import React from "react"
import { PrecheckStatus } from ".."

const Accordion = styled((props: AccordionProps) => <MuiAccordion disableGutters elevation={0} square {...props} />)(
	({ theme }) => ({
		".MuiAccordionSummary-root": {
			minHeight: "44px",
			padding: "0px 14px",
			transition: "all 0.5s",

			":hover": {
				backgroundColor: "#28282A",
			},
		},
		backgroundColor: "transparent",
		borderRadius: "8px",
		".Mui-expanded": {
			backgroundColor: "#28282A",
		},
		"&:not(:last-child)": {
			borderBottom: 0,
		},
		"&::before": {
			display: "none",
		},
	})
)

const AccordionSummary = styled((props: AccordionSummaryProps) => (
	<MuiAccordionSummary expandIcon={<ArrowRight2 size="16px" color="currentColor" />} {...props} />
))(({ theme }) => ({
	borderRadius: "8px",
	flexDirection: "row-reverse",
	[`& .${accordionSummaryClasses.expanded}`]: {
		color: "white !important",
	},
	[`& .${accordionSummaryClasses.expandIconWrapper}`]: {
		color: "#A9AAB6",
	},
	[`&:hover .${accordionSummaryClasses.expandIconWrapper}`]: {
		color: "#FFF",
	},
	[`& .${accordionSummaryClasses.expandIconWrapper}.${accordionSummaryClasses.expanded}`]: {
		transform: "rotate(90deg)",
	},
	[`& .${accordionSummaryClasses.content}`]: {
		margin: "8px 0px",
		marginLeft: theme.spacing(1),
		color: "#A9AAB6",
	},
	...theme.applyStyles("dark", {
		backgroundColor: "transparent",
	}),
}))

const AccordionDetails = styled(MuiAccordionDetails)(({ theme }) => ({
	".MuiAccordionDetails-root": {
		backgroundColor: "transparent !important",
	},
	marginTop: "4px",
	padding: "0px",
	cursor: "pointer",
	color: "#E5E0E0",
}))

function LogAccordion({
	title,
	status = PrecheckStatus.PENDING,
	logs = [],
	duration,
	expanded,
	onChange,
}: {
	title: string
	status?: PrecheckStatus
	logs?: string[]
	duration: string
	expanded: boolean
	onChange: (event: React.SyntheticEvent, newExpanded: boolean) => void
}) {
	return (
		<Accordion expanded={expanded} onChange={onChange}>
			<AccordionSummary>
				<Box className="flex flex-row items-center gap-2 justify-between w-full">
					<Typography
						className="flex items-center gap-3"
						fontSize="14px"
						fontStyle="normal"
						fontWeight="500"
						lineHeight="20px"
					>
						{status === "PENDING" || status === "RUNNING" ? (
							<Spinner color="default" variant="simple" classNames={{ wrapper: "size-4 text-inherit" }} />
						) : status === "COMPLETED" ? (
							<TickCircle size="20px" color="currentColor" variant="Bold" />
						) : (
							<Warning2 size="20px" color="#E75547" variant="Bold" />
						)}
						{title}
					</Typography>
					<Typography
						color="#A9AAB6"
						textAlign="right"
						fontFamily="Roboto Mono"
						fontSize="13px"
						fontStyle="normal"
						fontWeight="400"
						lineHeight="normal"
					>
						{duration}
					</Typography>
				</Box>
			</AccordionSummary>
			<AccordionDetails>
				{logs.length !== 0 ? (
					logs.map((item: string, index: number) => {
						return (
							<Box
								className="flex flex-row items-center gap-[18px]"
								sx={{
									":hover": { background: "#28282A", color: "#A08AF7" },
									padding: "4px 10px 4px 38px",
									borderRadius: "4px",
								}}
							>
								<Typography
									minWidth="18px"
									textAlign="right"
									fontFamily="Roboto Mono"
									fontSize="13px"
									fontStyle="normal"
									fontWeight="400"
									lineHeight="20px"
								>
									{index}
								</Typography>
								<Typography
									color="#E5E0E0"
									fontFamily="Roboto Mono"
									fontSize="13px"
									fontStyle="normal"
									fontWeight="400"
									lineHeight="20px"
								>
									{item}
								</Typography>
							</Box>
						)
					})
				) : (
					<Box
						className="flex flex-row items-center gap-[18px]"
						sx={{
							":hover": { background: "#28282A", color: "#A08AF7" },
							padding: "4px 10px 4px 38px",
							borderRadius: "4px",
						}}
					>
						<Typography
							minWidth="18px"
							textAlign="right"
							fontFamily="Roboto Mono"
							fontSize="13px"
							fontStyle="normal"
							fontWeight="400"
							lineHeight="20px"
						>
							1
						</Typography>
						<Typography
							color="#A6A6A6"
							fontFamily="Roboto Mono"
							fontSize="13px"
							fontStyle="italic"
							fontWeight="400"
							lineHeight="20px"
						>
							No logs available
						</Typography>
					</Box>
				)}
			</AccordionDetails>
		</Accordion>
	)
}

export default LogAccordion
