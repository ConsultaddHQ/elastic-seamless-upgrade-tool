import { Box, Button as MuiButton } from "@mui/material"
import { mergeDicts } from "~/lib/Utils"

const STYLES: { [path: string]: (props: any) => {} } = {
	outlined: (props: any) => {
		return {
			height: "40px",
			fontSize: "15px",
			fontWeight: 500,
			lineHeight: "normal",
			textTransform: "none",
			background: props.disabled ? "#141414" : "#0A0A0A",
			borderRadius: "10px",
			color: props.disabled ? "#49494B !important" : "#FFF !important",
			display: "flex",
			gap: "6px",
			padding: "10px 16px",
			borderWidth: "1px",
			borderStyle: "solid",
			borderColor: props.disabled ? "#292929" : "#FFF",
			transition: "all 0.5s",
		}
	},
	contained: (props: any) => {
		return {
			height: "40px",
			display: "flex",
			gap: "6px",
			padding: "10px 16px",
			background: props.disabled ? "#141414" : "#FFF",
			borderRadius: "10px",
			color: props.disabled ? "#49494B !important" : "#0A0A0A !important",
			textTransform: "none",
			fontSize: "15px",
			fontWeight: 500,
			lineHeight: "normal",
			transition: "all 0.5s",
			borderWidth: "1px",
			borderStyle: "solid",
			borderColor: props.disabled ? "#292929" : "transparent",

			":hover": {
				background: "#0A0A0A",
				color: "#FFF !important",
			},
		}
	},
	"outlined-border": (props: any) => {
		return {
			height: "36px",
			display: "flex",
			gap: "6px",
			padding: props.padding,
			background: props.disabled ? "#141414" : "#212022",
			borderRadius: "10px",
			color: props.disabled ? "#49494B !important" : "#D0CFD1 !important",
			textTransform: "none",
			fontSize: props.fontSize,
			fontWeight: 500,
			lineHeight: "normal",
			transition: "all 0.5s",
			borderWidth: "1px",
			borderStyle: "solid",
			borderColor: props.disabled ? "#292929" : "transparent",

			":hover": {
				color: "#FFFFFF !important",
				background: props.disabled ? "#141414" : "#171717",
			},

			"& > #icon, :hover > #hoverIcon": {
				display: "flex",
			},
			"& > #hoverIcon, :hover > #icon": {
				display: "none",
			},
		}
	},
}

export function ConatinedButton(props: any) {
	const { gradientHover = "linear-gradient(91deg, #896BD3 0%, #C8BDE4 52.44%, #6B46C5 98.94%)", ...buttonProps } =
		props

	return (
		<Box
			className="flex p-px bg-transparent rounded-[10px]"
			sx={{
				cursor: buttonProps.disabled ? "not-allowed" : "pointer",
				":hover": {
					background: !buttonProps.disabled && gradientHover,
				},
			}}
		>
			<MuiButton
				sx={{ ...STYLES["contained"]({ disabled: buttonProps.disabled }), ...buttonProps?.sx }}
				{...buttonProps}
			/>
		</Box>
	)
}

export function OutlinedButton(props: any) {
	const { sx = {}, ...buttonProps } = props

	return (
		<Box
			className="flex p-px bg-transparent rounded-[10px]"
			sx={{
				cursor: buttonProps.disabled ? "not-allowed" : "pointer",
			}}
		>
			<MuiButton sx={{ ...mergeDicts(STYLES["outlined"]({ disabled: props.disabled }), sx) }} {...buttonProps} />
		</Box>
	)
}

export function OutlinedBorderButton(props: any) {
	const {
		borderColor = "#615D6A",
		bgColor = "#212022",
		hoverBgColor = "#171717",
		gradient = "linear-gradient(91deg, #896BD3 0%, #C8BDE4 52.44%, #6B46C5 98.94%)",
		icon: Icon,
		iconProps,
		filledIconProps,
		filledIcon: FilledIcon,
		iconPos = "start",
		iconSize = "18px",
		sx = {},
		boxShadow = "0px 0px 14px 2px rgba(126, 81, 231, 0.52)",
		borderRadius = "10px",
		padding = "6px 10px",
		fontSize = "12px",
		...buttonProps
	} = props

	const getIcon = () => {
		return (
			<>
				<span id="icon">
					<Icon color="currentColor" size={iconSize} {...iconProps} />
				</span>
				<span id="hoverIcon">
					<FilledIcon color="currentColor" variant="Bold" size={iconSize} {...filledIconProps} />
				</span>
			</>
		)
	}

	return (
		<Box
			className="flex p-px bg-transparent h-min"
			sx={{
				borderRadius: borderRadius,
				transition: "all 0.5s",
				cursor: buttonProps.disabled ? "not-allowed" : "pointer",
				background: !buttonProps.disabled && borderColor,
				":hover": {
					background: !buttonProps.disabled && gradient,
					boxShadow: !buttonProps.disabled ? boxShadow : "none",
				},
			}}
		>
			<MuiButton
				sx={{
					...mergeDicts(
						STYLES["outlined-border"]({ disabled: props.disabled, padding: padding, fontSize: fontSize }),
						sx
					),
					borderRadius,
				}}
				{...buttonProps}
			>
				{iconPos === "start" && Icon && getIcon()}
				{buttonProps.children}
				{iconPos === "end" && Icon && getIcon()}
			</MuiButton>
		</Box>
	)
}
