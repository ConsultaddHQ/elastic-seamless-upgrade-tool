import { Box, Typography } from "@mui/material"
import { useMutation } from "@tanstack/react-query"
import { useFormik } from "formik"
import _ from "lodash"
import { useState } from "react"
import { toast } from "sonner"
import Input from "~/components/utilities/Input"
// @ts-ignore-block
import Files from "react-files"
import { useLocation } from "react-router"
import axiosJSON from "~/apis/http"
import { useLocalStore } from "~/store/common"
import useRefreshStore from "~/store/refresh"
import useSafeRouteStore from "~/store/safeRoutes"
import SshFileInput from "~/components/utilities/SshFileInput"
import { shhEditSchema } from "./validation"
import { OutlinedBorderButton } from "~/components/utilities/Buttons"

const INITIAL_VALUES = {
	type: "SELF_MANAGED",
	pathToSSH: "",
	sshUser: "",
}

function EditSshDetail() {
	const refresh = useRefreshStore((state) => state.refresh)
	const resetForEditCluster = useSafeRouteStore((state) => state.resetForEditCluster)
	const clusterId = useLocalStore((state) => state.clusterId)
	const { pathname } = useLocation()

	const formik = useFormik({
		initialValues: INITIAL_VALUES,
		enableReinitialize: true,
		validationSchema: shhEditSchema,
		onSubmit: async (values) => {
			HandleSubmit(values)
		},
	})

	const { mutate: HandleSubmit, isPending } = useMutation({
		mutationKey: ["edit-cluster-ssh-detail"],
		mutationFn: async (values: any) => {
			await axiosJSON
				.put(`clusters/${clusterId}/ssh`, {
					sshUsername: values.sshUser,
					sshKey: values.pathToSSH ?? "",
				})
				.then(() => {
					resetForEditCluster()
					formik.resetForm()
					if (pathname === "/cluster-overview") {
						refresh()
					}
					toast.success("Cluster updated successfully")
				})
		},
	})

	return (
		<form onSubmit={formik.handleSubmit} onReset={formik.handleReset}>
			<Box className="flex flex-col w-full gap-3 overflow-auto items-center">
				<Box className="flex flex-col items-stretch  gap-6 w-full">
					<Box className="flex flex-col gap-[6px] w-full">
						<Typography color="#ABA9B1" fontSize="14px" fontWeight="400" lineHeight="20px">
							SSH Username
						</Typography>
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
							error={formik.touched.sshUser && Boolean(formik.errors.sshUser)}
							helperText={formik.touched.sshUser && formik.errors.sshUser}
						/>
					</Box>
					<Box className="flex flex-col gap-[6px] w-full">
						<SshFileInput
							onSshKeyChange={(key) => {
								formik.setFieldValue("pathToSSH", key)
							}}
							sshKey={formik.getFieldMeta("pathToSSH").value}
							error={formik.errors.pathToSSH}
						/>
					</Box>
					<Box className="flex flex-row items-center justify-end gap-[6px]">
						<OutlinedBorderButton
							type="submit"
							disabled={!formik.dirty || formik.isSubmitting || isPending}
						>
							{formik.isSubmitting ? "Updating" : "Update"}
						</OutlinedBorderButton>
					</Box>
				</Box>
			</Box>
		</form>
	)
}

export default EditSshDetail
