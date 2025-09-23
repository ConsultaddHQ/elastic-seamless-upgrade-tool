import { Box } from "@mui/material"
import type { Route } from "../+types/root"
import UpgradeAssistant from "../components/core/UpgradeAssist"

export function meta({}: Route.MetaArgs) {
	return [{ title: "Upgrade Assistant" }, { name: "description", content: "Welcome to Hyperflex" }]
}

function UpgradeAssist() {
	return (
		<Box className="flex w-full bg-[#0A0A0A]" padding="28px 0px">
			<UpgradeAssistant />
		</Box>
	)
}

export default UpgradeAssist
