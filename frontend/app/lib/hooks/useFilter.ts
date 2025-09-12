import { useCallback, useEffect, useState } from "react"
import { useLocation, useNavigate } from "react-router"

export type FilterValue = string | boolean | string[]
export type Filters = Record<string, FilterValue>
type UpdateFilter<T> = <K extends keyof T>(key: K, value: T[K]) => void

function useFilters<T extends Filters>(initialFilters: T): [T, UpdateFilter<T>] {
	const location = useLocation()
	const navigate = useNavigate()

	const getFiltersFromUrl = useCallback((): Partial<T> => {
		const params = new URLSearchParams(location.search)
		const out: Partial<T> = {}

		for (const [rawKey, rawValue] of params.entries()) {
			const key = rawKey as keyof T
			let parsed: FilterValue

			if (rawValue === "true" || rawValue === "false") {
				parsed = rawValue === "true"
			} else if (rawValue.startsWith("[") && rawValue.endsWith("]")) {
				try {
					const parsedArr = JSON.parse(rawValue)
					parsed = Array.isArray(parsedArr) ? parsedArr.map(String) : []
				} catch {
					parsed = []
				}
			} else {
				parsed = rawValue
			}

			out[key] = parsed as T[keyof T]
		}

		return out
	}, [location.search])

	const [filters, setFilters] = useState<T>(() => {
		const urlFilters = getFiltersFromUrl()
		return { ...initialFilters, ...urlFilters } as T
	})

	// Sync filters -> URL
	useEffect(() => {
		const params = new URLSearchParams()

		;(Object.entries(filters) as [keyof T, T[keyof T]][]).forEach(([key, value]) => {
			if (value !== null && value !== "" && (Array.isArray(value) ? value.length > 0 : true) && value !== false) {
				if (Array.isArray(value)) {
					params.set(String(key), JSON.stringify(value))
				} else {
					params.set(String(key), String(value))
				}
			}
		})

		const search = params.toString() ? `?${params.toString()}` : ""
		navigate({ pathname: location.pathname, search }, { replace: true })
	}, [filters, navigate, location.pathname])

	// Sync URL -> filters (back/forward navigation)
	useEffect(() => {
		const next = getFiltersFromUrl() as T
		setFilters((prev) => {
			if (JSON.stringify(prev) === JSON.stringify(next)) return prev
			return next
		})
	}, [location.search, getFiltersFromUrl])

	const updateFilter: UpdateFilter<T> = useCallback((key, value) => {
		setFilters((prev) => {
			const data = { ...prev }
			if (value === null || value === undefined) {
				delete data[key]
			} else {
				data[key] = value
			}
			return data
		})
	}, [])

	return [filters, updateFilter]
}

export default useFilters
