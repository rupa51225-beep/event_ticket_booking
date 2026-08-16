import { IsEmail, IsNotEmpty, IsString, MinLength } from 'class-validator'

export class RegisterDto {
    @IsEmail({}, { message: 'Invalid email' })
    @IsNotEmpty({ message: 'Email is required' })
    email: string;


    @IsString()
    @IsNotEmpty({ message: 'Name is required' })
    name: string

    @IsString()
    @MinLength(6, { message: 'Password must be at least 6 characters long' })
    password: string
}