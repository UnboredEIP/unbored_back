import { Injectable, CanActivate, ExecutionContext } from '@nestjs/common';
import { Role } from 'src/auth/schemas/user.schema';


@Injectable()
export class ProGuard implements CanActivate {
  constructor() {}

  canActivate(context: ExecutionContext): boolean {
    const request = context.switchToHttp().getRequest();
    const user = request.user.role;
    return (user === Role.USER ? false : true)
  }
}