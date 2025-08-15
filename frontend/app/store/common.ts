import { create } from "zustand"
import { persist } from "zustand/middleware"
import { localStorageConfig, sessionStorageConfig } from "~/lib/Utils"

interface LocalStoreState {
	clusterId: string
	infraType: string
	sessionName: string
	deploymentId: string
	setDeploymentId: (id: string) => void
	setClusterId: (id: string) => void
	setInfraType: (type: string) => void
	setSessionName: (name: string) => void
	reset: () => void
}

export const useLocalStore = create<LocalStoreState>()(
	persist(
		(set) => ({
			clusterId: "",
			infraType: "",
			sessionName: "",
			deploymentId: "",
			setDeploymentId: (id: string) => set((state) => ({ deploymentId: id })),
			setClusterId: (id: string) => set((state) => ({ clusterId: id })),
			setInfraType: (type: string) => set((state) => ({ infraType: type })),
			setSessionName: (name: string) => set((state) => ({ sessionName: name })),
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
			setSetupStep: (step: number) => set((state: any) => ({ setupStep: step })),
			reset: () =>
				set((_: any) => ({
					setupStep: 1,
				})),
		}),
		{ name: "session-store", storage: sessionStorageConfig }
	)
)
