import { Box, IconButton, InputAdornment, Typography } from "@mui/material"
import { useFormik, type FormikErrors } from "formik"
import { Add, ArrowLeft, ArrowRight, Eye, EyeSlash, Trash } from "iconsax-react"
import _ from "lodash"
import { useState } from "react"
import { ConatinedButton, OutlinedButton } from "~/components/utilities/Buttons"
import Input from "~/components/utilities/Input"
import { cn } from "~/lib/Utils"
import validationSchema from "./validation/validation"
import SelectionTile from "./widgets/SelectionTile"
import SshFileInput from "~/components/utilities/SshFileInput"

function Credentials({ initialValues: IV, backStep, onSubmit }: TCredentialsComp) {
	const [showPassword, setShowPassword] = useState<boolean>(false)

	const formik = useFormik({
		initialValues: _.cloneDeep(IV),
		validationSchema: validationSchema,
		onSubmit: async (values) => {
			onSubmit(values)
		},
	})

	return (
		<Box
			className="flex flex-col gap-3 justify-between overflow-auto"
			height={{
				xs: "calc(var(--window-height) - 368px)",
				sm: "calc(var(--window-height) - 346px)",
				md: "calc(var(--window-height) - 280px)",
			}}
		>
			<Box className="flex flex-col items-stretch gap-6 max-w-[552px] w-full">
				<Box className="flex flex-col gap-[6px] max-w-[515px]">
					<Typography color="#ABA9B1" fontSize="14px" fontWeight="400" lineHeight="20px">
						Cluster name
					</Typography>
					<Box className="flex flex-col gap-[6px]">
						<Input
							fullWidth
							id="name"
							name="name"
							type="text"
							placeholder="Enter cluster name"
							variant="outlined"
							value={formik.values.name}
							onChange={formik.handleChange}
							onBlur={formik.handleBlur}
							error={formik.touched.name && Boolean(formik.errors.name)}
							helperText={formik.touched.name && formik.errors.name}
						/>
					</Box>
				</Box>
				<Box className="flex flex-col gap-[6px] w-full max-w-[515px]">
					<Typography color="#ABA9B1" fontSize="14px" fontWeight="400" lineHeight="20px">
						URLs
					</Typography>
					<Box className="flex flex-col gap-2 w-full">
						<Input
							fullWidth
							id="elasticUrl"
							name="elasticUrl"
							type="text"
							placeholder="Enter Elastic URL"
							variant="outlined"
							value={formik.values.elasticUrl}
							onChange={formik.handleChange}
							onBlur={formik.handleBlur}
							error={formik.touched.elasticUrl && Boolean(formik.errors.elasticUrl)}
							helperText={formik.touched.elasticUrl && formik.errors.elasticUrl}
						/>
						<Input
							fullWidth
							id="kibanaUrl"
							name="kibanaUrl"
							type="text"
							placeholder="Enter Kibana URL"
							variant="outlined"
							value={formik.values.kibanaUrl}
							onChange={formik.handleChange}
							onBlur={formik.handleBlur}
							error={formik.touched.kibanaUrl && Boolean(formik.errors.kibanaUrl)}
							helperText={formik.touched.kibanaUrl && formik.errors.kibanaUrl}
						/>
					</Box>
				</Box>
				<Box className="flex flex-col gap-[6px] max-w-[515px]">
					<Typography color="#ABA9B1" fontSize="14px" fontWeight="400" lineHeight="20px">
						Authentication preference
					</Typography>
					<Box className="flex flex-col gap-[2px]">
						<Box
							className="flex flex-row gap-2 justify-between"
							onBlur={() => formik.setFieldTouched("authPref", true)}
						>
							<SelectionTile
								label="Username & password"
								isSelected={formik.values.authPref === "U/P"}
								value="U/P"
								onSelect={(value: string | number) => formik.setFieldValue("authPref", value)}
							/>
							<SelectionTile
								label="API Key"
								isSelected={formik.values.authPref === "API_KEY"}
								value="API_KEY"
								onSelect={(value: string | number) => formik.setFieldValue("authPref", value)}
							/>
						</Box>
						{formik.touched.authPref && Boolean(formik.errors.authPref) ? (
							<Typography fontSize="12px" fontWeight={400} lineHeight="20px" color="#ef4444">
								{formik.touched.authPref && formik.errors.authPref}
							</Typography>
						) : null}
					</Box>
				</Box>
				{formik.values.authPref && (
					<Box className="flex flex-col gap-[6px] max-w-[515px]">
						<Typography color="#ABA9B1" fontSize="14px" fontWeight="400" lineHeight="20px">
							Credentials
						</Typography>
						<Box className="flex flex-col gap-[6px]">
							{formik.values.authPref === "U/P" ? (
								<>
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
										error={formik.touched.username && Boolean(formik.errors.username)}
										helperText={formik.touched.username && formik.errors.username}
									/>
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
										error={formik.touched.password && Boolean(formik.errors.password)}
										helperText={formik.touched.password && formik.errors.password}
										InputProps={{
											endAdornment: (
												<InputAdornment position="end">
													<IconButton
														aria-label="toggle password visibility"
														onClick={() => setShowPassword(!showPassword)}
														onMouseDown={(event) => event.preventDefault()}
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
								</>
							) : (
								<Input
									fullWidth
									id="apiKey"
									name="apiKey"
									type={showPassword ? "text" : "password"}
									placeholder="Enter apiKey"
									variant="outlined"
									value={formik.values.apiKey}
									onChange={formik.handleChange}
									onBlur={formik.handleBlur}
									error={formik.touched.apiKey && Boolean(formik.errors.apiKey)}
									helperText={formik.touched.apiKey && formik.errors.apiKey}
									InputProps={{
										endAdornment: (
											<InputAdornment position="end">
												<IconButton
													aria-label="toggle api key visibility"
													onClick={() => setShowPassword(!showPassword)}
													onMouseDown={(event) => event.preventDefault()}
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
							)}
						</Box>
					</Box>
				)}
				{infraType == "ELASTIC_CLOUD" && (
					<Box className="flex flex-col gap-[6px] max-w-[515px]">
						<Typography color="#ABA9B1" fontSize="14px" fontWeight="400" lineHeight="20px">
							Deployment Id
						</Typography>
						<Box className="flex flex-col gap-[6px]">
							<Input
								fullWidth
								id="deploymentId"
								name="deploymentId"
								type="text"
								placeholder="Enter Depoyment Id"
								variant="outlined"
								value={formik.values.deploymentId}
								onChange={formik.handleChange}
								onBlur={formik.handleBlur}
								error={formik.touched.deploymentId && Boolean(formik.errors.deploymentId)}
								helperText={formik.touched.deploymentId && formik.errors.deploymentId}
							/>
						</Box>
					</Box>
				)}
				{infraType == "SELF_MANAGED" && (
					<>
						<Box className="flex flex-col gap-[6px]">
							<Box
								className={cn("flex flex-row justify-between max-w-[515px]", {
									"border border-dashed border-[#3D3B42] rounded-[10px] py-[11px] pl-[16px] pr-[12px]":
										formik.values?.kibanaConfigs?.length === 0,
								})}
							>
								<Typography color="#ABA9B1" fontSize="14px" fontWeight="400" lineHeight="20px">
									Kibana nodes
								</Typography>
								<Box>
									<OutlinedButton
										sx={{
											gap: "4px",
											fontSize: "12px",
											fontWeight: "500",
											lineHeight: "normal",
											border: "none",
											padding: "0px",
											minHeight: "0px",
											height: "fit-content",
											":hover": { color: "#4CDB9D !important" },
										}}
										onClick={() => {
											let option = formik.values.kibanaConfigs
											const newOptions = [...option, { name: "", ip: "" }]
											formik.setFieldValue("kibanaConfigs", _.cloneDeep(newOptions))
										}}
									>
										<Add size="16px" color="currentColor" />
										Add node
									</OutlinedButton>
								</Box>
							</Box>
							<Box className="flex flex-col gap-[6px] rounded-lg">
								{_.map(
									formik.values.kibanaConfigs,
									(node: { name: string; ip: string }, index: number) => {
										return (
											<Box className="flex flex-col gap-[2px]">
												<Box className="flex flex-row gap-2 items-center group">
													<Box className="flex flex-row gap-[6px] w-full max-w-[515px]">
														<Input
															fullWidth
															id={`kibanaConfigs.${index}`}
															name={`kibanaConfigs.${index}.name`}
															type="text"
															placeholder="Enter node name"
															varient="outlined"
															value={node.name}
															onBlur={formik.handleBlur}
															onChange={(e: any) => {
																let newOptions = [...formik.values.kibanaConfigs]
																// @ts-ignore
																newOptions[index].name = e.target.value
																formik.setFieldValue(
																	"kibanaConfigs",
																	_.cloneDeep(newOptions)
																)
															}}
															error={
																Boolean(
																	(
																		formik.errors.kibanaConfigs?.[
																			index
																		] as FormikErrors<TKibanaConfigs>
																	)?.name
																) && formik.touched.kibanaConfigs
															}
														/>
														<Input
															fullWidth
															id={`kibanaConfigs.${index}`}
															name={`kibanaConfigs.${index}.ip`}
															type="text"
															placeholder="Enter node ip"
															varient="outlined"
															value={node.ip}
															onBlur={formik.handleBlur}
															onChange={(e: any) => {
																let newOptions = [...formik.values.kibanaConfigs]
																newOptions[index].ip = e.target.value
																formik.setFieldValue(
																	"kibanaConfigs",
																	_.cloneDeep(newOptions)
																)
															}}
															error={
																Boolean(
																	(
																		formik.errors.kibanaConfigs?.[
																			index
																		] as FormikErrors<TKibanaConfigs>
																	)?.ip
																) && formik.touched.kibanaConfigs
															}
														/>
													</Box>
													<Box className="hidden delete-button group-hover:flex">
														<IconButton
															sx={{ borderRadius: "8px", padding: "4px" }}
															onClick={() => {
																let newOptions = [...formik.values.kibanaConfigs]
																newOptions = newOptions.filter(
																	(_, ind) => ind !== index
																)
																formik.setFieldValue(
																	"kibanaConfigs",
																	_.cloneDeep(newOptions)
																)
															}}
														>
															<Trash size="20px" color="#E56852" />
														</IconButton>
													</Box>
												</Box>
												{formik.touched.kibanaConfigs &&
												formik.errors.kibanaConfigs?.[index] ? (
													<Typography
														fontSize="12px"
														fontWeight="400"
														color="#EF4444"
														lineHeight="20px"
													>
														{(
															formik.errors.kibanaConfigs?.[
																index
															] as FormikErrors<TKibanaConfigs>
														)?.name ||
															(
																formik.errors.kibanaConfigs?.[
																	index
																] as FormikErrors<TKibanaConfigs>
															)?.ip}
													</Typography>
												) : null}
											</Box>
										)
									}
								)}
							</Box>
						</Box>
						<Box className="flex flex-col gap-[6px] max-w-[515px]">
							<Typography color="#ABA9B1" fontSize="14px" fontWeight="400" lineHeight="20px">
								SSH Username
							</Typography>
							<Input
								fullWidth
								id="sshUser"
								name="sshUser"
								type="text"
								placeholder="Enter SSH username"
								variant="outlined"
								value={formik.values.sshUser}
								onChange={formik.handleChange}
								onBlur={formik.handleBlur}
								error={formik.touched.sshUser && Boolean(formik.errors.sshUser)}
								helperText={formik.touched.sshUser && formik.errors.sshUser}
							/>
						</Box>
						<Box className="flex flex-col gap-[6px] max-w-[515px]">
							<SshFileInput
								onSshKeyChange={(key) => formik.setFieldValue("pathToSSH", key)}
								sshKey={formik.getFieldMeta("pathToSSH").value}
								error={formik.errors.pathToSSH}
							/>
						</Box>
					</>
				)}
			</Box>
			<Box className="flex justify-end gap-2">
				<OutlinedButton onClick={backStep}>
					<ArrowLeft size="20px" color="currentColor" /> Back
				</OutlinedButton>
				<ConatinedButton disabled={formik.isSubmitting} onClick={formik.handleSubmit}>
					Continue <ArrowRight size="20px" color="currentColor" />
				</ConatinedButton>
			</Box>
		</Box>
	)
}

export default Credentials
