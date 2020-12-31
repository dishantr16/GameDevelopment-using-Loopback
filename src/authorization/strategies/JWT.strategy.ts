import {Request, HttpErrors} from '@loopback/rest';
import {inject} from '@loopback/core';
import {
  AuthenticationStrategy,
  AuthenticationMetadata,
  AuthenticationBindings,
  TokenService,
} from '@loopback/authentication';
import {UserPermissionsFn} from '../types';
import {MyAuthBindings} from '../keys';
import {UserProfile} from '@loopback/security';

export class JWTStrategy implements AuthenticationStrategy {
  name = 'jwt';

  constructor(
    @inject(AuthenticationBindings.METADATA)
    public metadata: AuthenticationMetadata,
    @inject(MyAuthBindings.USER_PERMISSIONS)
    protected checkPermissons: UserPermissionsFn,
    @inject(MyAuthBindings.TOKEN_SERVICE)
    protected tokenService: TokenService,
  ) {}
  /* async authenticate(request: Request): Promise<MyUserProfile | undefined> {
    const token: string = this.extractCredentials(request);
    try {
      const user: MyUserProfile = (await this.tokenService.verifyToken(token) as unknown as MyUserProfile;
      return user;
    } catch (err) {
      Object.assign(err, {code: 'INVALID_ACCESS_TOKEN', statusCode: 401});
      throw err;
    }
  } */
  async authenticate(request: Request): Promise<UserProfile | undefined> {
    const token: string = this.extractCredentials(request);
    const userProfile: UserProfile = await this.tokenService.verifyToken(token);
    return userProfile;
  }

  extractCredentials(request: Request): string {
    if (!request.headers.authorization) {
      throw new HttpErrors.Unauthorized(`Authorization header not found.`);
    }
    const authHeaderValue = request.headers.authorization;

    if (!authHeaderValue.startsWith('Bearer')) {
      throw new HttpErrors.Unauthorized(
        `Authorization header is not of type 'Bearer'.`,
      );
    }
    const parts = authHeaderValue.split(' ');
    if (parts.length !== 2)
      throw new HttpErrors.Unauthorized(
        `Authorization header value has too many parts. It must follow the pattern: 'Bearer xx.yy.zz' where xx.yy.zz is a valid JWT token.`,
      );
    const token = parts[1];
    return token;
  }
}
