import { Box, IconButton, InputAdornment, CssBaseline, Typography } from "@mui/material"
import type { Route } from "../+types/root"
import { Button } from "@heroui/react"
import { useFormik } from "formik"
import { ArrowRight, Eye, EyeSlash } from "iconsax-react"
import { useEffect, useState } from "react"
import { useNavigate } from "react-router"
import Input from "~/components/utilities/Input"
import axiosJSON from "~/apis/http"
import { useLocalStore } from "~/store/common"

export function meta({}: Route.MetaArgs) {
	return [{ title: "Hyperflex" }, { name: "description", content: "Welcome to Hyperflex" }]
}

type TLoginForm = {
	username: string
	password: string
}

export default function LoginPage() {
	const navigate = useNavigate()
	const [showPassword, setShowPassword] = useState(false)
	useEffect(() => {
		const sessionName = useLocalStore.getState().sessionName
		if (sessionName) {
			navigate("/")
		}
	}, [])

	const formik = useFormik<TLoginForm>({
		initialValues: {
			username: "",
			password: "",
		},
		onSubmit: async (values) => {
			const response = await axiosJSON("/auth/login", {
				method: "POST",
				data: { ...values },
			})
			const accessToken = response.data.accessToken
			useLocalStore.getState().setSessionName(accessToken)
			navigate("/")
		},
	})
	return (
		<Box
			className="w-full flex items-center justify-center mt-[50px]" // centers child vertically and horizontally
			padding={{ xs: "32px 16px", lg: "32px 56px 32px 152px" }}
			sx={{ minHeight: "100vh" }} // ensures full viewport height for vertical centering
		>
			<CssBaseline />
			<Box className="flex flex-col w-full gap-10 max-w-4xl">
				<Box className="flex flex-col gap-4 max-w-[515px] w-full">
					<Box
						className="flex items-center justify-center rounded-[10px] p-px w-min"
						sx={{
							background:
								"linear-gradient(135deg, #6627FF 2.29%, #C9C0DF 44.53%, #131315 97.18%, #131315 97.18%)",
						}}
					>
						<Typography className="flex items-center justify-center size-10 rounded-[9px] font-manrope font-semibold text-xl leading-[22px] bg-black">
							👋
						</Typography>
					</Box>
					<Typography fontSize="24px" fontWeight={600} lineHeight="22px" color="#FFF">
						Login to your account
					</Typography>
					<Typography fontSize="16px" fontWeight={500} lineHeight="22px" color="#ADADAD">
						Welcome back! Please enter your details.
					</Typography>
				</Box>
				<Box
					className="flex flex-col gap-3 justify-between overflow-auto"
					height={{
						xs: "calc(var(--window-height) - 368px)",
						sm: "calc(var(--window-height) - 346px)",
						md: "calc(var(--window-height) - 280px)",
					}}
				>
					<Box className="flex flex-col items-stretch gap-[40px] max-w-[552px] w-full">
						<Box className="flex flex-col gap-[24px]">
							<Box className="flex flex-col gap-[8px] max-w-[515px]">
								<Typography color="#ABA9B1" fontSize="14px" fontWeight="400" lineHeight="20px">
									Username
								</Typography>
								<Box className="flex flex-col gap-[6px]">
									<Input
										fullWidth
										id="username"
										name="username"
										type="text"
										placeholder="Enter username"
										variant="outlined"
										value={formik.values.username}
										onChange={formik.handleChange}
										onBlur={formik.handleBlur}
										error={formik.touched.username && Boolean(formik.errors.username)}
										helperText={formik.touched.username && formik.errors.username}
									/>
								</Box>
							</Box>
							<Box className="flex flex-col gap-[8px] max-w-[515px]">
								<Typography color="#ABA9B1" fontSize="14px" fontWeight="400" lineHeight="20px">
									Password
								</Typography>
								<Box className="flex flex-col gap-[6px]"></Box>
								<Input
									fullWidth
									id="password"
									name="password"
									type={showPassword ? "text" : "password"}
									placeholder="Enter password"
									variant="outlined"
									value={formik.values.password}
									onChange={formik.handleChange}
									onBlur={formik.handleBlur}
									error={formik.touched.password && Boolean(formik.errors.password)}
									helperText={formik.touched.password && formik.errors.password}
									InputProps={{
										endAdornment: (
											<InputAdornment position="end">
												<IconButton
													aria-label="toggle password visibility"
													onClick={() => setShowPassword(!showPassword)}
													onMouseDown={(event) => event.preventDefault()}
													edge="end"
												>
													{showPassword ? (
														<Eye size="18px" color="#FFF" />
													) : (
														<EyeSlash size="18px" color="#FFF" />
													)}
												</IconButton>
											</InputAdornment>
										),
									}}
								/>
							</Box>
						</Box>
						<Box className="flex flex-col gap-[24px]">
							<Box className="flex flex-col gap-[8px] max-w-[515px]">
								<Button
									color="primary"
									className="bg-white w-full text-[#0A0A0A]"
									onPress={() => formik.handleSubmit()}
								>
									Login <ArrowRight color="#0A0A0A" size={16} />
								</Button>
							</Box>
						</Box>
					</Box>
				</Box>
			</Box>
		</Box>
	)
}
