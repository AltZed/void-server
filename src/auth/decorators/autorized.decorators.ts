import { createParamDecorator, ExecutionContext } from '@nestjs/common';
import { User } from 'generated/prisma';
import { Request } from 'express';

export const Autorizade = createParamDecorator(
  (data: keyof User, ctx: ExecutionContext) => {
    const request = ctx.switchToHttp().getRequest();

    const user = request.user;

    return data ? user![data] : user;
  },
);
