import { ApiProperty } from '@nestjs/swagger';
import { IsOptional, IsString } from 'class-validator';

export class UpdatePaymentConfigureDto {
    @ApiProperty({ example: '20', description: 'Spare parts monthly payment' })
    @IsOptional()
    @IsString()
    sparePartsMonthly?: string;

    @ApiProperty({ example: '20', description: 'Spare parts yearly payment' })
    @IsOptional()
    @IsString()
    perListingPrice?: string;

    @ApiProperty({ example: '20', description: 'Promotional ad price' })
    @IsOptional()
    @IsString()
    promotionalAdPrice?: string;

    @ApiProperty({ example: '2', description: 'Free promotional listings' })
    @IsOptional()
    @IsString()
    freePromotionalListings?: string;

}
