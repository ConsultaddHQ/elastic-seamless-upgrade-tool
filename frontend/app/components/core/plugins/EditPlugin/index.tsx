import { Box, IconButton, Typography } from "@mui/material"
import { useMutation, useQuery } from "@tanstack/react-query"
import { useFormik, type FormikErrors } from "formik"
import { Add, ArrowLeft, Trash } from "iconsax-react"
import { useEffect, useState } from "react"
import { toast } from "sonner"
import { OutlinedBorderButton, OutlinedButton } from "~/components/utilities/Buttons"
import Input from "~/components/utilities/Input"
import axiosJSON from "~/apis/http"
import { OneLineSkeleton } from "~/components/utilities/Skeletons"
import validationSchema from "./validation/validation"
import { FullScreenDrawer } from "~/components/utilities/FullScreenDrawer"
import AppBreadcrumb from "~/components/utilities/AppBreadcrumb"
import SelectionTile from "~/components/core/Setup/Credentials/widgets/SelectionTile"
import { cn } from "~/lib/Utils"
import _ from "lodash"

const INITIAL_VALUES: TPluginEdit = {
	name: "",
	official: false,
	sourcePattern: null,
	versionSources: [],
}

function EditClusterBreadcrumb({ onBack, isAdd }: { onBack: () => void; isAdd: boolean }) {
	return (
		<AppBreadcrumb
			items={[
				{
					label: "Go back",
					icon: <ArrowLeft size="14px" color="currentColor" />,
					onClick: onBack,
				},
				{
					label: isAdd ? "Add plugin" : "Edit plugin",
					color: "#BDA0FF",
				},
			]}
		/>
	)
}

