import { Tabs, Tab } from "@heroui/react"
import { Box } from "@mui/material"
import { Hierarchy2, Keyboard, DirectNormal, Edit } from "iconsax-react"

type TabTypes = "CLUSTER_DETAIL" | "CREDENTIAL" | "SSH_DETAIL"

interface EditSettingTabsProps {
	selectedTab: TabTypes
	setSelectedTab: (tab: TabTypes) => void
	infraType?: string
}

const EditSettingTabs: React.FC<EditSettingTabsProps> = ({ selectedTab, setSelectedTab, infraType }) => {
	const tabConfig = [
		{
			key: "CLUSTER_DETAIL",
			label: "Cluster details",
			icon: Hierarchy2,
			show: true,
		},
		{
			key: "CREDENTIAL",
			label: "Credential",
			icon: Keyboard,
			show: true,
		},
		{
			key: "SSH_DETAIL",
			label: "SSH details",
			icon: DirectNormal,
			show: infraType === "SELF_MANAGED",
		},
	] as const

	const renderTabTitle = (key: TabTypes, label: string, Icon: React.ElementType) => (
		<div className="flex items-center space-x-2">
			<Icon size={16} color={key === selectedTab ? "#1B1D20" : "#ADADAD"} />
			<span className="group-data-[selected=true]:text-[#1B1D20] text-[12px] font-[500] leading-[18px]">
				{label}
			</span>
		</div>
	)

	return (
		<Box
			sx={{
				background: "linear-gradient(167deg, #1D1D1D 6.95%, #6E687C 36.4%, #1D1D1D 92.32%)",
			}}
			className="flex h-fit w-full p-px rounded-lg"
		>
			<Tabs
				size="sm"
				style={{ width: "100%" }}
				classNames={{
					tabList: "bg-black rounded-[7px] w-full flex",
					cursor: "!bg-white rounded-[6px]",
					tabContent: "group-data-[selected=true]:text-[#1B1D20] text-[12px] font-[500] leading-[18px]",
					tab: "flex-1",
				}}
				selectedKey={selectedTab}
				onSelectionChange={(e) => setSelectedTab(e as TabTypes)}
			>
				{tabConfig
					.filter((tab) => tab.show)
					.map(({ key, label, icon }) => (
						<Tab key={key} title={renderTabTitle(key, label, icon)} />
					))}
			</Tabs>
		</Box>
	)
}

export default EditSettingTabs
