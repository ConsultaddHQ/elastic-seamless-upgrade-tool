import { Skeleton } from "@heroui/react"
import { Box, Typography } from "@mui/material"
import { useQuery } from "@tanstack/react-query"
import { Camera, Flash } from "iconsax-react"
import moment from "moment"
import { useState } from "react"
import { Link } from "react-router"
import { toast } from "sonner"
import axiosJSON from "~/apis/http"
import { OutlinedBorderButton } from "~/components/utilities/Buttons"
import StringManager from "~/constants/StringManager"
import useCountdownTimer from "~/lib/hooks/useTimer"
import { getStepIndicatorData } from "~/lib/Utils"
import { useLocalStore } from "~/store/common"
import useSafeRouteStore from "~/store/safeRoutes"
import DeprectedSettings from "./widgets/DeprectedSettings"
import StepBox from "./widgets/StepBox"
import { FiArrowUpRight } from "react-icons/fi"

function UpgradeAssistant() {
	const clusterId = useLocalStore((state: any) => state.clusterId)
	const infraType = useLocalStore((state: any) => state.infraType)
	const deploymentId = useLocalStore((state: any) => state.deploymentId)
	const setDeploymentId = useLocalStore((state: any) => state.setDeploymentId)
	const { remainingTime, startTimer, resetTimer } = useCountdownTimer()
	const setDeprecationChangesAllowed = useSafeRouteStore((state: any) => state.setDeprecationChangesAllowed)
	const setElasticNodeUpgradeAllowed = useSafeRouteStore((state: any) => state.setElasticNodeUpgradeAllowed)
	const setKibanaNodeUpgradeAllowed = useSafeRouteStore((state: any) => state.setKibanaNodeUpgradeAllowed)
	const setPrecheckAllowed = useSafeRouteStore((state: any) => state.setPrecheckAllowed)

	// Format remaining time in HH:MM:SS
	const formatTime = (milliseconds: number | null): string => {
		if (milliseconds === null) return "Not Started"

		const totalSeconds = Math.floor(milliseconds / 1000)
		const hours = Math.floor(totalSeconds / 3600)
		const minutes = Math.floor((totalSeconds % 3600) / 60)
		const seconds = totalSeconds % 60

		return `${hours}h ${minutes}m ${seconds}s`
	}

	const [stepStatus, setStepStatus] = useState<TStepStatus>({
		"1": "NOTVISITED",
		"2": "NOTVISITED",
		"3": "NOTVISITED",
		"4": "NOTVISITED",
		"5": "NOTVISITED",
	})

	const handleRoutingStates = (
		status: string,
		updateState: (value: boolean) => void,
		stateToCheck: string[] = ["PENDING", "INPROGRESS"]
	) => {
		if (stateToCheck.some((state) => state === status)) {
			updateState(true)
		}
	}

	const getUpgradeInfo = async () => {
		let response: any = []
		await axiosJSON
			.get(`/upgrades/${clusterId}/info`)
			.then((res) => {
				response = res.data
				if (response?.elastic?.snapshot?.snapshot) {
					startTimer(moment.utc(response?.elastic?.snapshot?.snapshot.createdAt).local().valueOf())
				}
				const { elastic, kibana, precheck } = response ?? {}
				const step1Status = elastic?.snapshot?.snapshot ? "COMPLETED" : "PENDING"

				const step2Status =
					step1Status !== "COMPLETED"
						? "NOTVISITED"
						: precheck?.status === "COMPLETED"
						? "COMPLETED"
						: "PENDING"

				// Helper function to sum deprecations safely
				const sumDeprecations = (type: string) =>
					(elastic?.deprecationCounts?.[type] ?? 1) + (kibana?.deprecationCounts?.[type] ?? 1)

				// Step 2 calculations
				const criticalDeprecations = sumDeprecations("critical")
				const warningDeprecations = sumDeprecations("warning")

				const step3Status =
					step2Status !== "COMPLETED"
						? "NOTVISITED"
						: criticalDeprecations > 0
						? "PENDING"
						: warningDeprecations > 0
						? "INPROGRESS"
						: "COMPLETED"

				// Helper for subsequent steps
				const getNextStepStatus = (prevStatus: string, isUpgradable: boolean) =>
					prevStatus === "PENDING" || prevStatus === "NOTVISITED"
						? "NOTVISITED"
						: isUpgradable
						? "PENDING"
						: "COMPLETED"

				const step4Status = getNextStepStatus(step3Status, elastic?.isUpgradable)
				const step5Status = getNextStepStatus(step4Status, kibana?.isUpgradable)
				// const step5Status = "NOTVISITED"

				setStepStatus({
					"1": step1Status,
					"2": step2Status,
					"3": step3Status,
					"4": step4Status,
					"5": step5Status,
				})

				// if(step1Status === "COMPLETED"){
				// 	Toast({varient: "SUCCESS", msg:"done"})
				// }

				if (step2Status !== "NOTVISITED") {
					setPrecheckAllowed(true)
				}
				handleRoutingStates(step3Status, setDeprecationChangesAllowed)
				handleRoutingStates(step4Status, setElasticNodeUpgradeAllowed)
				handleRoutingStates(step5Status, setKibanaNodeUpgradeAllowed)
				setDeploymentId(response?.deploymentId ?? "")
			})
			.catch((err) => toast.error(err?.response?.data.err ?? StringManager.GENERIC_ERROR))
		return response
	}

	const { data, isLoading, refetch, isRefetching } = useQuery({
		queryKey: ["cluster-info"],
		queryFn: getUpgradeInfo,
		staleTime: Infinity,
	})

	const step1Data = getStepIndicatorData("01", stepStatus["1"])
	const step2Data = getStepIndicatorData("02", stepStatus["2"])
	const step3Data = getStepIndicatorData("03", stepStatus["3"])
	const step4Data = getStepIndicatorData("04", stepStatus["4"])
	const step5Data = getStepIndicatorData("05", stepStatus["5"])

	if (isLoading || isRefetching) {
		return (
			<Box className="flex flex-col gap-4 w-full px-6 overflow-scroll h-[calc(var(--window-height)-220px)]">
				<Skeleton className="w-full rounded-[20px]">
					<Box height="88px" />
				</Skeleton>
				<Skeleton className="w-full rounded-[20px]">
					<Box height="108px" />
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
		)
	}

	return (
		<ol className="relative flex flex-col gap-4 w-full overflow-auto h-[calc(var(--window-height)-220px)] px-6">
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
						data?.elastic?.snapshot?.snapshot ? (
							<Box className="flex flex-col gap-[6px] items-end">
								{/* <Tooltip
									content={"You have to take snapshot again after the time ends."}
									closeDelay={0}
									color="foreground"
									size="sm"
									radius="sm"
									placement="left"
								>
									<InfoCircle size="14px" color="#6E6E6E" />
								</Tooltip> */}
								<Typography
									fontSize="14px"
									fontWeight="400"
									lineHeight="18px"
									color="#F3D07C"
									minWidth="90px"
									textAlign="right"
								>
									{formatTime(remainingTime)}
								</Typography>
								<Typography
									color="#6E6E6E"
									textAlign="right"
									fontSize="13px"
									fontWeight="400"
									lineHeight="20px"
									letterSpacing="0.26px"
								>
									Take a new snapshot once time's up.
								</Typography>
							</Box>
						) : (
							<OutlinedBorderButton
								icon={Camera}
								filledIcon={Camera}
								disabled={step1Data?.isDisabled}
								component={Link}
								to={data?.elastic?.snapshot?.creationPage}
								target="_blank"
							>
								Create snapshot
							</OutlinedBorderButton>
						)
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
				<Box className="flex flex-row gap-3 items-center rounded-[20px] justify-between w-full">
					<Box className="flex flex-col gap-[6px]">
						<Typography color="#FFF" fontSize="16px" fontWeight="600" lineHeight="normal">
							Prechecks
						</Typography>
						<Typography
							color="#6E6E6E"
							fontSize="13px"
							fontWeight="400"
							lineHeight="20px"
							letterSpacing="0.26px"
						>
							Prechecks verify your cluster's readiness for upgrade by running essential health and
							configuration checks. Your Cluster needs to pass all the Prechecks to be eligible for
							upgrade.
						</Typography>
					</Box>
				</Box>
				<Box className="flex items-start">
					<OutlinedBorderButton
						component={Link}
						to="/prechecks"
						disabled={stepStatus["2"] === "NOTVISITED"}
						borderRadius="50%"
						sx={{ minWidth: "38px !important", minHeight: "38px !important", padding: "0px" }}
					>
						<FiArrowUpRight size="20px" color="#FFF" />
					</OutlinedBorderButton>
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
							criticalValue={data?.elastic?.deprecationCounts.critical ?? "NaN"}
							warningValue={data?.elastic?.deprecationCounts.warning ?? "NaN"}
							isDisabled={step3Data?.isDisabled}
							to="/elastic/deprecation-logs"
						/>
						<DeprectedSettings
							title="Kibana"
							criticalValue={data?.kibana?.deprecationCounts.critical ?? "NaN"}
							warningValue={data?.kibana?.deprecationCounts.warning ?? "NaN"}
							isDisabled={step3Data?.isDisabled}
							to="/kibana/deprecation-logs"
						/>
					</Box>
				</Box>
			</StepBox>
			<StepBox
				currentStepStatus={stepStatus["4"]}
				nextStepStatus={stepStatus["5"]}
				boxBackground={step4Data?.boxBackground}
				background={step4Data?.background}
				boxShadow={step4Data?.boxShadow}
				internalBackground={step4Data?.internalBackground}
				textColor={step4Data?.textColor}
				stepValue={step4Data?.stepValue}
				lastNode={infraType === "ELASTIC_CLOUD" ? true : false}
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
					{infraType == "ELASTIC_CLOUD" ? (
						<Box className="flex items-start">
							<a
								target="_blank"
								href={`https://cloud.elastic.co/deployments/${deploymentId}?show_upgrade=true`}
							>
								<OutlinedBorderButton
									disabled={stepStatus["2"] === "NOTVISITED"}
									borderRadius="50%"
									sx={{ minWidth: "38px !important", minHeight: "38px !important", padding: "0px" }}
								>
									<FiArrowUpRight size="20px" color="#FFF" />
								</OutlinedBorderButton>
							</a>
						</Box>
					) : (
						<OutlinedBorderButton
							component={Link}
							to="/elastic/upgrade"
							disabled={step4Data?.isDisabled}
							icon={Flash}
							filledIcon={Flash}
						>
							Upgrade
						</OutlinedBorderButton>
					)}
				</Box>
			</StepBox>
			{infraType != "ELASTIC_CLOUD" && (
				<StepBox
					lastNode={true}
					boxBackground={step5Data?.boxBackground}
					background={step5Data?.background}
					boxShadow={step5Data?.boxShadow}
					internalBackground={step5Data?.internalBackground}
					textColor={step5Data?.textColor}
					stepValue={step5Data?.stepValue}
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
								Once you've resolved all critical issues and verified that your applications are ready,
								you can upgrade to Elastic 8.x. Be sure to back up your data again before upgrading.
							</Typography>
						</Box>
						<OutlinedBorderButton
							component={Link}
							to="/kibana/upgrade"
							disabled={step5Data?.isDisabled}
							icon={Flash}
							filledIcon={Flash}
						>
							Upgrade
						</OutlinedBorderButton>
					</Box>
				</StepBox>
			)}
			{stepStatus["5"] === "COMPLETED" ? (
				<Box className="sticky bottom-0 z-50">
					<Box
						className="flex p-[0.4px] w-full rounded-[14px]"
						sx={{ background: "linear-gradient(175deg, #27A56A 0%, #C0DFCF 30%, #131514 100%)" }}
					>
						<Box className="flex items-center w-full bg-[#010101] flex-row gap-6 py-[14px] px-[26px] rounded-[14px]">
							<Box
								className="flex p-px rounded-lg"
								sx={{
									background:
										"linear-gradient(135deg, #27A56A 2.29%, #C0DFCF 44.53%, #131315 97.18%, #131315 97.18%)",
									boxShadow: "0px 0px 12px 1px rgba(70, 233, 146, 0.41)",
								}}
							>
								<Box className="flex items-center rounded-lg justify-center min-w-[30px] min-h-[30px] bg-[#101010]">
									<Flash size="20px" color="#FFF" variant="Bold" />
								</Box>
							</Box>
							<Typography color="#FFF" fontSize="16px" fontWeight="600" lineHeight="normal">
								Upgrade successful!
							</Typography>
						</Box>
					</Box>
				</Box>
			) : null}
		</ol>
	)
}

export default UpgradeAssistant
