import {
  Body,
  Controller,
  Get,
  HttpCode,
  HttpStatus,
  Post,
  Req,
  Res,
  UseGuards,
} from '@nestjs/common';
import { AuthService } from './auth.service';
import { RegisterRequest } from './dto/register.dto';
import { LoginRequest } from './dto/login.dto';
import type { Response, Request } from 'express';
import {
  ApiBadRequestResponse,
  ApiConflictResponse,
  ApiNotFoundResponse,
  ApiOkResponse,
  ApiOperation,
  ApiUnauthorizedResponse,
} from '@nestjs/swagger';
import { AuthResponse } from './dto/auth.dto';
import { AuthGuard } from '@nestjs/passport';
import { Authorization } from './decorators/authorization.decorators';
import { Autorizade } from './decorators/autorized.decorators';
import { User } from 'generated/prisma';

@Controller('auth')
export class AuthController {
  constructor(private readonly authService: AuthService) {}

  @ApiOperation({
    summary: 'Регистрация',
    description: 'Создаёт новый аккаунт пользователя в мессенджере Void',
  })
  @ApiOkResponse({
    type: AuthResponse,
  })
  @ApiBadRequestResponse({
    description: 'Некорректные данные',
  })
  @ApiConflictResponse({
    description: 'Пользователь с такой почтой уже существует!',
  })
  @Post('/register')
  @HttpCode(HttpStatus.CREATED)
  async register(
    @Res({
      passthrough: true,
    })
    res: Response,
    @Body() dto: RegisterRequest,
  ) {
    return this.authService.register(res, dto);
  }

  @ApiOperation({
    summary: 'Вход',
    description: 'Вход в аккаунт пользователя в мессенджере Void',
  })
  @ApiOkResponse({
    type: AuthResponse,
  })
  @ApiNotFoundResponse({
    description: 'Пользователь не найден!',
  })
  @Post('/login')
  @HttpCode(HttpStatus.OK)
  async login(
    @Res({
      passthrough: true,
    })
    res: Response,
    @Body() dto: LoginRequest,
  ) {
    return this.authService.login(res, dto);
  }

  @ApiOperation({
    summary: 'Обновление JWT',
    description: 'Обновление JWT',
  })
  @ApiOkResponse({
    type: AuthResponse,
  })
  @ApiUnauthorizedResponse({
    description: 'Не действителен refresh токен!',
  })
  @Post('/refresh')
  @HttpCode(HttpStatus.OK)
  async refresh(
    @Req() req: Request,
    @Res({
      passthrough: true,
    })
    res: Response,
  ) {
    return this.authService.refresh(req, res);
  }

  @ApiOperation({
    summary: 'Выход',
    description: 'Выход из аккаунт пользователя в мессенджере Void',
  })
  @Post('/logout')
  @HttpCode(HttpStatus.OK)
  async logout(
    @Res({
      passthrough: true,
    })
    res: Response,
  ) {
    return this.authService.logout(res);
  }
}
