import { Tab, Tabs } from "@heroui/react"
import { Box, Breadcrumbs, Tooltip, Typography } from "@mui/material"
import { useMutation } from "@tanstack/react-query"
import { ArrowRight2, Convertshape2, ExportCurve, Refresh } from "iconsax-react"
import { useEffect, useState } from "react"
import { Link, useParams } from "react-router"
import { toast } from "sonner"
import axiosJSON from "~/apis/http"
import Precheck from "~/components/core/Precheck"
import { OutlinedBorderButton } from "~/components/utilities/Buttons"
import StringManager from "~/constants/StringManager"
import type { Route } from "../+types/root"
import useFilters from "~/lib/hooks/useFilter"
import { PrecheckSummary } from "~/components/core/Precheck/summary"

export function meta({}: Route.MetaArgs) {
	return [{ title: "Pre-check" }, { name: "description", content: "Welcome to Hyperflex" }]
}

function PreCheckPage() {
	const { clusterId } = useParams()
	const [isExportPending, setIsExportPending] = useState(false)
	const reRunPrecheck = async () => {
		await axiosJSON.post(`/clusters/${clusterId}/prechecks/rerun`, {}).catch((err) => {
			toast.error(err?.response?.data.error ?? StringManager.GENERIC_ERROR)
		})
	}

	const [selectedTab, setSelectedTab] = useState<TCheckTab>("CLUSTER")

	const [filters, updateFilter] = useFilters({
		tab: "",
	})

	useEffect(() => {
		setSelectedTab((filters.tab as TCheckTab) || "CLUSTER")
	}, [])

	const { mutate: HandleRerun, isPending } = useMutation({
		mutationKey: ["re-run-prechecks"],
		mutationFn: reRunPrecheck,
	})
	const handleExport = async () => {
		setIsExportPending(true)
		try {
			const response = await axiosJSON.get(`/clusters/${clusterId}/prechecks/report`, {
				responseType: "blob",
			})
			const blob = new Blob([response.data], { type: "text/markdown" })
			const url = URL.createObjectURL(blob)
			const a = document.createElement("a")
			a.href = url
			a.download = "precheck-report.md"
			a.click()

			URL.revokeObjectURL(url)
		} catch (err) {
			toast.error("Something went wrong while exporting the file")
		} finally {
			setIsExportPending(false)
		}
	}

	return (
		<Box className="flex flex-col w-full gap-[10px]" padding="0px 32px">
			<Box className="flex justify-between items-center w-full">
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
							Prechecks
						</Typography>
					</Breadcrumbs>
				</Box>

				<Box className="flex gap-[6px]">
					<Box className="flex flex-row gap-[6px]">
						<PrecheckSummary />
						<Tooltip title="Rerun all prechecks" arrow>
							<OutlinedBorderButton onClick={HandleRerun} disabled={isPending}>
								<Refresh color="currentColor" size="14px" /> {isPending ? "Running" : "Rerun"}
							</OutlinedBorderButton>
						</Tooltip>
						<OutlinedBorderButton onClick={handleExport} disable={isExportPending}>
							<ExportCurve color="currentColor" size="14px" /> {isExportPending ? "Exporting" : "Export"}
						</OutlinedBorderButton>
					</Box>
				</Box>
			</Box>
			<Box
				sx={{ background: "linear-gradient(167deg, #1D1D1D 6.95%, #6E687C 36.4%, #1D1D1D 92.32%)" }}
				className="flex h-fit w-fit p-px rounded-lg"
			>
				<Tabs
					size="sm"
					classNames={{
						tabList: "bg-black rounded-[7px]",
						cursor: "!bg-white rounded-[6px]",
						tabContent:
							"group-data-[selected=true]:text-[#1B1D20] text-[12px] font-[500] line-height-[18px]",
					}}
					selectedKey={selectedTab}
					onSelectionChange={(e) => {
						setSelectedTab(e as TCheckTab)
						updateFilter("tab", e as string)
					}}
				>
					<Tab title="Cluster" key="CLUSTER" />
					<Tab title="Nodes" key="NODES" />
					<Tab title="Index" key="INDEX" />
					<Tab title="Breaking changes" key="BREAKING_CHANGES" />
				</Tabs>
			</Box>
			<Precheck selectedTab={selectedTab} />
		</Box>
	)
}

export default PreCheckPage
