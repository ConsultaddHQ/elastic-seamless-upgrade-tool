import { Box, Typography } from "@mui/material"
import { AddSquare, ArrowLeft } from "iconsax-react"
import { OutlinedBorderButton } from "~/components/utilities/Buttons"
import type { Route } from "../+types/root"
import PluginList from "~/components/core/plugins/PluginList"
import { useState } from "react"
import EditPlugin from "~/components/core/plugins/EditPlugin"
import AppBreadcrumb from "~/components/utilities/AppBreadcrumb"
import { useNavigate } from "react-router"

export function meta({}: Route.MetaArgs) {
	return [{ title: "Plugins" }, { name: "description", content: "Welcome to Hyperflex" }]
}

function PluginListing() {
	const [addPlugin, setAddPlugin] = useState<boolean>(false)
	const navigate = useNavigate()
	return (
		<>
			<Box className="flex px-8">
				<AppBreadcrumb
					items={[
						{
							label: "Go back",
							icon: <ArrowLeft size="14px" color="currentColor" />,
							onClick: ()=> navigate(-1),
						},
						{
							label: "Plugins",
							color: "#BDA0FF",
						},
					]}
				/>
			</Box>
			<Box className="flex px-8 pt-4 h-full w-full">
				{addPlugin && <EditPlugin isOpen={addPlugin} onOpenChange={() => setAddPlugin(false)} />}
				<Box
					className="flex p-px h-full w-full rounded-2xl"
					sx={{ background: "radial-gradient(#6E687C, #1D1D1D)" }}
				>
					<Box className="flex flex-col gap-4 h-full w-full bg-[#0D0D0D] rounded-[15px] px-6 py-4">
						<Box className="flex flex-row gap-2 justify-between items-center pl-2">
							<Typography
								color="#FFF"
								fontFamily="Manrope"
								fontSize="14px"
								fontWeight="600"
								lineHeight="22px"
							>
								Plugins
							</Typography>
							<OutlinedBorderButton
								sx={{ background: "#0D0D0D" }}
								padding="8px 16px"
								onClick={() => setAddPlugin(true)}
							>
								<AddSquare size="14px" color="currentColor" />
								Add plugin
							</OutlinedBorderButton>
						</Box>
						<Box className="flex">
							<PluginList />
						</Box>
					</Box>
				</Box>
			</Box>
		</>
	)
}

export default PluginListing
