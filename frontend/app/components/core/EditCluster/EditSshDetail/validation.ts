import * as Yup from "yup"

export const shhEditSchema = Yup.object().shape({
	type: Yup.string()
		.required("Please select deployment type.")
		.oneOf(["SELF_MANAGED", "ELASTIC_CLOUD"], "Invalid type selected."),

	sshUser: Yup.string().when("type", {
		is: "SELF_MANAGED",
		then: (schema) => schema.required("Please enter SSH username."),
		otherwise: (schema) => schema.notRequired(),
	}),

	pathToSSH: Yup.string().when("type", {
		is: "SELF_MANAGED",
		then: (schema) => schema.required("Please upload SSH private file."),
		otherwise: (schema) => schema.notRequired(),
	}),
})
