import { CanActivate, ExecutionContext } from '@nestjs/common';
import { Observable } from 'rxjs';

export class AccessGuard implements CanActivate {
  canActivate(
    context: ExecutionContext,
  ): boolean | Promise<boolean> | Observable<boolean> {
    const request = context.switchToHttp().getRequest();
    const userInfo = request.user;
    console.log(
      '🚀 ~ file: access.guard.ts:10 ~ AccessGuard ~ userInfo:',
      userInfo,
    );

    return userInfo;
  }
}
