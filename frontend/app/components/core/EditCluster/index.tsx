import { Box } from "@mui/material"
import { ArrowLeft } from "iconsax-react"
import { FullScreenDrawer } from "~/components/utilities/FullScreenDrawer"
import AppBreadcrumb from "~/components/utilities/AppBreadcrumb"
import React, { useEffect } from "react"
import EditClusterDetail from "./EditClusterDetail"
import EditSshDetail from "./EditSshDetail"
import { EditClusterCredential } from "./EditCredential"
import EditSettingTabs from "./EditSettingTabs"
import { useParams } from "react-router"
import axiosJSON from "~/apis/http"

function EditClusterBreadcrumb({ onBack }: { onBack: () => void }) {
	return (
		<AppBreadcrumb
			items={[
				{
					label: "Go back",
					icon: <ArrowLeft size="14px" color="currentColor" />,
					onClick: onBack,
				},
				{
					label: "Edit cluster",
					color: "#BDA0FF",
				},
			]}
		/>
	)
}

type TabTypes = "CLUSTER_DETAIL" | "CREDENTIAL" | "SSH_DETAIL"

function EditCluster({ isOpen, onOpenChange }: { isOpen: boolean; onOpenChange: () => void }) {
	const { clusterId } = useParams()
	const [infraType, setInfraType] = React.useState<string>("")
	useEffect(() => {
		if (clusterId) {
			axiosJSON.get(`/clusters/${clusterId}`).then((res) => {
				setInfraType(res.data.type)
			});
		}
	}, [clusterId])
	const [selectedTab, setSelectedTab] = React.useState<TabTypes>("CLUSTER_DETAIL")
	return (
		<FullScreenDrawer isOpen={isOpen} onOpenChange={onOpenChange}>
			<Box minHeight="58px" />
			<Box className="flex items-center gap-3 justify-between">
				<EditClusterBreadcrumb onBack={onOpenChange} />
			</Box>
			<Box
				className="flex p-px rounded-2xl h-[calc(var(--window-height)-120px)]"
				sx={{ background: "radial-gradient(#6E687C, #1D1D1D)" }}
			>
				<Box className="flex flex-col gap-6 pt-6 rounded-2xl bg-[#0D0D0D] w-full h-full items-start">
					<Box className="flex flex-col w-full gap-3 overflow-auto items-center" padding="0px 32px 24px 32px">
						<Box className="flex flex-col max-w-[552px] w-full items-center gap-[8px]">
							<EditSettingTabs
								selectedTab={selectedTab}
								setSelectedTab={(tab) => setSelectedTab(tab)}
								infraType={infraType}
							/>
							<Box className="h-[40px]"></Box>
							<Box className="w-full">
								{selectedTab === "CLUSTER_DETAIL" && <EditClusterDetail />}
								{selectedTab === "CREDENTIAL" && <EditClusterCredential />}
								{selectedTab === "SSH_DETAIL" && <EditSshDetail />}
							</Box>
						</Box>
					</Box>
				</Box>
			</Box>
		</FullScreenDrawer>
	)
}

export default EditCluster
