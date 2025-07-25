import { HeroUIProvider } from "@heroui/react"
import { Box, ThemeProvider } from "@mui/material"
import { QueryClient, QueryClientProvider } from "@tanstack/react-query"
import { useEffect, useRef, useState } from "react"
import { isRouteErrorResponse, Links, Meta, Scripts, ScrollRestoration, useNavigation } from "react-router"
import LoadingBar, { LoadingBarContainer } from "react-top-loading-bar"
import { Toaster } from "sonner"
import type { Route } from "./+types/root"
import MainApp from "./app"
import AssetsManager from "./constants/AssetsManager"
import stylesheet from "./styles/app.css?url"
import themes from "./themes"

export const links: Route.LinksFunction = () => [
	{ rel: "preconnect", href: "https://fonts.googleapis.com" },
	{
		rel: "preconnect",
		href: "https://fonts.gstatic.com",
		crossOrigin: "anonymous",
	},
	{
		rel: "stylesheet",
		href: "https://fonts.googleapis.com/css2?family=Inter:ital,opsz,wght@0,14..32,100..900;1,14..32,100..900&display=swap",
	},
	{
		rel: "stylesheet",
		href: "https://fonts.googleapis.com/css2?family=Roboto+Mono:ital,wght@0,100..700;1,100..700&display=swap",
	},
	{
		rel: "stylesheet",
		href: "https://fonts.googleapis.com/css2?family=Manrope:wght@200..800&display=swap",
	},
	{ rel: "stylesheet", href: stylesheet },
]

export function HydrateFallback() {
	return (
		<Box className="flex items-center justify-center h-screen scale-x-[-1] bg-[#0a0a0a]">
			<img src={AssetsManager.ANIMATED_LOADER} width="64px" height="64px" />
		</Box>
	)
}

export function Layout({ children }: { children: React.ReactNode }) {
	return (
		<html lang="en">
			<head>
				<meta charSet="utf-8" />
				<meta name="viewport" content="width=device-width, initial-scale=1" />
				<Meta />
				<Links />
			</head>
			<body>
				{children}
				<ScrollRestoration />
				<Scripts />
			</body>
		</html>
	)
}

export default function App() {
	const intervalRef = useRef<any>(null)
	const navigation = useNavigation()
	const [progress, setProgress] = useState<number>(0)

	useEffect(() => {
		const appHeight = () => {
			const doc = document.documentElement
			doc.style.setProperty("--window-height", `${window.innerHeight}px`)
		}

		appHeight()

		window.addEventListener("resize", appHeight)

		return () => {
			window.removeEventListener("resize", appHeight)
		}
	}, [])

	useEffect(() => {
		if (navigation.state === "loading") {
			setProgress(0)
			intervalRef.current = setInterval(() => {
				setProgress((oldProgress) => {
					if (oldProgress >= 70) {
						clearInterval(intervalRef.current)
						return 70
					}
					return Math.min(oldProgress + 10, 70)
				})
			}, 100)
		} else {
			if (intervalRef.current) {
				clearInterval(intervalRef.current)
			}
			setProgress(100)
		}
	}, [navigation.state])

	return (
		<QueryClientProvider client={new QueryClient()}>
			<HeroUIProvider>
				<ThemeProvider theme={themes}>
					<LoadingBarContainer>
						<LoadingBar
							color="#6627FF"
							progress={progress}
							onLoaderFinished={() => setProgress(0)}
							height={1}
							waitingTime={500}
						/>
						<MainApp />
						<Toaster richColors theme="light" position="top-right" toastOptions={{ closeButton: true }} />
					</LoadingBarContainer>
				</ThemeProvider>
			</HeroUIProvider>
		</QueryClientProvider>
	)
}

export function ErrorBoundary({ error }: Route.ErrorBoundaryProps) {
	let message = "Oops!"
	let details = "An unexpected error occurred."
	let stack: string | undefined

	if (isRouteErrorResponse(error)) {
		message = error.status === 404 ? "404" : "Error"
		details = error.status === 404 ? "The requested page could not be found." : error.statusText || details
	} else if (import.meta.env.DEV && error && error instanceof Error) {
		details = error.message
		stack = error.stack
	}

	return (
		<main className="pt-16 p-4 container mx-auto">
			<h1>{message}</h1>
			<p>{details}</p>
			{stack && (
				<pre className="w-full p-4 overflow-x-auto">
					<code>{stack}</code>
				</pre>
			)}
		</main>
	)
}
