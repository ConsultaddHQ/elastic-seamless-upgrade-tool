import * as Yup from "yup"

const validationSchema = Yup.object().shape({
	name: Yup.string().required("Please enter plugin name."),

	official: Yup.boolean().required("Plugin type is required."),

	sourcePattern: Yup.string().nullable(),

	versionSources: Yup.array()
		.of(
			Yup.object().shape({
				version: Yup.string().required("Version is required."),
				source: Yup.string().required("Source is required."),
			})
		)
		.required(),
})
export default validationSchema
