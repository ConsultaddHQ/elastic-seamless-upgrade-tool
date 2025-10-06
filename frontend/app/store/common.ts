import { create } from "zustand"
import { persist } from "zustand/middleware"
import { localStorageConfig, sessionStorageConfig } from "~/lib/Utils"

interface LocalStoreState {
	sessionName: string
	setSessionName: (name: string) => void
	reset: () => void
}

export const useLocalStore = create<LocalStoreState>()(
	persist(
		(set) => ({
			sessionName: "",
			setSessionName: (name: string) => set(() => ({ sessionName: name })),
			reset: () =>
				set(() => ({
					clusterId: "",
					infraType: "",
					sessionName: "",
					deploymentId: "",
				})),
		}),
		{
			name: "local-store",
			storage: localStorageConfig,
		}
	)
)

interface SessionStoreState {
	setupStep: number
	setSetupStep: (step: number) => void
	reset: () => void
}

export const useSessionStore = create<SessionStoreState>()(
	persist(
		(set) => ({
			setupStep: 1,
			setSetupStep: (step: number) => set(() => ({ setupStep: step })),
			reset: () =>
				set(() => ({
					setupStep: 1,
				})),
		}),
		{ name: "session-store", storage: sessionStorageConfig }
	)
)
