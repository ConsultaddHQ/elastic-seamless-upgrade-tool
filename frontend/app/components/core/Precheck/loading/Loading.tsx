import { Skeleton } from "@heroui/react"
import { Box, Typography } from "@mui/material"
import { ExportCurve, Refresh } from "iconsax-react"
import { OutlinedBorderButton } from "~/components/utilities/Buttons"

function Loading() {
	return (
		<Box className="flex gap-4 h-[calc(var(--window-height)-129px)]">
			<Box className="flex py-4 flex-col gap-[6px]">
				<Typography color="#A9AAB6" fontSize="12px" fontWeight="500" lineHeight="normal" letterSpacing="0.12px">
					Nodes
				</Typography>
				<Box className="flex flex-col gap-[6px] overflow-scroll min-w-[282px]">
					<Skeleton className="rounded-lg">
						<Box height="44px" />
					</Skeleton>
					<Skeleton className="rounded-lg">
						<Box height="44px" />
					</Skeleton>
					<Skeleton className="rounded-lg">
						<Box height="44px" />
					</Skeleton>
				</Box>
			</Box>
			<Box className="flex w-full p-px rounded-2xl" sx={{ background: "radial-gradient(#6E687C, #1D1D1D)" }}>
				<Box className="flex flex-col  gap-4 w-full rounded-2xl bg-[#0d0d0d]" padding="16px 0px">
					<Box className="flex flex-row gap-2 justify-between items-center" padding="0px 24px">
						<Box>
							<Typography
								color="#FFF"
								fontSize="16px"
								fontWeight="600"
								lineHeight="normal"
								letterSpacing="0.16px"
							>
								Logs
							</Typography>
							<Typography
								color="#A6A6A6"
								fontSize="12px"
								fontWeight="400"
								lineHeight="normal"
								letterSpacing="0.24px"
							>
								Succeded last month in 1m 8s
							</Typography>
						</Box>
						<Box className="flex flex-row gap-[6px]">
							<OutlinedBorderButton disabled>
								<Refresh color="currentColor" size="18px" /> Re-run"
							</OutlinedBorderButton>
							<OutlinedBorderButton disabled>
								<ExportCurve color="currentColor" size="18px" /> Export
							</OutlinedBorderButton>
						</Box>
					</Box>
					<Box className="flex flex-col gap-1 overflow-scroll" padding="0px 24px">
						<Skeleton className="rounded-lg">
							<Box height="44px" />
						</Skeleton>
						<Skeleton className="rounded-lg">
							<Box height="44px" />
						</Skeleton>
						<Skeleton className="rounded-lg">
							<Box height="44px" />
						</Skeleton>
					</Box>
				</Box>
			</Box>
		</Box>
	)
}

export default Loading
