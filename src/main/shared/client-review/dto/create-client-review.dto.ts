import { ApiProperty } from "@nestjs/swagger";
import { IsNotEmpty } from "class-validator";

export class CreateClientReviewDto {

    @ApiProperty({
        example: "Great service and friendly staff!",
    })
    @IsNotEmpty()
    reviewText: string;

    @ApiProperty({

        example: "5",
    })
    @IsNotEmpty()
    rating: string;

}
