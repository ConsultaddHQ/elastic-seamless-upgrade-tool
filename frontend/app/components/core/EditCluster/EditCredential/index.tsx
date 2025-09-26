import { Box, IconButton, InputAdornment, Typography } from "@mui/material"
import { Eye, EyeSlash } from "iconsax-react"
import { toast } from "sonner"
import Input from "~/components/utilities/Input"
import SelectionTile from "../../Setup/Credentials/widgets/SelectionTile"
import axiosJSON from "~/apis/http"
import { useLocalStore } from "~/store/common"
import { OutlinedBorderButton } from "~/components/utilities/Buttons"
import { useMutation } from "@tanstack/react-query"
import { useFormik } from "formik"
import { DocumentText1, DocumentUpload, Trash } from "iconsax-react"
import _ from "lodash"
import { useState } from "react"
// @ts-ignore-block
import Files from "react-files"
import StringManager from "~/constants/StringManager"
import { credentialSchema } from "./validation"

const INITIAL_VALUES = {
	authPref: null,
	username: "",
	password: "",
	apiKey: "",
	certFiles: [],
}

export function EditClusterCredential() {
	const clusterId = useLocalStore((state) => state.clusterId)
	const [isEditCredential, setEditCredential] = useState(false)
	const [initialValues, setInitialValues] = useState<TClusterCredentialValues>(INITIAL_VALUES)
	const [showPassword, setShowPassword] = useState<boolean>(false)

	const formik = useFormik({
		initialValues: initialValues,
		enableReinitialize: true,
		validationSchema: credentialSchema,
		onSubmit: async (values) => {
			HandleSubmit(values)
		},
	})

	const { mutate: HandleSubmit } = useMutation({
		mutationKey: ["update-cluster-credential", clusterId, formik.values],
		mutationFn: async (values: TClusterCredentialValues) => {
			await axiosJSON
				.put(`clusters/${clusterId}/credentials`, {
					username: values.username,
					password: values.password,
					apiKey: values.apiKey,
				})
				.then(() => {
					setEditCredential(false)
					formik.resetForm()
					toast.success("Credential updated successfully")
				})
		},
	})

	const handleChange = (fn: React.Dispatch<React.SetStateAction<(File | TExistingFile)[]>>, files: File[]) => {
		fn([...formik.values.certFiles, ...files])
	}

	const handleError = (error: any) => {
		toast.error(error.message ?? StringManager.GENERIC_ERROR)
	}

	const handleDelete = (
		fn: React.Dispatch<React.SetStateAction<(File | TExistingFile)[]>>,
		file: File | TExistingFile,
		index: number
	) => {
		fn([
			...formik.values.certFiles.slice(0, index),
			...formik.values.certFiles.slice(index + 1, formik.values.certFiles.length),
		])
	}

	return (
		<form onSubmit={formik.handleSubmit} onReset={formik.handleReset}>
			<Box className="flex flex-col gap-6 w-full">
				<Box className="flex flex-col">
					<Typography color="#ABA9B1" fontSize="14px" fontWeight="400" lineHeight="20px">
						Authentication preference
					</Typography>
					<Box className="flex flex-col gap-[2px] w-full">
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
					<Box className="flex flex-col">
						<Typography color="#ABA9B1" fontSize="14px" fontWeight="400" lineHeight="20px">
							Credentials
						</Typography>
						<Box className="flex flex-col gap-[6px]" key={formik.values.authPref}>
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
									type="text"
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
				<Box className="flex flex-col gap-[6px]">
					<Typography fontSize="14px" fontWeight={400} lineHeight="20px" color="#ABA9B1">
						Certificates (Optional)
					</Typography>
					<Files
						className="files-dropzone"
						onChange={(files: File[]) =>
							handleChange((data) => formik.setFieldValue("certFiles", data), files)
						}
						onError={handleError}
						accepts={[".crt"]}
						multiple
						maxFileSize={10000000}
						minFileSize={0}
						clickable
					>
						<Box
							className="flex flex-col gap-2 items-center w-full justify-center h-[104px] rounded-xl cursor-pointer border border-dashed border-[#3D3B42] bg-neutral-950 hover:border-[#C8BDE4]"
							sx={{
								":hover": {
									boxShadow: "0px 0px 13px 2px rgba(127, 79, 240, 0.26)",
									transition: "all 0.5s",
									"& > #drag-drop-icon": {
										color: "#FFF !important",
										transition: "color 0.5s",
									},
									"& #drag-drop-label": {
										color: "#FFF !important",
										transition: "color 0.5s",
									},
								},
							}}
						>
							<span id="drag-drop-icon" style={{ color: "#ABA9B1" }}>
								<DocumentUpload size="24px" color="currentColor" />
							</span>
							<Box className="flex flex-col">
								<Typography
									id="drag-drop-label"
									color="#6C6B6D"
									textAlign="center"
									fontSize="14px"
									fontWeight="400"
									lineHeight="20px"
								>
									Drag or click to upload file
								</Typography>
								<Typography
									color="#6C6B6D"
									textAlign="center"
									fontSize="14px"
									fontWeight="400"
									lineHeight="20px"
								>
									Supported formats: .crt
								</Typography>
							</Box>
						</Box>
					</Files>
					<Box
						className="flex flex-col gap-[6px] mb-2 mt-2 overflow-auto"
						height="auto"
						sx={{
							"::-webkit-scrollbar": {
								width: "5px",
							},
							"::-webkit-scrollbar-thumb": {
								background: "#C8BDE4",
								borderRadius: "10px",
							},
						}}
					>
						{formik.values.certFiles.map((file, index) => {
							return (
								<Box
									key={index}
									className="flex flex-row w-full gap-3 justify-between items-center border border-solid border-[#1F1F1F] rounded-[9px] h-[42px]"
									padding="12px 6px 14px 14px"
								>
									<Box className="flex flex-row gap-[10px] items-center">
										<DocumentText1 color="#6B6B6B" size="16px" />
										<Typography
											color="#ADADAD"
											fontSize="12px"
											fontWeight="500"
											lineHeight="normal"
										>
											{file.name}
										</Typography>
									</Box>
									<IconButton
										onClick={() => {}}
										sx={{ padding: "8px", borderRadius: "6px" }}
										onClickCapture={() =>
											handleDelete(
												(data) => {
													formik.setFieldValue("certFiles", data)
												},
												file,
												index
											)
										}
									>
										<Trash color="#EC7070" size="14px" />
									</IconButton>
								</Box>
							)
						})}
					</Box>
				</Box>
			</Box>
			<Box className="flex flex-row items-center justify-end gap-[6px]">
				<OutlinedBorderButton type="submit" disabled={!formik.dirty || formik.isSubmitting}>
					{formik.isSubmitting ? "Updating" : "Update"}
				</OutlinedBorderButton>
			</Box>
		</form>
	)
}
