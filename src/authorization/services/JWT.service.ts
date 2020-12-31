//mport {inject} from '@loopback/context';
import {HttpErrors} from '@loopback/rest';
import {promisify} from 'util';
import {TokenService} from '@loopback/authentication';
import {TokenServiceConstants} from '../keys';
import {Credential} from '../types';
import {repository} from '@loopback/repository';
import {CharacterRepository} from '../../repositories';
import * as _ from 'lodash';
import {toJSON} from '@loopback/testlab';
import {UserProfile,securityId} from '@loopback/security';

const jwt = require('jsonwebtoken');
const signAsync = promisify(jwt.sign);
const verifyAsync = promisify(jwt.verify);

export class JWTService implements TokenService {
  constructor(
    @repository(CharacterRepository)
    public characterRepository: CharacterRepository,
  ) {}

 /*  async verifyToken(token: string): Promise<UserProfile> {
    if (!token) {
      throw new HttpErrors.Unauthorized(
        `Error verifying token : 'token' is null`,
      );
    }

    const decryptedToken = await verifyAsync(
      token,
      TokenServiceConstants.TOKEN_SECRET_VALUE,
    );
     let userProfile = _.pick(decryptedToken, [
      'id',
      'email',
      'name',
      `permissions`,
    ]);
    return userProfile;
  }
 */
async verifyToken(token: string): Promise<UserProfile> {
  if (!token) {
    throw new HttpErrors.Unauthorized(
      `Error verifying token : 'token' is null`,
    );
  }
  let userProfile: UserProfile;
  try {
    // decode user profile from token
    const decodedToken = await verifyAsync(token, TokenServiceConstants.TOKEN_SECRET_VALUE,);
    // don't copy over  token field 'iat' and 'exp', nor 'email' to user profile
    userProfile = Object.assign(
      {[securityId]: '', name: ''},
      {
        [securityId]: decodedToken.id,
        id: decodedToken.id,
        email: decodedToken.email,
        name: decodedToken.name,
        permissions: decodedToken.permissions
      },
    );
  } catch (error) {
    throw new HttpErrors.Unauthorized(
      `Error verifying token : ${error.message}`,
    );
  }
  return userProfile;
}

  async generateToken(userProfile: UserProfile): Promise<string> {
    const token = await signAsync(
      userProfile,
      TokenServiceConstants.TOKEN_SECRET_VALUE,
      {
        expiresIn: TokenServiceConstants.TOKEN_EXPIRES_IN_VALUE,
      },
    );

    return token;
  }

  async getToken(credential: Credential): Promise<string> {
    const foundUser = await this.characterRepository.findOne({
      where: {email: credential.email},
    });
    if (!foundUser) {
      throw new HttpErrors['NotFound'](
        `User with email ${credential.email} not found.`,
      );
    }

    if (credential.password !== foundUser.password) {
      throw new HttpErrors.Unauthorized('The credentials are not correct.');
    }
    const currentUser: UserProfile = _.pick(toJSON(foundUser), [
      'email',
      'name',
      'permissions',
    ]) as UserProfile;
    const token = await this.generateToken(currentUser);
    return token;
  }
}
