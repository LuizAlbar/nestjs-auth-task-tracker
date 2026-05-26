import { ApiProperty } from "@nestjs/swagger";
import { IsEmail, IsNotEmpty, IsString, MinLength } from "class-validator";

export class RegisterDTO {
	@ApiProperty({ example: "John Doe" })
	@IsString()
	@IsNotEmpty()
	name!: string;

	@ApiProperty({ example: "john@example.com" })
	@IsEmail()
	email!: string;

	@ApiProperty({ example: "password123" })
	@IsString()
	@MinLength(8)
	password!: string;
}
