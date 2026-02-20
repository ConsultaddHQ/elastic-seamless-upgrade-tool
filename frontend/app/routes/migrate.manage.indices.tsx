import { Box } from "@mui/material"
import type { Route } from "../+types/root"
import ManageIndices from "../components/core/ManageIndices"

export function meta({}: Route.MetaArgs) {
	return [{ title: "Migrate Indices" }, { name: "description", content: "Migrate Indices" }]
}

function ManageIndicesRoute() {
	return (
		<Box className="flex px-8 pt-4 h-full w-full">
			<ManageIndices />
		</Box>
	)
}

export default ManageIndicesRoute
