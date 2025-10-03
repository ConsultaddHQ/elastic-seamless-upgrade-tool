import { Box, CssBaseline, Typography } from "@mui/material"
import { useMutation } from "@tanstack/react-query"
import { useMemo, useState } from "react"
import { useNavigate } from "react-router"
import axiosJSON from "~/apis/http"
import Stepper from "~/components/utilities/Stepper"
import Certificates from "./Certificates"
import Credentials from "./Credentials"
import Infrastructure from "./Infrastructure"
import { useSessionStore } from "~/store/common"

function Setup() {
	const navigate = useNavigate()

	const step = useSessionStore((state) => state.setupStep)
	const setStep = useSessionStore((state) => state.setSetupStep)

	const [creds, setCreds] = useState<TCreds>({
		type: "",
		name: "",
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

	const handleBackStep = () => {
		if (step === 1) {
			navigate("/")
		} else {
			setStep(step - 1)
		}
	}

	const handleStepInfraSubmit = (value: string | null) => {
		if (value) {
			setCreds({ ...creds, type: value })
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
					.post("/clusters/certificates/upload", formData, {
						maxBodyLength: Infinity,
						headers: {
							"Content-Type": "multipart/form-data",
						},
					})
					.then((res) => (certIds = res?.data?.certificateIds))
			}
			await axiosJSON
				.post("/clusters", {
					name: creds.name,
					elasticUrl: creds.elasticUrl,
					kibanaUrl: creds.kibanaUrl,
					username: creds.username,
					password: creds.password,
					certificateIds: certIds,
					type: creds.type,
					sshUsername: creds.sshUser,
					sshKey: creds.pathToSSH ?? "",
					apiKey: creds.apiKey,
					kibanaNodes: creds.kibanaConfigs,
					deploymentId: creds.deploymentId,
				})
				.then(() => {
					setStep(1)
					navigate("/")
				})
		},
	})

	const getStepForm = useMemo(() => {
		switch (step) {
			case 1:
				return <Infrastructure backStep={handleBackStep} onSubmit={handleStepInfraSubmit} />
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
