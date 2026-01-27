import { Box, LinearProgress, Typography } from "@mui/material"
import { styled } from "@mui/system"
import { Refresh } from "iconsax-react"
import React from "react"

type CustomProgressBarProps = {
	progress: number
}

const StyledLinearProgress = styled(LinearProgress)(({ theme }) => ({
	height: 8,
	borderRadius: 4,
	backgroundColor: theme.palette.mode === "dark" ? "#333" : "#e0e0e0",
	"& .MuiLinearProgress-bar": {
		borderRadius: 4,
		backgroundColor: (progress: number) => (progress === 100 ? "#4caf50" : "#fbc02d"), // Green for 100%, Yellow otherwise
	},
}))

const ProgressBar: React.FC<CustomProgressBarProps> = ({ progress }) => {
	return (
		<Box className="flex flex-col gap-[6px] pt-[1.5px] w-full">
			<Box className="flex flex-row items-center gap-2 justify-between">
				<Typography
					className="flex flex-row gap-[6px] items-center"
					fontSize="11px"
					color="#ADADAD"
					fontWeight="500"
					lineHeight="normal"
				>
					<Refresh size="10px" color="currentColor" />
					Upgrading
				</Typography>
				<Typography
					fontSize="11px"
					fontWeight="500"
					lineHeight="normal"
					variant="body2"
					style={{ color: progress === 100 ? "#4caf50" : "#fbc02d" }}
				>
					{progress}%
				</Typography>
			</Box>
			<StyledLinearProgress variant="determinate" value={progress} />
		</Box>
	)
}

export default ProgressBar
