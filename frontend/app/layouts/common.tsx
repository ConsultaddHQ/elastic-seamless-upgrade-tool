import { useDisclosure } from "@heroui/react"
import { Box } from "@mui/material"
import { Magicpen } from "iconsax-react"
import { Outlet } from "react-router"
import UpcomingFeature from "~/components/core/UpcomingFeature"
import { OutlinedBorderButton } from "~/components/utilities/Buttons"
import AssetsManager from "~/constants/AssetsManager"

function Common() {
	const { isOpen, onOpen, onOpenChange } = useDisclosure()

	return (
		<Box className="flex flex-col w-full pb-4" height="var(--window-height)">
			<Box className="flex flex-row gap-2 justify-between bg-[#0A0A0A]" padding="16px 32px 10px 40px" zIndex={isOpen ? "99999": "0"}>
				<img src={AssetsManager.LOGO_PLUS_NAMED} width="161.6px" height="36px" />
				<OutlinedBorderButton
					icon={Magicpen}
					filledIcon={Magicpen}
					iconProps={{ variant: "Bold" }}
					sx={{ ":hover": { color: "#F5BE3D !important" } }}
					gradient="linear-gradient(135deg,#E0B517 2.29%, #DFD8C0 44.53%, #151413 97.18%, #151413 97.18%)"
					boxShadow="0px 0px 19px 2px rgba(234, 180, 63, 0.41)"
					borderRadius="50px"
					onClick={onOpen}
				>
					Upcoming features
				</OutlinedBorderButton>
			</Box>
			<UpcomingFeature isOpen={isOpen} onOpenChange={onOpenChange} />
			<Outlet />
		</Box>
	)
}

export default Common
