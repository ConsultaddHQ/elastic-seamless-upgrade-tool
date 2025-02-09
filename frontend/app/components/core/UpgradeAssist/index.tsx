import { Skeleton } from "@heroui/react"
import { Box, Typography } from "@mui/material"
import { useQuery } from "@tanstack/react-query"
import { Camera, Flash } from "iconsax-react"
import { useState } from "react"
import { Link } from "react-router"
import { toast } from "sonner"
import axiosJSON from "~/apis/http"
import { OutlinedBorderButton } from "~/components/utilities/Buttons"
import StorageManager from "~/constants/StorageManager"
import LocalStorageHandler from "~/lib/LocalHanlder"
import { getStepIndicatorData } from "~/lib/Utils"
import DeprectedSettings from "./widgets/DeprectedSettings"
import StepBox from "./widgets/StepBox"

function UpgradeAssistant() {
	const [stepStatus, setStepStatus] = useState<{
		[Key: string]: "COMPLETED" | "INPROGRESS" | "PENDING" | "NOTVISITED"
	}>({ "1": "NOTVISITED", "2": "NOTVISITED", "3": "NOTVISITED", "4": "NOTVISITED" })

	const getUpgradeInfo = async () => {
		const clusterId = LocalStorageHandler.getItem(StorageManager.CLUSTER_ID) || "cluster-id"
		let response: any = []
		await axiosJSON
			.get(`/api/elastic/clusters/${clusterId}/upgrade_info`)
			.then((res) => {
				response = res.data
				console.log(response)
				// const step1 = response.elastic.snapshot ? "COMPLETED" : "PENDING"
				// const step2 =
				// 	step1 === "PENDING"
				// 		? "NOTVISITED"
				// 		: response?.elastic.deprecations.critical + response?.kibana.deprecations.critical > 0
				// 		? "PENDING"
				// 		: response?.elastic.deprecations.warning + response?.kibana.deprecations.warning > 0
				// 		? "INPROGRESS"
				// 		: "COMPLETED"
				// const step3 =
				// 	step2 === "PENDING" || step2 === "NOTVISITED"
				// 		? "NOTVISITED"
				// 		: response.elastic?.isUpgradable
				// 		? "COMPLETED"
				// 		: "PENDING"
				// const step4 =
				// 	step3 === "PENDING" || step3 === "NOTVISITED"
				// 		? "NOTVISITED"
				// 		: response.kibana?.isUpgradable
				// 		? "COMPLETED"
				// 		: "PENDING"

				const { elastic, kibana } = response ?? {}
				const step1Status = elastic?.snapshot ? "COMPLETED" : "PENDING"

				// Helper function to sum deprecations safely
				const sumDeprecations = (type: string) =>
					(elastic?.deprecations?.[type] ?? 1) + (kibana?.deprecations?.[type] ?? 1)

				// Step 2 calculations
				const criticalDeprecations = sumDeprecations("critical")
				const warningDeprecations = sumDeprecations("warning")

				const step2Status =
					step1Status === "PENDING"
						? "NOTVISITED"
						: criticalDeprecations > 0
						? "PENDING"
						: warningDeprecations > 0
						? "INPROGRESS"
						: "COMPLETED"

				// Helper for subsequent steps
				const getNextStepStatus = (prevStatus: string, isUpgradable: string) =>
					prevStatus === "PENDING" || prevStatus === "NOTVISITED"
						? "NOTVISITED"
						: isUpgradable
						? "COMPLETED"
						: "PENDING"

				const step3Status = getNextStepStatus(step2Status, elastic?.isUpgradable)
				const step4Status = getNextStepStatus(step3Status, kibana?.isUpgradable)

				setStepStatus({
					"1": step1Status,
					"2": step2Status,
					"3": step3Status,
					"4": step4Status,
				})
			})
			.catch((err) => toast.error(err?.response?.data.err))
		return response
	}

	const { data, isLoading, refetch, isRefetching } = useQuery({ queryKey: ["cluster-info"], queryFn: getUpgradeInfo })

	const step1Data = getStepIndicatorData("01", stepStatus["1"])
	const step2Data = getStepIndicatorData("02", stepStatus["2"])
	const step3Data = getStepIndicatorData("03", stepStatus["3"])
	const step4Data = getStepIndicatorData("04", stepStatus["4"])

	return isLoading || isRefetching ? (
		<Box className="flex flex-col gap-4 w-full px-6">
			<Skeleton className="w-full rounded-[20px]">
				<Box height="88px" />
			</Skeleton>
			<Skeleton className="w-full rounded-[20px]">
				<Box height="229.5px" />
			</Skeleton>
			<Skeleton className="w-full rounded-[20px]">
				<Box height="108px" />
			</Skeleton>
			<Skeleton className="w-full rounded-[20px]">
				<Box height="108px" />
			</Skeleton>
		</Box>
	) : (
		<ol className="flex flex-col gap-4 w-full overflow-auto h-[calc(var(--window-height)-214px)] px-6">
			<StepBox
				currentStepStatus={stepStatus["1"]}
				nextStepStatus={stepStatus["2"]}
				boxBackground={step1Data?.boxBackground}
				background={step1Data?.background}
				boxShadow={step1Data?.boxShadow}
				internalBackground={step1Data?.internalBackground}
				textColor={step1Data?.textColor}
				stepValue={step1Data?.stepValue}
			>
				<Box className="flex flex-row gap-3 items-center rounded-[20px] justify-between w-full">
					<Box className="flex flex-col gap-[6px]">
						<Typography color="#FFF" fontSize="16px" fontWeight="600" lineHeight="normal">
							Back up your data
						</Typography>
						<Typography
							color="#6E6E6E"
							fontSize="13px"
							fontWeight="400"
							lineHeight="20px"
							letterSpacing="0.26px"
						>
							Make sure you have a current snapshot before making an changes.
						</Typography>
					</Box>
					{!(stepStatus["01"] === "COMPLETED") ? (
						<OutlinedBorderButton icon={Camera} filledIcon={Camera} disabled={step1Data?.isDisabled}>
							Create snapshot
						</OutlinedBorderButton>
					) : null}
				</Box>
			</StepBox>
			<StepBox
				currentStepStatus={stepStatus["2"]}
				nextStepStatus={stepStatus["3"]}
				boxBackground={step2Data?.boxBackground}
				background={step2Data?.background}
				boxShadow={step2Data?.boxShadow}
				internalBackground={step2Data?.internalBackground}
				textColor={step2Data?.textColor}
				stepValue={step2Data?.stepValue}
			>
				<Box className="flex flex-col gap-[10px] rounded-[20px] w-full">
					<Box className="flex flex-col gap-[6px]">
						<Typography color="#FFF" fontSize="16px" fontWeight="600" lineHeight="normal">
							Review deprecated settings & resolve issue
						</Typography>
						<Typography
							color="#6E6E6E"
							fontSize="13px"
							fontWeight="400"
							lineHeight="20px"
							letterSpacing="0.26px"
						>
							You must resolve any critical Elasticsearch and Kibana configuration issues before upgrading
							to Elastic 8.x. Ignoring warnings might result in differences in behavior after you upgrade.
							If you have application code that calls Elasticsearch APIs, review the Elasticsearch
							deprecation logs to make sure you are not using deprecated APIs.
						</Typography>
					</Box>
					<Box className="flex flex-row gap-8 flex-grow w-full" flexWrap={{ xs: "wrap", md: "nowrap" }}>
						<DeprectedSettings
							title="Elastic search"
							criticalValue={data?.elastic.deprecations.critical ?? "NaN"}
							warningValue={data?.elastic.deprecations.warning ?? "NaN"}
							isDisabled={step2Data?.isDisabled}
							to="/elastic/deprecation-logs"
						/>
						<DeprectedSettings
							title="Kibana"
							criticalValue={data?.kibana.deprecations.critical ?? "NaN"}
							warningValue={data?.kibana.deprecations.warning ?? "NaN"}
							isDisabled={step2Data?.isDisabled}
							to="/kibana/deprecation-logs"
						/>
					</Box>
				</Box>
			</StepBox>
			<StepBox
				currentStepStatus={stepStatus["3"]}
				nextStepStatus={stepStatus["4"]}
				boxBackground={step3Data?.boxBackground}
				background={step3Data?.background}
				boxShadow={step3Data?.boxShadow}
				internalBackground={step3Data?.internalBackground}
				textColor={step3Data?.textColor}
				stepValue={step3Data?.stepValue}
			>
				<Box className="flex flex-row gap-3 items-center rounded-[20px] justify-between w-full">
					<Box className="flex flex-col gap-[6px]">
						<Typography color="#FFF" fontSize="16px" fontWeight="600" lineHeight="normal">
							Upgrade Cluster
						</Typography>
						<Typography
							color="#6E6E6E"
							fontSize="13px"
							fontWeight="400"
							lineHeight="20px"
							letterSpacing="0.26px"
						>
							Once you've resolved all critical issues and verified that your applications are ready, you
							can upgrade to Elastic 8.x. Be sure to back up your data again before upgrading.
						</Typography>
					</Box>
					<OutlinedBorderButton
						component={Link}
						to="/elastic/upgrade"
						disabled={step3Data?.isDisabled}
						icon={Flash}
						filledIcon={Flash}
					>
						Upgrade
					</OutlinedBorderButton>
				</Box>
			</StepBox>
			<StepBox
				lastNode={true}
				boxBackground={step4Data?.boxBackground}
				background={step4Data?.background}
				boxShadow={step4Data?.boxShadow}
				internalBackground={step4Data?.internalBackground}
				textColor={step4Data?.textColor}
				stepValue={step4Data?.stepValue}
			>
				<Box className="flex flex-row gap-3 items-center rounded-[20px] justify-between w-full">
					<Box className="flex flex-col gap-[6px]">
						<Typography color="#FFF" fontSize="16px" fontWeight="600" lineHeight="normal">
							Upgrade Kibana
						</Typography>
						<Typography
							color="#6E6E6E"
							fontSize="13px"
							fontWeight="400"
							lineHeight="20px"
							letterSpacing="0.26px"
						>
							Once you've resolved all critical issues and verified that your applications are ready, you
							can upgrade to Elastic 8.x. Be sure to back up your data again before upgrading.
						</Typography>
					</Box>
					<OutlinedBorderButton
						component={Link}
						to="/kibana/upgrade"
						disabled={step4Data?.isDisabled}
						icon={Flash}
						filledIcon={Flash}
					>
						Upgrade
					</OutlinedBorderButton>
				</Box>
			</StepBox>
		</ol>
	)
}

export default UpgradeAssistant
