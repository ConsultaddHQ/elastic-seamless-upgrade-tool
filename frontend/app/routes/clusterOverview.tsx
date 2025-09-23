import { Box } from "@mui/material"
import ClusterInfo from "../components/core/ClusterInfo"
import type { Route } from "../+types/root"

export function meta({}: Route.MetaArgs) {
	return [{ title: "Cluster Overview" }, { name: "description", content: "Welcome to Hyperflex" }]
}

export default function ClusterOverview() {
	return (
		<Box className="flex w-full bg-[#0a0a0a]" padding={{xs: "16px 24px", md: "16px 32px"}}>
			<ClusterInfo />
		</Box>
	)
}
