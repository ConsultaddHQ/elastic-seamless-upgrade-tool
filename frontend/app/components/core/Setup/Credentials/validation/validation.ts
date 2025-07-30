import * as Yup from "yup"
import { URL_PATTERN } from "~/constants/RegexManager"

const validationSchema = Yup.object().shape({
	name: Yup.string()
		.required("Please enter cluster name."),
	
	type: Yup.string()
		.required("Please select deployment type.")
		.oneOf(["SELF_MANAGED","ELASTIC_CLOUD"], "Invalid type selected."),

	elasticUrl: Yup.string()
		.required("Please enter elastic url.")
		.matches(URL_PATTERN, "Please enter a valid elastic url."),

	kibanaUrl: Yup.string()
		.required("Please enter kibana url.")
		.matches(URL_PATTERN, "Please enter a valid kibana url."),

	authPref: Yup.string().required("Please select at least one preference."),

	username: Yup.string().when("authPref", {
		is: "U/P",
		then: (schema) => schema.required("Please enter username."),
	}),

	password: Yup.string().when("authPref", {
		is: "U/P",
		then: (schema) => schema.required("Please enter password."),
	}),

	apiKey: Yup.string().when("authPref", {
		is: "API_KEY",
		then: (schema) => schema.required("Please enter api key."),
	}),

	sshUser: Yup.string().when("type", {
		is: "SELF_MANAGED",
		then: (schema) => schema.required("Please enter SSH username."),
		otherwise: (schema) => schema.notRequired(),
	}),

	pathToSSH: Yup.string().when("type", {
		is: "SELF_MANAGED",
		then: (schema) => schema.required("Please enter SSH key."),
		otherwise: (schema) => schema.notRequired(),
	}),

	kibanaConfigs: Yup.array().when("type", {
		is: "SELF_MANAGED",
		then: (schema) =>
			schema
				.of(
					Yup.object({
						name: Yup.string().required("Cluster name is required."),
						ip: Yup.string().required("Cluster IP is required."),
					})
				)
				.min(1, "At least one Kibana config is required."),
		otherwise: (schema) => schema.notRequired(),
	}),
	deploymentId: Yup.string().when("type", {
		is: "ELASTIC_CLOUD",
		then: (schema) => schema.required("Please enter deployment ID."),
		otherwise: (schema) => schema.notRequired(),
	}),
})


export default validationSchema
