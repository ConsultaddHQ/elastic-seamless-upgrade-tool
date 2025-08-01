import { Box, Typography } from "@mui/material"
import { AddSquare } from "iconsax-react"
import { useCallback, type Key } from "react"
import { Link } from "react-router"
import ClusterList from "~/components/core/ClusterList"
import { OutlinedBorderButton } from "~/components/utilities/Buttons"
import type { Route } from "../+types/root"

export function meta({}: Route.MetaArgs) {
	return [{ title: "Cluster Listing" }, { name: "description", content: "Welcome to Hyperflex" }]
}

function ClusterListing() {
	return (
		<Box className="flex px-8 pt-4 h-full w-full">
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
							Clusters
						</Typography>
						<OutlinedBorderButton sx={{ background: "#0D0D0D" }} padding="8px 16px" component={Link} to="/add-cluster">
							<AddSquare size="14px" color="currentColor" />
							Add cluster
						</OutlinedBorderButton>
					</Box>
					<Box className="flex">
						<ClusterList />
					</Box>
				</Box>
			</Box>
		</Box>
	)
}

export default ClusterListing
