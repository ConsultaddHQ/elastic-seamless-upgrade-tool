import { Box, IconButton, InputAdornment, Typography } from "@mui/material"
import { useMutation, useQuery } from "@tanstack/react-query"
import { useFormik, type FormikErrors } from "formik"
import { Add, ArrowLeft, DocumentText1, DocumentUpload, Eye, EyeSlash, Trash } from "iconsax-react"
import _ from "lodash"
import { useEffect, useState } from "react"
import { toast } from "sonner"
import { OutlinedBorderButton, OutlinedButton } from "~/components/utilities/Buttons"
import Input from "~/components/utilities/Input"
import { cn } from "~/lib/Utils"
import SelectionTile from "../Setup/Credentials/widgets/SelectionTile"
// @ts-ignore-block
import Files from "react-files"
import { useLocation } from "react-router"
import axiosJSON from "~/apis/http"
import { OneLineSkeleton } from "~/components/utilities/Skeletons"
import StringManager from "~/constants/StringManager"
import { useLocalStore } from "~/store/common"
import useRefreshStore from "~/store/refresh"
import useSafeRouteStore from "~/store/safeRoutes"
import validationSchema from "./validation/validation"
import { FullScreenDrawer } from "~/components/utilities/FullScreenDrawer"
import AppBreadcrumb from "~/components/utilities/AppBreadcrumb"
import SshFileInput from "~/components/utilities/SshFileInput"

const INITIAL_VALUES = {
	type: "",
	name: "",
	deploymentId: "",
	elasticUrl: "",
	kibanaUrl: "",
	authPref: null,
	username: "",
	password: "",
	apiKey: "",
	pathToSSH: "",
	sshUser: "",
	kibanaConfigs: [],
	certFiles: [],
}

function EditClusterBreadcrumb({ onBack }: { onBack: () => void }) {
	return (
		<AppBreadcrumb
			items={[
				{
					label: "Go back",
					icon: <ArrowLeft size="14px" color="currentColor" />,
					onClick: onBack,
				},
				{
					label: "Edit cluster",
					color: "#BDA0FF",
				},
			]}
		/>
	)
}

