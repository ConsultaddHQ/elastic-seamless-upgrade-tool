import { Box, Typography } from "@mui/material"
import { Link } from "react-router"
import { OutlinedBorderButton } from "~/components/utilities/Buttons"
import type { Route } from "../../+types/root"

export function meta({}: Route.MetaArgs) {
	return [{ title: "404:Not found" }, { name: "description", content: "Welcome to Hyperflex" }]
}

function Page404() {
	return (
		<Box className="flex flex-col items-center justify-center h-[var(--window-height)] gap-3 bg-[#0A0A0A]">
			<Typography color="#FFF" fontSize="52px" fontWeight="600" lineHeight="normal">
				Page 404
			</Typography>
			<OutlinedBorderButton component={Link} to="/">
				Back to home page
			</OutlinedBorderButton>
		</Box>
	)
}

export default Page404
