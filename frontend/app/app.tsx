import { Outlet } from "react-router"
import AiAssistantProvider from "./components/core/AiAssistantChat/AiAssistantProvider"

function MainApp() {
	return (
		<AiAssistantProvider>
			<Outlet />
		</AiAssistantProvider>
	)
}

export default MainApp
