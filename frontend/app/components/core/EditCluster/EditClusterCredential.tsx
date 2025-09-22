import { Box, IconButton, InputAdornment, Typography } from "@mui/material"
import { useMutation } from "@tanstack/react-query"
import { useFormik } from "formik"
import { Eye, EyeSlash } from "iconsax-react"
import _ from "lodash"
import { useState } from "react"
import { toast } from "sonner"
import Input from "~/components/utilities/Input"
import SelectionTile from "../Setup/Credentials/widgets/SelectionTile"
import axiosJSON from "~/apis/http"
import { OneLineSkeleton } from "~/components/utilities/Skeletons"
import { useLocalStore } from "~/store/common"
import validationSchema from "./validation/validation"
const INITIAL_VALUES = {
	authPref: null,
	username: "",
	password: "",
	apiKey: "",
}

export function EditClusterCredential() {
	const clusterId = useLocalStore((state) => state.clusterId)
	const [isEditCredential, setEditCredential] = useState(false)
	const [initialValues, setInitialValues] = useState<TClusterCredentialValues>(INITIAL_VALUES)
	const [showPassword, setShowPassword] = useState<boolean>(false)

	const formik = useFormik({
		initialValues: initialValues,
		enableReinitialize: true,
		validationSchema: validationSchema,
		onSubmit: async (values) => {
			HandleSubmit(values)
		},
	})

	const { mutate: HandleSubmit } = useMutation({
		mutationKey: ["update-cluster-credential", clusterId, formik.values],
		mutationFn: async (values: TClusterCredentialValues) => {
			await axiosJSON
				.put("clusters/" + clusterId, {
					username: values.username,
					password: values.password,
					apiKey: values.apiKey,
				})
				.then(() => {
					toast.success("Credential updated successfully")
				})
		},
	})

	return (
		<form onSubmit={formik.handleSubmit} onReset={formik.handleReset} className="flex flex-col gap-2 w-full">
			<Box
				className="flex p-px rounded-2xl"
				sx={{ background: "radial-gradient(#6E687C, #1D1D1D)" }}
			>
				<Box className="flex flex-col gap-6 pt-6 rounded-2xl bg-[#0D0D0D] w-full items-start">
					<Box
						className="flex flex-col w-full gap-3 overflow-auto items-center"
						padding="0px 32px 24px 32px"
					>
						<Box className="flex flex-col max-w-[552px] w-full">
							<Box className="flex flex-col items-stretch gap-6 max-w-[552px] w-full">
								<Box className="flex flex-col gap-[6px] max-w-[515px]">
									<Typography color="#ABA9B1" fontSize="14px" fontWeight="400" lineHeight="20px">
										Authentication preference
									</Typography>
									<OneLineSkeleton
										show={isEditCredential}
										component={
											<Box className="flex flex-col gap-[2px] w-full">
												<Box
													className="flex flex-row gap-2 justify-between"
													onBlur={() => formik.setFieldTouched("authPref", true)}
												>
													<SelectionTile
														label="Username & password"
														isSelected={formik.values.authPref === "U/P"}
														value="U/P"
														onSelect={(value: string | number) =>
															formik.setFieldValue("authPref", value)
														}
													/>
													<SelectionTile
														label="API Key"
														isSelected={formik.values.authPref === "API_KEY"}
														value="API_KEY"
														onSelect={(value: string | number) =>
															formik.setFieldValue("authPref", value)
														}
													/>
												</Box>
												{formik.touched.authPref && Boolean(formik.errors.authPref) ? (
													<Typography
														fontSize="12px"
														fontWeight={400}
														lineHeight="20px"
														color="#ef4444"
													>
														{formik.touched.authPref && formik.errors.authPref}
													</Typography>
												) : null}
											</Box>
										}
										height="52px"
										className="w-full rounded-[10px]"
									/>
								</Box>
								{formik.values.authPref && (
									<Box className="flex flex-col gap-[6px] max-w-[515px]">
										<Typography color="#ABA9B1" fontSize="14px" fontWeight="400" lineHeight="20px">
											Credentials
										</Typography>
										<Box className="flex flex-col gap-[6px]" key={formik.values.authPref}>
											{formik.values.authPref === "U/P" ? (
												<>
													<OneLineSkeleton
														show={isEditCredential}
														height="52px"
														className="w-full rounded-[10px]"
														component={
															<Input
																fullWidth
																id="username"
																name="username"
																type="text"
																placeholder="Enter username"
																variant="outlined"
																value={formik.values.username}
																onChange={formik.handleChange}
																onBlur={formik.handleBlur}
																error={
																	formik.touched.username &&
																	Boolean(formik.errors.username)
																}
																helperText={
																	formik.touched.username && formik.errors.username
																}
															/>
														}
													/>
													<OneLineSkeleton
														show={isEditCredential}
														height="52px"
														className="w-full rounded-[10px]"
														component={
															<Input
																fullWidth
																id="password"
																name="password"
																type={showPassword ? "text" : "password"}
																placeholder="Enter password"
																variant="outlined"
																value={formik.values.password}
																onChange={formik.handleChange}
																onBlur={formik.handleBlur}
																error={
																	formik.touched.password &&
																	Boolean(formik.errors.password)
																}
																helperText={
																	formik.touched.password && formik.errors.password
																}
																InputProps={{
																	endAdornment: (
																		<InputAdornment position="end">
																			<IconButton
																				aria-label="toggle password visibility"
																				onClick={() =>
																					setShowPassword(!showPassword)
																				}
																				onMouseDown={(event) =>
																					event.preventDefault()
																				}
																				edge="end"
																			>
																				{showPassword ? (
																					<Eye size="18px" color="#FFF" />
																				) : (
																					<EyeSlash
																						size="18px"
																						color="#FFF"
																					/>
																				)}
																			</IconButton>
																		</InputAdornment>
																	),
																}}
															/>
														}
													/>
												</>
											) : (
												<OneLineSkeleton
													show={isEditCredential}
													height="52px"
													className="w-full rounded-[10px]"
													component={
														<Input
															fullWidth
															id="apiKey"
															name="apiKey"
															type="text"
															placeholder="Enter apiKey"
															variant="outlined"
															value={formik.values.apiKey}
															onChange={formik.handleChange}
															onBlur={formik.handleBlur}
															error={
																formik.touched.apiKey && Boolean(formik.errors.apiKey)
															}
															helperText={formik.touched.apiKey && formik.errors.apiKey}
															InputProps={{
																endAdornment: (
																	<InputAdornment position="end">
																		<IconButton
																			aria-label="toggle api key visibility"
																			onClick={() =>
																				setShowPassword(!showPassword)
																			}
																			onMouseDown={(event) =>
																				event.preventDefault()
																			}
																			edge="end"
																		>
																			{showPassword ? (
																				<Eye size="18px" color="#FFF" />
																			) : (
																				<EyeSlash size="18px" color="#FFF" />
																			)}
																		</IconButton>
																	</InputAdornment>
																),
															}}
														/>
													}
												/>
											)}
										</Box>
									</Box>
								)}
							</Box>
						</Box>
					</Box>
				</Box>
			</Box>
		</form>
	)
}
