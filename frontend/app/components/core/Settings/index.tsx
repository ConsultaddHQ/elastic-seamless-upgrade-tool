import { Box, Typography } from "@mui/material"
import { useFormik } from "formik"
import { ArrowLeft } from "iconsax-react"
import { useEffect, useState } from "react"
import { OutlinedBorderButton } from "~/components/utilities/Buttons"
import validationSchema from "./validation/validation"
import { useMutation, useQuery } from "@tanstack/react-query"
import { OneLineSkeleton } from "~/components/utilities/Skeletons"
import Input from "~/components/utilities/Input"
import axiosJSON from "~/apis/http"
import { toast } from "sonner"
import { FullScreenDrawer } from "~/components/utilities/FullScreenDrawer"
import AppBreadcrumb from "~/components/utilities/AppBreadcrumb"

const INITIAL_VALUE = {
	webhookURL: "",
}

function SettingBreadcrumb({ onBack }: { onBack: () => void }) {
	return (
		<AppBreadcrumb
			items={[
				{
					label: "Go back",
					icon: <ArrowLeft size="14px" color="currentColor" />,
					onClick: onBack,
				},
				{
					label: "Settings",
					color: "#BDA0FF",
				},
			]}
		/>
	)
}

function Settings({ isOpen, onOpenChange }: { isOpen: boolean; onOpenChange: () => void }) {
	const [initialValues, setInitialValues] = useState<TSettingValues>(INITIAL_VALUE)

	const formik = useFormik({
		initialValues: initialValues,
		enableReinitialize: true,
		validationSchema: validationSchema,
		onSubmit: async (values) => {
			HandleSubmit(values)
		},
	})

	useEffect(() => {
		if (isOpen) {
			refetch()
		}
	}, [isOpen])

	const getSettings = async () => {
		await axiosJSON.get("/settings").then((res) => {
			setInitialValues({
				webhookURL: res?.data?.notificationWebhookUrl,
			})
			formik.resetForm()
		})
		return null
	}

	const { isLoading, isRefetching, refetch } = useQuery({
		queryKey: ["get-settings"],
		queryFn: getSettings,
		staleTime: 0,
	})

	const { mutate: HandleSubmit, isPending } = useMutation({
		mutationKey: ["update-settings"],
		mutationFn: async (values: any) => {
			await axiosJSON
				.post("/settings", {
					notificationWebhookUrl: values.webhookURL,
				})
				.then(() => {
					toast.success("Settings updated successfully")
					setInitialValues(initialValues)
					formik.resetForm()
				})
		},
	})

	return (
		<FullScreenDrawer isOpen={isOpen} onOpenChange={onOpenChange}>
			<Box minHeight="58px" />
			<form onSubmit={formik.handleSubmit} onReset={formik.handleReset} className="flex flex-col gap-2 w-full">
				<Box className="flex items-center gap-3 justify-between">
					<SettingBreadcrumb onBack={onOpenChange} />
					<OutlinedBorderButton type="submit" disabled={!formik.dirty || formik.isSubmitting || isPending}>
						{formik.isSubmitting || isPending ? "Updating" : "Update"}
					</OutlinedBorderButton>
				</Box>
				<Box
					className="flex p-px rounded-2xl h-[calc(var(--window-height)-120px)]"
					sx={{ background: "radial-gradient(#6E687C, #1D1D1D)" }}
				>
					<Box className="flex flex-col gap-6 pt-6 rounded-2xl bg-[#0D0D0D] w-full h-full items-start">
						<Box
							className="flex flex-col h-full w-full gap-3 overflow-auto items-center"
							padding="0px 32px 24px 32px"
						>
							<Box className="flex flex-col max-w-[552px] w-full">
								<Box className="flex flex-col items-stretch gap-6 max-w-[552px] w-full">
									<Box className="flex flex-col gap-[6px] max-w-[515px]">
										<Typography color="#ABA9B1" fontSize="14px" fontWeight="400" lineHeight="20px">
											Webhook URL
										</Typography>
										<OneLineSkeleton
											show={isLoading || isRefetching}
											component={
												<Input
													fullWidth
													id="webhookURL"
													name="webhookURL"
													type="text"
													placeholder="Enter Webhook URL"
													variant="outlined"
													value={formik.values.webhookURL}
													onChange={formik.handleChange}
													onBlur={formik.handleBlur}
													error={
														formik.touched.webhookURL && Boolean(formik.errors.webhookURL)
													}
													helperText={formik.touched.webhookURL && formik.errors.webhookURL}
												/>
											}
											height="52px"
											className="w-full rounded-[10px]"
										/>
										<Typography
											color="#6E6E6E"
											fontSize="14px"
											fontWeight="400"
											lineHeight="normal"
										>
											Please enter the webhook URL where you'd like to receive notifications about
											the node status.
										</Typography>
									</Box>
								</Box>
							</Box>
						</Box>
					</Box>
				</Box>
			</form>
		</FullScreenDrawer>
	)
}

export default Settings
