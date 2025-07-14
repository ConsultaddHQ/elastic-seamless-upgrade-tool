import { type ClassValue, clsx } from "clsx"
import { Clock } from "iconsax-react"
import { FiCheck } from "react-icons/fi"
import { twMerge } from "tailwind-merge"

export function cn(...inputs: ClassValue[]) {
	return twMerge(clsx(inputs))
}

export function mergeDicts(dict1: any, dict2: any) {
	const result = { ...dict1 } // Start with a shallow copy of dict1

	for (const key in dict2) {
		if (
			dict1.hasOwnProperty(key) && // Key exists in both dictionaries
			typeof dict1[key] === "object" && // Value in dict1 is an object
			typeof dict2[key] === "object" && // Value in dict2 is also an object
			dict1[key] !== null &&
			dict2[key] !== null // Neither value is null
		) {
			// Recursively merge if both values are objects
			result[key] = mergeDicts(dict1[key], dict2[key])
		} else {
			// Overwrite value with dict2's value
			result[key] = dict2[key]
		}
	}

	return result
}

export const getGradientClass = (
	selfStepStatus: "COMPLETED" | "PENDING" | "INPROGRESS" | "NOTVISITED",
	afterStepStatus: "COMPLETED" | "PENDING" | "INPROGRESS" | "NOTVISITED"
): string => {
	if (afterStepStatus === "NOTVISITED" || selfStepStatus === "PENDING") {
		return "no-gradient"
	}

	const gradients: Record<string, string> = {
		"COMPLETED-COMPLETED": "green-gradient",
		"COMPLETED-INPROGRESS": "green-yellow-gradient",
		"COMPLETED-PENDING": "green-purple-gradient",
		"INPROGRESS-COMPLETED": "yellow-green-gradient",
		"INPROGRESS-INPROGRESS": "yellow-gradient",
		"INPROGRESS-PENDING": "yellow-purple-gradient",
	}

	return gradients[`${selfStepStatus}-${afterStepStatus}`] || "no-gradient"
}

export const getStepIndicatorData = (
	stepValue: string,
	selfStepStatus: "COMPLETED" | "PENDING" | "INPROGRESS" | "NOTVISITED"
): {
	boxBackground: string
	background: string
	textColor: string
	stepValue: string | React.ReactElement
	internalBackground: string
	boxShadow: string
	isDisabled: boolean
} => {
	switch (selfStepStatus) {
		case "PENDING":
			return {
				boxBackground: "radial-gradient(#927CC5, #1D1D1D)",
				background: "linear-gradient(135deg, #6627FF 2.29%, #C9C0DF 44.53%, #131315 97.18%, #131315 97.18%)",
				textColor: "#FFF",
				internalBackground: "#101010",
				stepValue: stepValue,
				boxShadow: "0px 0px 12px 1px rgba(118, 70, 233, 0.60)",
				isDisabled: false,
			}
		case "COMPLETED":
			return {
				boxBackground: "#0F0F0F",
				background: "#52D97F",
				textColor: "#145529",
				stepValue: <FiCheck size="22px" color="currentColor" />,
				internalBackground: "#52D97F",
				boxShadow: "none",
				isDisabled: true,
			}
		case "INPROGRESS":
			return {
				boxBackground: "#0F0F0F",
				background: "#EDC038",
				textColor: "#6D550B",
				stepValue: <Clock size="22px" color="currentColor" />,
				internalBackground: "#EDC038",
				boxShadow: "none",
				isDisabled: false,
			}
		case "NOTVISITED":
			return {
				boxBackground: "#0F0F0F",
				background: "linear-gradient(137deg, #1D1D1D 6.95%, #6E687C 36.4%, #1D1D1D 92.32%)",
				textColor: "#7C7C7C",
				internalBackground: "#101010",
				stepValue: stepValue,
				boxShadow: "none",
				isDisabled: true,
			}
	}
}

export const localStorageConfig = {
	getItem: (name: string) => {
		const item = localStorage.getItem(name)
		return item ? JSON.parse(item) : null
	},
	setItem: (name: string, value: any) => {
		localStorage.setItem(name, JSON.stringify(value))
	},
	removeItem: (name: string) => {
		localStorage.removeItem(name)
	},
}

export const sessionStorageConfig = {
	getItem: (name: string) => {
		const item = sessionStorage.getItem(name)
		return item ? JSON.parse(item) : null
	},
	setItem: (name: string, value: any) => {
		sessionStorage.setItem(name, JSON.stringify(value))
	},
	removeItem: (name: string) => {
		sessionStorage.removeItem(name)
	},
}
