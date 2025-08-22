import {
  ConflictException,
  Injectable,
  NotFoundException,
  UnauthorizedException,
} from '@nestjs/common';
import { RegisterRequest } from './dto/register.dto';
import { PrismaService } from 'src/prisma/prisma.service';
import { hash, verify } from 'argon2';
import { ConfigService } from '@nestjs/config';
import { JwtService } from '@nestjs/jwt';
import { LoginRequest } from './dto/login.dto';
import type { Request, Response } from 'express';
import isDev from 'src/utils/is-dev.util';

@Injectable()
export class AuthService {
  private readonly JWT_ACCESS_TOKEN_TTL: string;
  private readonly JWT_REFRESH_TOKEN_TTL: string;
  private readonly COOKIE_DOMAIN: string;
  constructor(
    private readonly prismaService: PrismaService,
    private readonly configService: ConfigService,
    private readonly jwtService: JwtService,
  ) {
    this.JWT_ACCESS_TOKEN_TTL = configService.getOrThrow<string>(
      'JWT_ACCESS_TOKEN_TTL',
    );
    this.JWT_REFRESH_TOKEN_TTL = configService.getOrThrow<string>(
      'JWT_REFRESH_TOKEN_TTL',
    );
    this.COOKIE_DOMAIN = configService.getOrThrow<string>('COOKIE_DOMAIN');
  }

  async register(res: Response, dto: RegisterRequest) {
    const { name, email, password } = dto;

    // Есть ли такой юзер уже в бд
    const existUser = await this.prismaService.user.findUnique({
      where: {
        email,
      },
    });

    if (existUser) {
      throw new ConflictException(
        'Пользователь с такой почтой уже существует!',
      );
    }

    // сохранение в бд
    const user = await this.prismaService.user.create({
      data: {
        name,
        email,
        password: await hash(password),
      },
    });
    return this.auth(res, user.id, String(user.role));
  }

  async login(res: Response, dto: LoginRequest) {
    const { email, password } = dto;

    const user = await this.prismaService.user.findUnique({
      where: {
        email,
      },
      select: {
        id: true,
        password: true,
        role: true,
      },
    });

    // условие на отсутсвие юзера в БД
    if (!user) {
      throw new NotFoundException('Пользоватиель не найден!');
    }

    // проверка пароля на валидность
    const isValidPassword = await verify(user.password, password);

    if (!isValidPassword) {
      throw new NotFoundException('Пользователь не найден!');
    }

    return this.auth(res, user.id, String(user.role));
  }

  async refresh(req: Request, res: Response) {
    const refreshtoken = req.cookies['refreshToken'];

    if (!refreshtoken) {
      throw new UnauthorizedException('refreshToken недействителен!');
    }

    const payload = await this.jwtService.verifyAsync(refreshtoken);

    if (payload) {
      const user = await this.prismaService.user.findUnique({
        where: {
          id: payload.sub,
        },
        select: {
          id: true,
          role: true,
        },
      });
      if (!user) {
        throw new NotFoundException('Пользователь не найден!');
      }
      return this.auth(res, user.id, String(user.role));
    }
  }

  async logout(res: Response) {
    this.setCookie(res, 'refreshToken', new Date(0));
    return true;
  }

  async validate(id: string) {
    const user = await this.prismaService.user.findUnique({
      where: {
        id,
      },
    });

    if (!user) {
      throw new NotFoundException('Пользователь не найден!');
    }

    return user;
  }

  private auth(res: Response, id: string, role: string) {
    const { accessToken, refreshToken } = this.generateTokens(id, role);
    this.setCookie(
      res,
      refreshToken,
      new Date(Date.now() + 1000 * 60 * 60 * 24 * 7),
    );

    return accessToken;
  }

  private generateTokens(id: string, role: string) {
    const payload = { sub: id, role: role };

    const accessToken = this.jwtService.sign(payload, {
      expiresIn: this.JWT_ACCESS_TOKEN_TTL,
    });

    const refreshToken = this.jwtService.sign(payload, {
      expiresIn: this.JWT_REFRESH_TOKEN_TTL,
    });

    return { accessToken, refreshToken };
  }

  private setCookie(res: Response, value: string, expires: Date) {
    res.cookie('refreshToken', value, {
      httpOnly: true,
      domain: this.COOKIE_DOMAIN,
      expires,
      secure: !isDev(this.configService),
      sameSite: !isDev(this.configService) ? 'none' : 'lax',
    });
  }
}
