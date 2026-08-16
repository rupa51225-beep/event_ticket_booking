import { IsNotEmpty, IsUUID } from "class-validator";

export class CreateSeatDto {
    @IsUUID()
    @IsNotEmpty()
    userId: string
}