function EditPlugin({
	isOpen,
	onOpenChange,
	pluginName,
}: {
	isOpen: boolean
	onOpenChange: () => void
	pluginName?: string | null
}) {
	const [initialValues, setInitialValues] = useState<TPluginEdit>(INITIAL_VALUES)

	const formik = useFormik({
		initialValues: initialValues,
		enableReinitialize: true,
		validationSchema: validationSchema,
		onSubmit: async (values) => {
			HandleSubmit(values)
		},
	})

	const { mutate: HandleSubmit, isPending } = useMutation({
		mutationKey: ["save-plugin"],
		mutationFn: async (values: any) => {
			const payload = {
				name: values.name,
				official: values.official,
				sourcePattern: values.sourcePattern,
				versionSources: values.versionSources.reduce(
					(acc: Record<string, string>, { version, source }: TPluginVersionSource) => {
						acc[version] = source
						return acc
					},
					{}
				),
			}
			await axiosJSON.post("/plugin-artifacts", payload)
			toast.success("Plugin saved successfully")
		},
	})

	useEffect(() => {
		if (isOpen) {
			formik.resetForm()
			refetch()
		}
	}, [isOpen])

	const getPlugin = async () => {
		if (!pluginName) return null
		const response = await axiosJSON.get<TPlugin>(`/plugin-artifacts/${pluginName}`)
		const { name, official, sourcePattern, versionSources } = response.data
		setInitialValues({
			name: name,
			official: official,
			sourcePattern: sourcePattern,
			versionSources:
				versionSources == null
					? []
					: Object.keys(versionSources).map((key) => ({ version: key, source: versionSources[key] })),
		})
		formik.resetForm()
	}

	const { isLoading, isRefetching, refetch } = useQuery({
		queryKey: ["get-plugin-info"],
		queryFn: getPlugin,
		staleTime: 0,
	})

	return (
		<FullScreenDrawer isOpen={isOpen} onOpenChange={onOpenChange}>
			<Box minHeight="58px" />
			<form onSubmit={formik.handleSubmit} onReset={formik.handleReset} className="flex flex-col gap-2 w-full">
				<Box className="flex items-center gap-3 justify-between">
					<EditClusterBreadcrumb onBack={onOpenChange} isAdd={!pluginName} />
					<OutlinedBorderButton type="submit" disabled={!formik.dirty || formik.isSubmitting || isPending}>
						Save plugin
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
											Plugin name
										</Typography>
										<Box className="flex flex-col gap-[6px]">
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
														placeholder="Enter plugin name"
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
									<Box className="flex flex-col gap-[6px] max-w-[515px]">
										<Typography color="#ABA9B1" fontSize="14px" fontWeight="400" lineHeight="20px">
											Plugin type
										</Typography>
										<OneLineSkeleton
											show={isLoading || isRefetching}
											component={
												<Box className="flex flex-col gap-[2px] w-full">
													<Box className="flex flex-row gap-2 justify-between">
														<SelectionTile
															label="Official"
															isSelected={formik.values.official}
															value="official"
															onSelect={(value: string | number) =>
																formik.setFieldValue("official", true)
															}
														/>
														<SelectionTile
															label="3rd party"
															isSelected={!formik.values.official}
															value="3rd party"
															onSelect={(value: string | number) =>
																formik.setFieldValue("official", false)
															}
														/>
													</Box>
													{formik.touched.official && Boolean(formik.errors.official) ? (
														<Typography
															fontSize="12px"
															fontWeight={400}
															lineHeight="20px"
															color="#ef4444"
														>
															{formik.touched.official && formik.errors.official}
														</Typography>
													) : null}
												</Box>
											}
											height="52px"
											className="w-full rounded-[10px]"
										/>
									</Box>

									{!formik.values.official && (
										<>
											<Box className="flex flex-col gap-[6px] w-full max-w-[515px]">
												<Typography
													color="#ABA9B1"
													fontSize="14px"
													fontWeight="400"
													lineHeight="20px"
												>
													Source pattern
												</Typography>
												<Box className="flex flex-col gap-2 w-full">
													<OneLineSkeleton
														show={isLoading || isRefetching}
														component={
															<Input
																fullWidth
																id="sourcePattern"
																name="sourcePattern"
																type="text"
																placeholder="Enter Source URL"
																variant="outlined"
																value={formik.values.sourcePattern}
																onChange={formik.handleChange}
																onBlur={formik.handleBlur}
																error={
																	formik.touched.sourcePattern &&
																	Boolean(formik.errors.sourcePattern)
																}
																helperText={
																	formik.touched.sourcePattern &&
																	formik.errors.sourcePattern
																}
															/>
														}
														height="52px"
														className="w-full rounded-[10px]"
													/>
												</Box>
											</Box>
											<Box className="flex flex-col gap-[6px]">
												<Box
													className={cn("flex flex-row justify-between max-w-[515px]", {
														"border border-dashed border-[#3D3B42] rounded-[10px] py-[11px] pl-[16px] pr-[12px]":
															formik.values.versionSources,
													})}
												>
													<Typography
														color="#ABA9B1"
														fontSize="14px"
														fontWeight="400"
														lineHeight="20px"
													>
														Version sources
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
																let option = formik.values.versionSources
																const newOptions = [
																	...option,
																	{ version: "", source: "" },
																]
																formik.setFieldValue(
																	"versionSources",
																	_.cloneDeep(newOptions)
																)
															}}
														>
															<Add size="16px" color="currentColor" />
															Add source
														</OutlinedButton>
													</Box>
												</Box>
												<Box className="flex flex-col gap-[6px] rounded-lg">
													{_.map(
														formik.values.versionSources,
														(node: TPluginVersionSource, index: number) => {
															return (
																<Box className="flex flex-col gap-[2px]">
																	<Box className="flex flex-row gap-2 items-center group">
																		<Box className="flex flex-row gap-[6px] w-full max-w-[515px]">
																			<Input
																				fullWidth
																				id={`versionSources.${index}`}
																				name={`versionSources.${index}.version`}
																				type="text"
																				placeholder="Enter version"
																				varient="outlined"
																				value={node.version}
																				onBlur={formik.handleBlur}
																				onChange={(e: any) => {
																					let newOptions = [
																						...formik.values.versionSources,
																					]
																					// @ts-ignore
																					newOptions[index].version =
																						e.target.value
																					formik.setFieldValue(
																						"versionSources",
																						_.cloneDeep(newOptions)
																					)
																				}}
																				error={
																					Boolean(
																						(
																							formik.errors
																								.versionSources?.[
																								index
																							] as
																								| FormikErrors<TPluginVersionSource>
																								| undefined
																						)?.version
																					) && formik.touched.versionSources
																				}
																			/>
																			<Input
																				fullWidth
																				id={`versionSources.${index}`}
																				name={`versionSources.${index}.source`}
																				type="text"
																				placeholder="Enter source"
																				varient="outlined"
																				value={node.source}
																				onBlur={formik.handleBlur}
																				onChange={(e: any) => {
																					let newOptions = [
																						...formik.values.versionSources,
																					]
																					// @ts-ignore
																					newOptions[index].source =
																						e.target.value
																					formik.setFieldValue(
																						"versionSources",
																						_.cloneDeep(newOptions)
																					)
																				}}
																				error={
																					Boolean(
																						(
																							formik.errors
																								.versionSources?.[
																								index
																							] as
																								| FormikErrors<TPluginVersionSource>
																								| undefined
																						)?.source
																					) && formik.touched.versionSources
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
																						...formik.values.versionSources,
																					]
																					newOptions = newOptions.filter(
																						(option, ind) => ind !== index
																					)
																					formik.setFieldValue(
																						"versionSources",
																						_.cloneDeep(newOptions)
																					)
																				}}
																			>
																				<Trash size="20px" color="#E56852" />
																			</IconButton>
																		</Box>
																	</Box>
																	{formik.touched.versionSources &&
																	formik.errors.versionSources?.[index] ? (
																		<Typography
																			fontSize="12px"
																			fontWeight="400"
																			color="#EF4444"
																			lineHeight="20px"
																		>
																			{(
																				formik.errors.versionSources?.[
																					index
																				] as
																					| FormikErrors<TPluginVersionSource>
																					| undefined
																			)?.version ||
																				(
																					formik.errors.versionSources?.[
																						index
																					] as
																						| FormikErrors<TPluginVersionSource>
																						| undefined
																				)?.source}
																		</Typography>
																	) : null}
																</Box>
															)
														}
													)}
												</Box>
											</Box>
										</>
									)}
								</Box>
							</Box>
						</Box>
					</Box>
				</Box>
			</form>
		</FullScreenDrawer>
	)
}

export default EditPlugin
