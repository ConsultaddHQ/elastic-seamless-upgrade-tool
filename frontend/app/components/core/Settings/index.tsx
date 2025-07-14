import { Drawer, DrawerBody, DrawerContent } from "@heroui/react"
import { Box, Breadcrumbs, Typography } from "@mui/material"
import { useFormik } from "formik"
import { ArrowLeft, ArrowRight2 } from "iconsax-react"
import { useEffect, useState } from "react"
import { OutlinedBorderButton } from "~/components/utilities/Buttons"
import validationSchema from "./validation/validation"
import { useMutation, useQuery } from "@tanstack/react-query"
import { OneLineSkeleton } from "~/components/utilities/Skeletons"
import Input from "~/components/utilities/Input"
import axiosJSON from "~/apis/http"
import { toast } from "sonner"
import StringManager from "~/constants/StringManager"

const STYLES = {
	GO_BACK_BUTTON: {
		minHeight: "30px",
		height: "30px",
		gap: "6px",
		padding: "6px 10px 8px 10px",
		color: "#ADADAD",
		fontSize: "12px",
		fontWeight: "500",
		lineHeight: "normal",
		borderColor: "#2F2F2F",
		borderRadius: "8px",
		background: "#141415",
	},
}

const INITIAL_VALUE = {
	webhookURL: "",
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
		await axiosJSON
			.get("/api/settings")
			.then((res) => {
				setInitialValues({
					webhookURL: res?.data?.notificationWebhookUrl,
				})
				formik.resetForm()
			})
			.catch((err) => {
				console.log(err)
				toast.error(err?.response?.data.err ?? StringManager.GENERIC_ERROR)
			})
		return null
	}

	const { isLoading, isRefetching, refetch } = useQuery({
		queryKey: ["get-settings"],
		queryFn: getSettings,
		staleTime: Infinity,
	})

	const { mutate: HandleSubmit, isPending } = useMutation({
		mutationKey: ["update-settings"],
		mutationFn: async (values: any) => {
			await axiosJSON
				.post("/api/settings", {
					notificationWebhookUrl: values.webhookURL,
				})
				.then((res) => {
					toast.success("Settings updated successfully")
					setInitialValues(initialValues)
					formik.resetForm()
				})
				.catch((err) => toast.error(err?.response?.data.err ?? StringManager.GENERIC_ERROR))
		},
	})

	return (
		<Drawer
			isOpen={isOpen}
			size="full"
			onOpenChange={onOpenChange}
			placement="top"
			classNames={{ base: "bg-[#0A0A0A]" }}
			motionProps={{
				variants: {
					enter: {
						opacity: 1,
						y: 0,
						// @ts-ignore
						duration: 0.3,
					},
					exit: {
						y: 100,
						opacity: 0,
						// @ts-ignore
						duration: 0.3,
					},
				},
			}}
		>
			<DrawerContent>
				{(onClose) => (
					<DrawerBody>
						<Box minHeight="58px" />
						<form
							onSubmit={formik.handleSubmit}
							onReset={formik.handleReset}
							className="flex flex-col gap-2 w-full"
						>
							<Box className="flex items-center gap-3 justify-between">
								<Box className="flex border border-solid border-[#2F2F2F] w-max py-[6px] px-[10px] rounded-lg bg-[#141415]">
									<Breadcrumbs separator={<ArrowRight2 color="#ADADAD" size="14px" />}>
										<Typography
											className="flex items-center gap-[6px] cursor-pointer"
											color="#ADADAD"
											fontSize="12px"
											fontWeight="500"
											lineHeight="normal"
											onClick={onOpenChange}
										>
											<ArrowLeft size="14px" color="currentColor" /> Go back
										</Typography>
										<Typography
											color="#BDA0FF"
											fontSize="12px"
											fontWeight="500"
											lineHeight="normal"
										>
											Settings
										</Typography>
									</Breadcrumbs>
								</Box>
								<OutlinedBorderButton
									type="submit"
									disabled={!formik.dirty || formik.isSubmitting || isPending}
								>
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
													<Typography
														color="#ABA9B1"
														fontSize="14px"
														fontWeight="400"
														lineHeight="20px"
													>
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
																	formik.touched.webhookURL &&
																	Boolean(formik.errors.webhookURL)
																}
																helperText={
																	formik.touched.webhookURL &&
																	formik.errors.webhookURL
																}
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
														Please enter the webhook URL where you'd like to receive
														notifications about the node status.
													</Typography>
												</Box>
											</Box>
										</Box>
									</Box>
								</Box>
							</Box>
						</form>
					</DrawerBody>
				)}
			</DrawerContent>
		</Drawer>
	)
}

export default Settings
