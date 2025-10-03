import { Box, Breadcrumbs, Typography } from "@mui/material"
import { ArrowRight2, Convertshape2 } from "iconsax-react"
import { Link, useParams } from "react-router"
import UpgradeCluster from "~/components/core/UpgradeCluster"
import type { Route } from "../+types/root"

export function meta({}: Route.MetaArgs) {
	return [{ title: "Cluster Upgrade" }, { name: "description", content: "Welcome to Hyperflex" }]
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
					<Link to={`/${clusterId}/upgrade-assistant`}>
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
						Upgrade Cluster
					</Typography>
				</Breadcrumbs>
			</Box>
			<UpgradeCluster clusterType="ELASTIC" />
		</Box>
	)
}

export default ClusterUpgrade
