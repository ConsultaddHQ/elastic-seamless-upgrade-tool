import { type MouseEvent, type ReactNode, useState } from "react"
import { Box, Button, IconButton, Menu, MenuItem } from "@mui/material"

export interface DropdownItem {
	label: string
	icon?: ReactNode
	onClick?: () => void
	disabled?: boolean
}

interface AppDropdownProps {
	label: string | ReactNode
	items: DropdownItem[]
	buttonClassName?: string
	menuClassName?: string
	iconOnly?: boolean
}

export function AppDropdown({ label, items, buttonClassName, iconOnly }: AppDropdownProps) {
	const [anchorEl, setAnchorEl] = useState<null | HTMLElement>(null)
	const open = Boolean(anchorEl)

	const handleClick = (event: MouseEvent<HTMLButtonElement>) => {
		setAnchorEl(event.currentTarget)
	}

	const handleClose = () => {
		setAnchorEl(null)
	}
	return (
		<Box className="mx-1">
			<Box className="!bg-[#212022] border-1 !border-[#615D6A] !rounded-lg">
				{iconOnly ? (
					<IconButton
						onClick={handleClick}
						className={`!rounded-lg ${buttonClassName ?? ""}`}
						style={{ width: "36px", height: "36px" }}
					>
						{label}
					</IconButton>
				) : (
					<Button
						onClick={handleClick}
						className={`!normal-case !text-sm !px-4 !py-2!text-white  ${buttonClassName ?? ""}`}
					>
						{label}
					</Button>
				)}
			</Box>
			<Menu
				anchorEl={anchorEl}
				open={open}
				onClose={handleClose}
				transformOrigin={{ horizontal: "right", vertical: "top" }}
				anchorOrigin={{ horizontal: "right", vertical: "bottom" }}
				slotProps={{
					paper: {
						className: "mt-1",
						style: { width: "154px", background: "#212022", padding: "6px 8px",borderRadius: "6px", },
					},
					list: {
						className: "bg-[#212022]",
					},
				}}
			>
				{items.map((item, idx) => (
					<MenuItem
						key={idx}
						onClick={() => {
							item.onClick?.()
							handleClose()
						}}
						disabled={item.disabled}
						className="flex gap-1 items-center"
						sx={{
							color: "#898484",
							fontFamily: "Manrope",
							fontSize: "13px",
							fontStyle: "normal",
							fontWeight: 500,
							lineHeight: "20px",
							padding: "6px 8px",
							borderRadius: "6px",
							"&:hover": {
								background:'#242424',
								color: "#FFF",
							},
						}}
					>
						<Box className="flex items-center gap-[4px]">{item.icon}
							{item.label}</Box>
					</MenuItem>
				))}
			</Menu>
		</Box>
	)
}
