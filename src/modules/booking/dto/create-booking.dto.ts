import { IsNotEmpty, IsString, IsUUID } from "class-validator";

export class CreateBookingDto {
    @IsUUID()
    @IsNotEmpty()
    bookingId: string;

    @IsUUID()
    @IsNotEmpty()
    userId: string;

    @IsString()
    @IsNotEmpty()
    paymentMethod: string;
}
