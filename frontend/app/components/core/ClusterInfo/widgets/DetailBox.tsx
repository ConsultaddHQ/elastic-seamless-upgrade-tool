import { Box, Typography } from "@mui/material"
import { OneLineSkeleton } from "~/components/utilities/Skeletons"

const DetailBox = ({ title,action, description, customDescription, isLoading = false }: TDetailBox) => {
	return (
		<Box className="flex flex-col gap-1">
			<Box className="flex flex-row items-center gap-1">
				<Typography color="#FFF" fontSize="12px" fontWeight="400" lineHeight="normal" letterSpacing="0.12px">
					{title}
				</Typography>
				{action}
			</Box>
			<OneLineSkeleton
				className="rounded-md max-w-[250px] w-full"
				show={isLoading}
				component={
					<>
						{String(description) && (
							<Typography
								color="#6E6E6E"
								fontSize="15px"
								fontWeight="400"
								lineHeight="20px"
								letterSpacing="0.3px"
							>
								{description}
							</Typography>
						)}
						{customDescription ? customDescription : null}
					</>
				}
				height="20px"
			/>
		</Box>
	)
}

export default DetailBox
