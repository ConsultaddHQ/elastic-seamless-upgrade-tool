import { create } from "zustand"
import { devtools } from "zustand/middleware"

type RefreshStore = {
	refreshToggle: boolean
	refresh: () => void
}

const useRefreshStore = create<RefreshStore>()(
	devtools((set) => ({
		refreshToggle: false,
		refresh: () => set((state) => ({ refreshToggle: !state.refreshToggle })),
	}))
)

export default useRefreshStore
