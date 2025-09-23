import { Box, Breadcrumbs, Typography } from "@mui/material"
import type { Route } from "../+types/root"
import { ArrowRight2, Convertshape2 } from "iconsax-react"
import { Link } from "react-router"
import DeprecationLogs from "../components/core/DeprecationLogs"

export function meta({}: Route.MetaArgs) {
	return [{ title: "Elastic Deprecation Logs" }, { name: "description", content: "Welcome to Hyperflex" }]
}

function ElasticDeprecationLogs() {
	return (
		<Box className="flex flex-col w-full gap-[10px]" padding="0px 32px">
			<Box
				className="flex gap-[6px] w-max items-center rounded-lg border border-solid border-[#2F2F2F] bg-[#141415]"
				padding="6px 10px 8px 10px"
			>
				<Breadcrumbs separator={<ArrowRight2 color="#ADADAD" size="14px" />}>
					<Link to="/upgrade-assistant">
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
						Elasticsearch deprecated logs
					</Typography>
				</Breadcrumbs>
			</Box>
			<DeprecationLogs clusterType="ELASTIC" />
		</Box>
	)
}

export default ElasticDeprecationLogs
