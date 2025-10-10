import { Box, styled, Switch, type SwitchProps, Typography } from "@mui/material"

const AppSwitch = styled((props: SwitchProps) => (
	<Switch focusVisibleClassName=".Mui-focusVisible" disableRipple {...props} />
))(({ theme }) => ({
	width: 46,
	height: 24,
	padding: 4,
	border: "1px solid #292929",
	borderRadius: "12px",
	transition: theme.transitions.create(["background-color"], {
		duration: 500,
	}),
	"& .MuiSwitch-switchBase": {
		padding: 0,
		margin: 3,
		transitionDuration: "300ms",
		"&.Mui-checked": {
			transform: "translateX(22px)",
			color: "#121212",
			"& + .MuiSwitch-track": {
				backgroundColor: "#65C466",
				opacity: 1,
				border: 0,
			},
			"&.Mui-disabled + .MuiSwitch-track": {
				opacity: 0.5,
			},
		},
		"&.Mui-focusVisible .MuiSwitch-thumb": {
			color: "#33cf4d",
			border: "6px solid #fff",
		},
		"&.Mui-disabled .MuiSwitch-thumb": {
			color: theme.palette.grey[100],
		},
		"&.Mui-disabled + .MuiSwitch-track": {
			opacity: 0.7,
			...theme.applyStyles("dark", {
				opacity: 0.3,
			}),
		},
	},
	"& .MuiSwitch-thumb": {
		boxSizing: "border-box",
		width: 16,
		height: 16,
	},
	"& .MuiSwitch-track": {
		borderRadius: 12,
		opacity: 1,
		transition: theme.transitions.create(["background-color"], {
			duration: 500,
		}),
		...theme.applyStyles("dark", {
			backgroundColor: "#181818",
		}),
	},
}))

interface AppSwitchProps {
	checked: boolean
	onChange: (value: boolean) => void
	label: string
	disabled?: boolean
}
export default function ({ checked, onChange, label, disabled }: AppSwitchProps) {
	function handleSwitchClick(value: boolean) {
		onChange(value)
	}

	return (
		<Box className="flex items-center gap-[6px]">
			<Typography color="#D0CFD1" fontFamily="Manrope" fontSize="12px" fontWeight="500" lineHeight="100%">
				{label}
			</Typography>
			<AppSwitch
				checked={checked}
				disabled={disabled}
				sx={{ background: checked ? "#33cf4d" : "#181818" }}
				onClick={() => handleSwitchClick(!checked)}
			/>
		</Box>
	)
}
