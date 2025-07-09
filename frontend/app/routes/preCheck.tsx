import { Box, Breadcrumbs, Typography } from "@mui/material"
import type { Route } from "../+types/root"
import { ArrowRight2, Convertshape2, ExportCurve, Refresh } from "iconsax-react"
import { Link } from "react-router"
import Precheck from "~/components/core/Precheck"
import { OutlinedBorderButton } from "~/components/utilities/Buttons"
import axiosJSON from "~/apis/http"
import { useLocalStore } from "~/store/common"
import { useState } from "react"
import StringManager from "~/constants/StringManager"
import { toast } from "sonner"
import { useMutation } from "@tanstack/react-query"

export function meta({}: Route.MetaArgs) {
	return [{ title: "Pre-check" }, { name: "description", content: "Welcome to Hyperflex" }]
}

function PreCheckPage() {
	const clusterId = useLocalStore((state: any) => state.clusterId)
	const [isExportPending, setIsExportPending] = useState(false)
	const reReunPrecheck = async () => {
		await axiosJSON.post(`/api/elastic/clusters/${clusterId}/prechecks`).catch((err) => {
			console.log("Err", err)
			toast.error(err?.response?.data.err ?? StringManager.GENERIC_ERROR)
		})
	}

	const { mutate: HandleRerun, isPending } = useMutation({
		mutationKey: ["re-run-prechecks"],
		mutationFn: reReunPrecheck,
	})
	const handleExport = async () => {
		setIsExportPending(true)
		try {
			const response = await axiosJSON.get(`/api/elastic/clusters/${clusterId}/prechecks/report`, {
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
							Prechecks
						</Typography>
					</Breadcrumbs>
				</Box>

				<Box className="flex gap-[6px]">
					<Box className="flex flex-row gap-[6px]">
						<OutlinedBorderButton onClick={HandleRerun} disabled={isPending}>
							<Refresh color="currentColor" size="14px" /> {isPending ? "Running" : "Re-run"}
						</OutlinedBorderButton>
						<OutlinedBorderButton onClick={handleExport} disable={isExportPending}>
							<ExportCurve color="currentColor" size="14px" /> {isExportPending ? "Exporting" : "Export"}
						</OutlinedBorderButton>
					</Box>
				</Box>
			</Box>

			<Precheck />
		</Box>
	)
}

export default PreCheckPage
