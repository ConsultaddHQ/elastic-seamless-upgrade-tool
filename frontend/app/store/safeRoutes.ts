import { create } from "zustand"
import { persist } from "zustand/middleware"
import { localStorageConfig } from "~/lib/Utils"

type TSafeRouteStore = {
	deprecationChangesAllowed: boolean
	elasticNodeUpgradeAllowed: boolean
	kibanaNodeUpgradeAllowed: boolean
	upgradeAssistAllowed: boolean
	precheckAllowed: boolean

	setPrecheckAllowed: (payload: boolean) => void
	setDeprecationChangesAllowed: (payload: boolean) => void
	setElasticNodeUpgradeAllowed: (payload: boolean) => void
	setKibanaNodeUpgradeAllowed: (payload: boolean) => void
	setUpgradeAssistAllowed: (payload: boolean) => void
	resetForEditCluster: () => void
	resetSafeRoutes: () => void
}

const useSafeRouteStore = create<TSafeRouteStore>()(
	persist(
		(set) => ({
			deprecationChangesAllowed: false,
			elasticNodeUpgradeAllowed: false,
			kibanaNodeUpgradeAllowed: false,
			upgradeAssistAllowed: false,
			precheckAllowed: false,

			setPrecheckAllowed: (payload: boolean) => set(() => ({ precheckAllowed: payload })),
			setDeprecationChangesAllowed: (payload: boolean) =>
				set(() => ({ deprecationChangesAllowed: payload })),
			setElasticNodeUpgradeAllowed: (payload: boolean) =>
				set(() => ({ elasticNodeUpgradeAllowed: payload })),
			setKibanaNodeUpgradeAllowed: (payload: boolean) => set(() => ({ kibanaNodeUpgradeAllowed: payload })),
			setUpgradeAssistAllowed: (payload: boolean) => set(() => ({ upgradeAssistAllowed: payload })),
			resetForEditCluster: () =>
				set(() => ({
					deprecationChangesAllowed: false,
					elasticNodeUpgradeAllowed: false,
					kibanaNodeUpgradeAllowed: false,
					upgradeAssistAllowed: false,
					precheckAllowed: false,
				})),
			resetSafeRoutes: () =>
				set(() => ({
					deprecationChangesAllowed: false,
					elasticNodeUpgradeAllowed: false,
					kibanaNodeUpgradeAllowed: false,
					upgradeAssistAllowed: false,
					precheckAllowed: false,
				})),
		}),
		{
			name: "safe-route-storage",
			storage: localStorageConfig,
		}
	)
)

export default useSafeRouteStore
