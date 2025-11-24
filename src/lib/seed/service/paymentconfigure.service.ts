import { Injectable, OnModuleInit } from '@nestjs/common';
import chalk from 'chalk';
import { PrismaService } from 'src/lib/prisma/prisma.service';

@Injectable()
export class PaymentConfigureService implements OnModuleInit {
    constructor(private readonly prisma: PrismaService) { }

    async onModuleInit(): Promise<void> {
        await this.seedPaymentConfigure();
    }

    async seedPaymentConfigure(): Promise<void> {
        const existingConfig = await this.prisma.paymentConfigure.findFirst();

        if (!existingConfig) {
            const data = {
                sparePartsMonthly: "0",
                perListingPrice: "0",
                promotionalAdPrice: "0",
                freePromotionalListings: "0",
                freePromotionalListingStatus: true,
            };

            await this.prisma.paymentConfigure.create({ data });

            console.info(
                chalk.bgGreen.white.bold(
                    `🚀 Seeded PaymentConfigure successfully`
                )
            );
        } else {
            console.info(
                chalk.bgYellow.black.bold(
                    `⚠️ PaymentConfigure already exists. Skipping seed.`
                )
            );
        }
    }
}
