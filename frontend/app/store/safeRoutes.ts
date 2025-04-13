import { create } from "zustand"
import { persist } from "zustand/middleware"
import { localStorageConfig } from "~/lib/Utils"

const useSafeRouteStore = create()(
	persist(
		(set) => ({
			clusterAdded: false,
			deprecationChangesAllowed: false,
			elasticNodeUpgradeAllowed: false,
			kibanaNodeUpgradeAllowed: false,
			upgradeAssistAllowed: false,

			setClusterAdded: (payload: boolean) => set((_: any) => ({ clusterAdded: payload })),
			setDeprecationChangesAllowed: (payload: boolean) =>
				set((_: any) => ({ deprecationChangesAllowed: payload })),
			setElasticNodeUpgradeAllowed: (payload: boolean) =>
				set((_: any) => ({ elasticNodeUpgradeAllowed: payload })),
			setKibanaNodeUpgradeAllowed: (payload: boolean) => set((_: any) => ({ kibanaNodeUpgradeAllowed: payload })),
			setUpgradeAssistAllowed: (payload: boolean) => set((_: any) => ({ upgradeAssistAllowed: payload })),
			resetForEditCluster: () =>
				set((_: any) => ({
					deprecationChangesAllowed: false,
					elasticNodeUpgradeAllowed: false,
					kibanaNodeUpgradeAllowed: false,
					upgradeAssistAllowed: false,
				})),
			resetSafeRoutes: () =>
				set((_: any) => ({
					clusterAdded: false,
					deprecationChangesAllowed: false,
					elasticNodeUpgradeAllowed: false,
					kibanaNodeUpgradeAllowed: false,
					upgradeAssistAllowed: false,
				})),
		}),
		{
			name: "safe-route-storage",
			storage: localStorageConfig,
		}
	)
)

export default useSafeRouteStore