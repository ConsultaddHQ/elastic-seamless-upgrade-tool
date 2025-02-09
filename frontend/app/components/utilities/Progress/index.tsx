import React from "react"
import { LinearProgress, Box, Typography } from "@mui/material"
import { styled } from "@mui/system"
import { FaSyncAlt } from "react-icons/fa"

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

const CustomProgressBar: React.FC<CustomProgressBarProps> = ({ progress }) => {
	return (
		<Box display="flex" flexDirection="column" gap={1}>
			<Box display="flex" alignItems="center" justifyContent="space-between">
				<Box display="flex" alignItems="center" gap={1}>
					{/* <RefreshIcon style={{ color: 'gray' }} /> */}
					<FaSyncAlt style={{ color: "gray" }} />
					<Typography variant="body2" color="textSecondary">
						Upgrading
					</Typography>
				</Box>
				<Typography variant="body2" style={{ color: progress === 100 ? "#4caf50" : "#fbc02d" }}>
					{progress}%
				</Typography>
			</Box>
			{/* Progress Bar */}
			<StyledLinearProgress variant="determinate" value={progress} />
		</Box>
	)
}

export default CustomProgressBar
