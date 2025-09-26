import * as Yup from "yup"
import { URL_PATTERN } from "~/constants/RegexManager"

export const editClusterDetailSchema = Yup.object().shape({
	name: Yup.string().required("Please enter cluster name."),
	type: Yup.string()
		.required("Please select deployment type.")
		.oneOf(["SELF_MANAGED", "ELASTIC_CLOUD"], "Invalid type selected."),

	elasticUrl: Yup.string()
		.required("Please enter elastic url.")
		.matches(URL_PATTERN, "Please enter a valid elastic url."),

	kibanaUrl: Yup.string()
		.required("Please enter kibana url.")
		.matches(URL_PATTERN, "Please enter a valid kibana url."),

	kibanaConfigs: Yup.array().when("type", {
		is: "SELF_MANAGED",
		then: (schema) =>
			schema
				.of(
					Yup.object({
						name: Yup.string().required("Node name is required."),
						ip: Yup.string().required("Node IP is required."),
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
