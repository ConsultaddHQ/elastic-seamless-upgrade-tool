import { Box, Breadcrumbs, Typography } from "@mui/material"
import { ArrowRight2, Convertshape2 } from "iconsax-react"
import { Link, useParams } from "react-router"
import ClusterNodes from "~/components/core/ClusterNodes"
import type { Route } from "../+types/root"

export function meta({}: Route.MetaArgs) {
	return [{ title: "Cluster Nodes" }, { name: "description", content: "Cluster Nodes" }]
}

function ClusterUpgrade() {
	const {clusterId} = useParams()
	return (
		<Box className="flex flex-col w-full gap-[10px]" padding="0px 32px">
			<Box
				className="flex gap-[6px] w-max items-center rounded-lg border border-solid border-[#2F2F2F] bg-[#141415]"
				padding="6px 10px 8px 10px"
			>
				<Breadcrumbs separator={<ArrowRight2 color="#ADADAD" size="14px" />}>
					<Link to={`/${clusterId}/cluster-overview`}>
						<Typography
							className="flex items-center gap-[6px]"
							color="#ADADAD"
							fontSize="12px"
							fontWeight="500"
							lineHeight="normal"
						>
							<Convertshape2 color="currentColor" size="14px" /> Assist
						</Typography>
					</Link>
					<Typography color="#BDA0FF" fontSize="12px" fontWeight="500" lineHeight="normal">
						Cluster Nodes
					</Typography>
				</Breadcrumbs>
			</Box>
			<ClusterNodes />
		</Box>
	)
}

export default ClusterUpgrade
