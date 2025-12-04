import { ContactSubject } from "@prisma/client";



export class CreateInquiryDto {
    FirstName: string;
    LastName: string;
    email: string;
    subject: ContactSubject;
    message: string;
    garageOwnerId: string;
}
