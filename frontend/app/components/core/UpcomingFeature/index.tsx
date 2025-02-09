import { Drawer, DrawerBody, DrawerContent } from "@heroui/react"
import { Box, Typography } from "@mui/material"
import { ArrowLeft, DocumentText1, FormatSquare, Grid2, Magicpen, Radar2, SearchStatus } from "iconsax-react"
import { OutlinedButton } from "~/components/utilities/Buttons"
import AssetsManager from "~/constants/AssetsManager"
import MajorFeature from "./widgets/MajorFeature"
import MinorFeature from "./widgets/MinorFeature"

const STYLES = {
	GO_BACK_BUTTON: {
		minHeight: "30px",
		height: "30px",
		gap: "6px",
		padding: "6px 10px 8px 10px",
		color: "#ADADAD",
		fontSize: "12px",
		fontWeight: "500",
		lineHeight: "normal",
		borderColor: "#2F2F2F",
		borderRadius: "8px",
		background: "#141415",
	},
}

function UpcomingFeature({ isOpen, onOpenChange }: { isOpen: boolean; onOpenChange: () => void }) {
	return (
		<Drawer
			isOpen={isOpen}
			size="full"
			onOpenChange={onOpenChange}
			placement="top"
			classNames={{ base: "bg-[#0A0A0A]" }}
			motionProps={{
				variants: {
					enter: {
						opacity: 1,
						y: 0,
						// @ts-ignore
						duration: 0.3,
					},
					exit: {
						y: 100,
						opacity: 0,
						// @ts-ignore
						duration: 0.3,
					},
				},
			}}
		>
			<DrawerContent>
				{(onClose) => (
					<DrawerBody>
						<Box height="50px" />
						<Box className="flex flex-col gap-2 w-full">
							<OutlinedButton onClick={onOpenChange} sx={STYLES.GO_BACK_BUTTON}>
								<ArrowLeft size="14px" color="currentColor" /> Go back
							</OutlinedButton>
							<Box
								className="flex p-px rounded-2xl h-[calc(var(--window-height)-120px)]"
								sx={{ background: "radial-gradient(#6E687C, #1D1D1D)" }}
							>
								<Box
									className="flex flex-col gap-6 rounded-2xl bg-[#0D0D0D] w-full h-full items-start"
								>
									<Box className="flex flex-row gap-5 items-center" padding="24px 32px 0px 32px">
										<Box
											className="flex p-px rounded-[10px]"
											sx={{
												background:
													"linear-gradient(125deg, #E0B517 0%, #F2EBD2 38.44%, #F2EBD2 84.94%, #E0B517 100%)",
												boxShadow: "0px 0px 15px 3px rgba(233, 204, 97, 0.41)",
											}}
										>
											<Box className="flex rounded-[10px] items-center justify-center min-h-[42px] min-w-[42px] bg-[#0D0D0D]">
												<Magicpen size="20px" color="#FFF" variant="Bold" />
											</Box>
										</Box>
										<Typography color="#FFF" fontSize="20px" fontWeight="600" lineHeight="22px">
											Upcoming Features
										</Typography>
									</Box>
									<Box className="flex flex-col h-full w-full gap-3 overflow-auto" padding="0px 32px 24px 32px">
										<Box className="grid col-auto grid-cols-2 gap-3 w-full">
											<MajorFeature icon={AssetsManager.LOGSTASH} title="Logstash" />
											<MajorFeature icon={AssetsManager.EL} title="Elastic Agent" />
										</Box>
										<Box className="grid col-auto grid-cols-2 lg:grid-cols-3 gap-3 w-full">
											<MinorFeature
												icon={DocumentText1}
												title="Filebeat"
												description="Lightweight shipper for logs and other data."
											/>
											<MinorFeature
												icon={Radar2}
												title="Metricbeat"
												description="Lightweight shipper for logs and other data."
											/>
											<MinorFeature
												icon={FormatSquare}
												title="Packetbeat"
												description="Lightweight shipper for logs and other data."
											/>
											<MinorFeature
												icon={SearchStatus}
												title="auditbeat"
												description="Lightweight shipper for logs and other data."
											/>
											<MinorFeature
												icon={DocumentText1}
												title="Logstash"
												description="Lightweight shipper for logs and other data."
											/>
											<MinorFeature
												icon={Grid2}
												title="Winlogbeat"
												description="Lightweight shipper for logs and other data."
											/>
										</Box>
									</Box>
								</Box>
							</Box>
						</Box>
					</DrawerBody>
				)}
			</DrawerContent>
		</Drawer>
	)
}

export default UpcomingFeature
