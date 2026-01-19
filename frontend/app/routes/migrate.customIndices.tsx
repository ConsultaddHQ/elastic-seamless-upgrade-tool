import { Box } from "@mui/material"
import type { Route } from "../+types/root"
import MigrateCustomIndices from "../components/core/MigrateCustomIndices"

export function meta({}: Route.MetaArgs) {
	return [{ title: "Migrate Custom Indices" }, { name: "description", content: "Migrate Custom Indices" }]
}

function MigrateCustomIndicesRoute() {
	return (
		<Box className="flex px-8 pt-4 h-full w-full">
			<MigrateCustomIndices />
		</Box>
	)
}

export default MigrateCustomIndicesRoute
