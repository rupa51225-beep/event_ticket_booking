import { IsNotEmpty, IsUUID } from "class-validator";

export class HoldSeatDto {
    @IsUUID()
    @IsNotEmpty()
    userId: string
}