function EditCluster({ isOpen, onOpenChange }: { isOpen: boolean; onOpenChange: () => void }) {
	const refresh = useRefreshStore((state) => state.refresh)
	const resetForEditCluster = useSafeRouteStore((state) => state.resetForEditCluster)
	const clusterId = useLocalStore((state) => state.clusterId)
	const infraType = useLocalStore((state) => state.infraType)
	const { pathname } = useLocation()
	const [initialValues, setInitialValues] = useState<TClusterValues>(INITIAL_VALUES)
	const [showPassword, setShowPassword] = useState<boolean>(false)

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
			formik.resetForm()
			refetch()
		}
	}, [isOpen])

	const handleChange = (fn: React.Dispatch<React.SetStateAction<(File | TExistingFile)[]>>, files: File[]) => {
		fn([...formik.values.certFiles, ...files])
	}

	const handleError = (error: any, file: File) => {
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

	const getCluster = async () => {
		if (!clusterId) return null
		const response = await axiosJSON.get(`/clusters/${clusterId}`)
		const cluster = response.data
		cluster &&
			setInitialValues({
				name: cluster.name,
				type: cluster.type,
				elasticUrl: cluster.elasticUrl,
				kibanaUrl: cluster.kibanaUrl,
				authPref: cluster.username ? "U/P" : "API_KEY",
				username: cluster.username,
				password: cluster.password,
				apiKey: cluster.apiKey,
				sshUser: cluster.sshUsername,
				pathToSSH: cluster.sshKey,
				kibanaConfigs: cluster.kibanaNodes,
				deploymentId: cluster.deploymentId,
				certFiles:
					cluster.certificateIds?.map((certId: string) => ({
						name: certId,
						storedOnServer: true,
					})) || [],
			})

		formik.resetForm()
		return null
	}

	const { isLoading, isRefetching, refetch } = useQuery({
		queryKey: ["get-cluster-info"],
		queryFn: getCluster,
		staleTime: 0,
	})

	const { mutate: HandleSubmit, isPending } = useMutation({
		mutationKey: ["add-cluster"],
		mutationFn: async (values: any) => {
			let certIds: Array<string> = []
			const formData = new FormData()
			values.certFiles?.forEach((file: File | TExistingFile) => {
				if (file instanceof File) {
					formData.append("files", file, file.name)
				}
			})
			if (values.certFiles?.filter((cert: File | TExistingFile) => cert instanceof File).length !== 0) {
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
				.put("clusters/" + clusterId, {
					type: values.type,
					name: values.name,
					deploymentId: values.deploymentId,
					elasticUrl: values.elasticUrl,
					username: values.username,
					password: values.password,
					kibanaUrl: values.kibanaUrl,
					certificateIds: [
						...values.certFiles
							?.filter((cert: File | TExistingFile) => !(cert instanceof File))
							.map((cert: TExistingFile) => cert.name),
						...certIds,
					],
					sshUsername: values.sshUser,
					apiKey: values.apiKey,
					sshKey: values.pathToSSH ?? "",
					kibanaNodes: values.kibanaConfigs,
				})
				.then((res) => {
					refetch()
					resetForEditCluster()
					if (pathname === "/cluster-overview") {
						refresh()
					}
					toast.success("Cluster updated successfully")
					onOpenChange()
				})
		},
	})

	return (
		<FullScreenDrawer isOpen={isOpen} onOpenChange={onOpenChange}>
			<Box minHeight="58px" />
			<form onSubmit={formik.handleSubmit} onReset={formik.handleReset} className="flex flex-col gap-2 w-full">
				<Box className="flex items-center gap-3 justify-between">
					<EditClusterBreadcrumb onBack={onOpenChange} />
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
											Cluster name
										</Typography>
										<Box className="flex flex-col gap-[6px]" key={formik.values.authPref}>
											<OneLineSkeleton
												show={isLoading || isRefetching}
												height="52px"
												className="w-full rounded-[10px]"
												component={
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
												}
											/>
										</Box>
									</Box>
									<Box className="flex flex-col gap-[6px] w-full max-w-[515px]">
										<Typography color="#ABA9B1" fontSize="14px" fontWeight="400" lineHeight="20px">
											URLs
										</Typography>
										<Box className="flex flex-col gap-2 w-full">
											<OneLineSkeleton
												show={isLoading || isRefetching}
												component={
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
														error={
															formik.touched.elasticUrl &&
															Boolean(formik.errors.elasticUrl)
														}
														helperText={
															formik.touched.elasticUrl && formik.errors.elasticUrl
														}
													/>
												}
												height="52px"
												className="w-full rounded-[10px]"
											/>
											<OneLineSkeleton
												show={isLoading || isRefetching}
												component={
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
														error={
															formik.touched.kibanaUrl && Boolean(formik.errors.kibanaUrl)
														}
														helperText={formik.touched.kibanaUrl && formik.errors.kibanaUrl}
													/>
												}
												height="52px"
												className="w-full rounded-[10px]"
											/>
										</Box>
									</Box>
									<Box className="flex flex-col gap-[6px] max-w-[515px]">
										<Typography color="#ABA9B1" fontSize="14px" fontWeight="400" lineHeight="20px">
											Authentication preference
										</Typography>
										<OneLineSkeleton
											show={isLoading || isRefetching}
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
											<Typography
												color="#ABA9B1"
												fontSize="14px"
												fontWeight="400"
												lineHeight="20px"
											>
												Credentials
											</Typography>
											<Box className="flex flex-col gap-[6px]" key={formik.values.authPref}>
												{formik.values.authPref === "U/P" ? (
													<>
														<OneLineSkeleton
															show={isLoading || isRefetching}
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
																		formik.touched.username &&
																		formik.errors.username
																	}
																/>
															}
														/>
														<OneLineSkeleton
															show={isLoading || isRefetching}
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
																		formik.touched.password &&
																		formik.errors.password
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
														show={isLoading || isRefetching}
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
																	formik.touched.apiKey &&
																	Boolean(formik.errors.apiKey)
																}
																helperText={
																	formik.touched.apiKey && formik.errors.apiKey
																}
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
												)}
											</Box>
										</Box>
									)}
									{infraType == "SELF_MANAGED" && (
										<>
											<Box className="flex flex-col gap-[6px]">
												<Box
													className={cn("flex flex-row justify-between max-w-[515px]", {
														"border border-dashed border-[#3D3B42] rounded-[10px] py-[11px] pl-[16px] pr-[12px]":
															formik.values.kibanaConfigs?.length === 0,
													})}
												>
													<Typography
														color="#ABA9B1"
														fontSize="14px"
														fontWeight="400"
														lineHeight="20px"
													>
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
																formik.setFieldValue(
																	"kibanaConfigs",
																	_.cloneDeep(newOptions)
																)
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
																					let newOptions = [
																						...formik.values.kibanaConfigs,
																					]
																					newOptions[index].name =
																						e.target.value
																					formik.setFieldValue(
																						"kibanaConfigs",
																						_.cloneDeep(newOptions)
																					)
																				}}
																				error={
																					Boolean(
																						(
																							formik.errors
																								.kibanaConfigs?.[
																								index
																							] as
																								| FormikErrors<TKibanaConfigs>
																								| undefined
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
																					let newOptions = [
																						...formik.values.kibanaConfigs,
																					]
																					newOptions[index].ip =
																						e.target.value
																					formik.setFieldValue(
																						"kibanaConfigs",
																						_.cloneDeep(newOptions)
																					)
																				}}
																				error={
																					Boolean(
																						(
																							formik.errors
																								.kibanaConfigs?.[
																								index
																							] as
																								| FormikErrors<TKibanaConfigs>
																								| undefined
																						)?.ip
																					) && formik.touched.kibanaConfigs
																				}
																			/>
																		</Box>
																		<Box className="hidden delete-button group-hover:flex">
																			<IconButton
																				sx={{
																					borderRadius: "8px",
																					padding: "4px",
																				}}
																				onClick={() => {
																					let newOptions = [
																						...formik.values.kibanaConfigs,
																					]
																					newOptions = newOptions.filter(
																						(option, ind) => ind !== index
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
																				formik.errors.kibanaConfigs?.[index] as
																					| FormikErrors<TKibanaConfigs>
																					| undefined
																			)?.name ??
																				(
																					formik.errors.kibanaConfigs?.[
																						index
																					] as
																						| FormikErrors<TKibanaConfigs>
																						| undefined
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
												<Typography
													color="#ABA9B1"
													fontSize="14px"
													fontWeight="400"
													lineHeight="20px"
												>
													SSH Username
												</Typography>
												<OneLineSkeleton
													show={isLoading || isRefetching}
													height="52px"
													className="w-full rounded-[10px]"
													component={
														<Input
															fullWidth
															id="sshUser"
															name="sshUser"
															type="text"
															placeholder="Enter ssh username"
															variant="outlined"
															value={formik.values.sshUser}
															onChange={formik.handleChange}
															onBlur={formik.handleBlur}
															error={
																formik.touched.sshUser && Boolean(formik.errors.sshUser)
															}
															helperText={formik.touched.sshUser && formik.errors.sshUser}
														/>
													}
												/>
											</Box>
											<Box className="flex flex-col gap-[6px] max-w-[515px]">
												<SshFileInput
													onSshKeyChange={(key) => {
														formik.setFieldValue("pathToSSH", key)
													}}
													sshKey={formik.getFieldMeta("pathToSSH").value}
													error={formik.errors.pathToSSH}
												/>
											</Box>
										</>
									)}
									<Box className="flex flex-col gap-[6px] max-w-[515px]">
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
							</Box>
						</Box>
					</Box>
				</Box>
			</form>
		</FullScreenDrawer>
	)
}

export default EditCluster
