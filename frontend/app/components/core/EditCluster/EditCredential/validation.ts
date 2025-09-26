import * as Yup from "yup"

export const credentialSchema = Yup.object().shape({
	authPref: Yup.string().required("Please select at least one preference."),
	username: Yup.string().when("authPref", {
		is: "U/P",
		then: (schema) => schema.required("Please enter username."),
		otherwise: (schema) => schema.notRequired(),
	}),

	password: Yup.string().when("authPref", {
		is: "U/P",
		then: (schema) => schema.required("Please enter password."),
		otherwise: (schema) => schema.notRequired(),
	}),

	apiKey: Yup.string().when("authPref", {
		is: "API_KEY",
		then: (schema) => schema.required("Please enter api key."),
		otherwise: (schema) => schema.notRequired(),
	}),
})
