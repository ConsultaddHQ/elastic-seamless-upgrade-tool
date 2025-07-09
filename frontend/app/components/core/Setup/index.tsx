import { Box, CssBaseline, Typography } from "@mui/material"
import { useMutation } from "@tanstack/react-query"
import { useEffect, useMemo, useState } from "react"
import { useNavigate } from "react-router"
import { toast } from "sonner"
import axiosJSON from "~/apis/http"
import Stepper from "~/components/utilities/Stepper"
import Certificates from "./Certificates"
import Credentials from "./Credentials"
import Infrastructure from "./Infrastructure"
import StringManager from "~/constants/StringManager"
import { useLocalStore, useSessionStore } from "~/store/common"
import useSafeRouteStore from "~/store/safeRoutes"

function Setup() {
	const navigate = useNavigate()

	const setClusterAdded = useSafeRouteStore((state: any) => state.setClusterAdded)

	const infraType = useLocalStore((state: any) => state.infraType)
	const setInfraType = useLocalStore((state: any) => state.setInfraType)
	const setClusterId = useLocalStore((state: any) => state.setClusterId)
	const step = useSessionStore((state: any) => state.setupStep)
	const setStep = useSessionStore((state: any) => state.setSetupStep)
	// const [infraType, setClusterId, setInfraType] = useLocalStore((state: any) => {
	// 	return [state.infraType, state.setClusterId, state.setInfraType]
	// })
	// const { step, setStep } = useSessionStore((state: any) => ({ step: state.setupStep, setStep: state.setSetupStep }))

	const [creds, setCreds] = useState<TCreds>({
		elasticUrl: "",
		kibanaUrl: "",
		authPref: null,
		username: "",
		password: "",
		apiKey: "",
		sshUser: "",
		pathToSSH: "",
		kibanaConfigs: [],
	})

	const handleNextStep = () => setStep(step + 1)

	const handleBackStep = () => setStep(step - 1)

	const handleStepInfraSubmit = (value: string | number | null) => {
		if (value) {
			setInfraType(value)
			handleNextStep()
		}
	}

	const handleCredSubmit = (values: TCreds) => {
		setCreds(values)
		handleNextStep()
	}

	const { mutate: HandleSubmit, isPending } = useMutation({
		mutationKey: ["add-cluster"],
		mutationFn: async (values: TCerti) => {
			let certIds: Array<string> = []
			const formData = new FormData()
			values.certFiles?.forEach((file) => {
				formData.append("files", file, file.name)
			})
			if (values.certFiles?.length !== 0) {
				await axiosJSON
					.post("/api/elastic/clusters/certificates/upload", formData, {
						maxBodyLength: Infinity,
						headers: {
							"Content-Type": "multipart/form-data",
						},
					})
					.then((res) => (certIds = res?.data?.certificateIds))
					.catch((err) => toast.error(err?.response?.data.err ?? StringManager.GENERIC_ERROR))
			}
			await axiosJSON
				.post("/api/elastic/clusters", {
					elastic: { url: creds.elasticUrl, username: creds.username, password: creds.password },
					kibana: { url: creds.kibanaUrl, username: creds.username, password: creds.password },
					certificateIds: certIds,
					infrastructureType: infraType,
					sshUser: creds.sshUser,
					key: creds.pathToSSH ?? "",
					kibanaConfigs: creds.kibanaConfigs,
				})
				.then((res) => {
					setClusterAdded(true)
					setStep(1)
					setClusterId(res?.data?.clusterId)
					navigate("/cluster-overview")
				})
				.catch((err) => toast.error(err?.response?.data.err ?? StringManager.GENERIC_ERROR))
		},
	})

	const getStepForm = useMemo(() => {
		switch (step) {
			case 1:
				return <Infrastructure onSubmit={handleStepInfraSubmit} />
			case 2:
				return <Credentials backStep={handleBackStep} onSubmit={handleCredSubmit} initialValues={creds} />
			case 3:
				return <Certificates backStep={handleBackStep} onSubmit={HandleSubmit} isSubmitting={isPending} />
			default:
				return <Typography color="#FFF">No more steps found</Typography>
		}
	}, [step])

	return (
		<Box className="flex flex-col gap-10 w-full">
			<CssBaseline />
			<Box className="flex flex-col gap-2 max-w-[515px] w-full">
				<Typography fontSize="14px" fontWeight={400} lineHeight="20px" color="#7C768B">
					Step {step}/3
				</Typography>
				<Stepper steps={3} color="#CCFE76" currentStep={step} />
			</Box>
			{getStepForm}
		</Box>
	)
}

export default Setup
