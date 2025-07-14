import { createTheme } from "@mui/material"

export default createTheme({
	palette: {
		mode: "dark",
	},
	typography: {
		fontFamily: ['"Manrope"', '"Inter"', "sans-serif"].join(","),
	},
	components: {
		MuiTableHead: {
			styleOverrides: {
				root: {
					borderRadius: "40px",
					background: "#161616",
					height: "42px",
					"& .MuiTableCell-root": {
						color: "#9D90BB",
						fontSize: "12px",
						fontWeight: 600,
						lineHeight: "18px",
					},
				},
			},
		},
		MuiTableBody: {
			styleOverrides: {
				root: {
					background: "transparent",
					"& .MuiTableCell-root": {
						color: "#ADADAD",
						fontSize: "14px",
						fontWeight: 400,
						lineHeight: "normal",
					},
				},
			},
		},
		MuiButton: {
			styleOverrides: {
				outlined: {
					borderRadius: "10px",
					border: "1px solid #FFF",
					color: "#FFF",
					fontSize: "14px",
					fontWeight: 500,
					lineHeight: "20px",
					padding: "10px 20px",
					gap: "6px",
					textTransform: "none",
					boxShadow: "none",

					":hover": {
						background: "transparent",
						border: "1px solid #FFF",
					},

					[`&.Mui-disabled`]: {
						background: "#181818",
						border: "1px solid #292929",
						color: "#707070",
					},
				},
				contained: {
					borderRadius: "10px",
					border: "1px solid transparent",
					background: "#FFFFFF",
					color: "#0A0A0A",
					textAlign: "center",
					fontSize: "15px",
					fontWeight: 500,
					lineHeight: "normal",
					letterSpacing: "-0.15px",
					textTransform: "none",
					display: "flex",
					gap: "6px",
					padding: "10px 16px",
					transition: "0.5s",
					position: "relative",
					zIndex: "0",
					boxSizing: "border-box",

					":hover": {
						background: "#0F0F0F",
						color: "#FFF",
					},
					"::before": {
						content: "''",
						display: "block",
						position: "absolute",
						top: "-2px",
						left: "-2px",
						right: "-2px",
						bottom: "-2px",
						background: "linear-gradient(45deg, #ff6ec4, #7873f5)",
						zIndex: "-1",
						borderRadius: "10px",
						transition: "opacity 0.3s ease",
						opacity: 0,
					},

					":hover::before": {
						opacity: 1,
						zIndex: -1,
					},

					[`&.Mui-disabled`]: {
						background: "#181818",
						border: "1px solid #292929",
						color: "#707070",
					},
				},
			},
		},
	},
})
