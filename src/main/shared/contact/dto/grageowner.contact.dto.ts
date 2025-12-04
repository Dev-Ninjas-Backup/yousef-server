import { ContactSubject } from "@prisma/client";
import { IsOptional, IsString } from "class-validator";

export class CreateContactDto {
    FirstName: string;
    LastName: string;
    email: string;
    subject: ContactSubject;
    message: string;
    garageOwnerId: string;
    @IsString()
    @IsOptional()
    otherSubject?: string;
}