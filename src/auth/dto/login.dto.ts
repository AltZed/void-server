import { ApiProperty } from '@nestjs/swagger';
import { IsEmail, IsNotEmpty, IsString } from 'class-validator';

export class LoginRequest {
  @ApiProperty({
    description: 'Внутреняя почта',
    example: 'DarkusFoxis@abyss',
  })
  @IsString({
    message: 'Почта должна быть строкой!',
  })
  @IsNotEmpty({
    message: 'Почта не может быть пустой!',
  })
  @IsEmail({}, { message: 'Почта некорректна!' })
  email: string;

  @ApiProperty({
    description: 'Пароль',
    example: '123456',
  })
  @IsString({
    message: 'Пароль должен быть строкой!',
  })
  @IsNotEmpty({
    message: 'Пароль не может быть пустым!',
  })
  password: string;
}
