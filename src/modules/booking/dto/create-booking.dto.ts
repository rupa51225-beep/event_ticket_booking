import { IsNotEmpty, IsUUID } from "class-validator";

export class CreateBookingDto {
    @IsUUID()
    @IsNotEmpty()
    bookingId: string

    @IsNotEmpty()
    @IsUUID()
    userId: string

    @IsNotEmpty()
    @IsUUID()
    paymentMethod: string



}
