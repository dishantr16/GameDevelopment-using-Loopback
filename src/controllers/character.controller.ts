import {repository} from '@loopback/repository';
import {post, get, del, requestBody} from '@loopback/rest';
import {Character} from '../models';
import {CharacterRepository} from '../repositories';
//add
import {inject, Getter} from '@loopback/core';
import {HttpErrors} from '@loopback/rest';
import {
  MyUserProfile,
  Credential,
  MyAuthBindings,
  PermissionKey,
  UserProfileSchema,
  JWTService,
} from '../authorization';
import {authenticate, AuthenticationBindings} from '@loopback/authentication';
//import {authorize} from '@loopback/authorization';

export class CharacterController {
  constructor(
    @repository(CharacterRepository)
    public characterRepository: CharacterRepository,
    @inject(MyAuthBindings.TOKEN_SERVICE)
    public jwtService: JWTService,
    @inject.getter(AuthenticationBindings.CURRENT_USER)
    public getCurrentUser: Getter<MyUserProfile>,
  ) {}

  /**
   * create character
   * @param character character
   */
  @post('/characters', {
    responses: {
      '200': {
        description: 'Character model instance',
        content: {'application/json': {schema: {'x-ts-type': Character}}},
      },
    },
  })
  async create(@requestBody() character: Character): Promise<Character> {
    character.permissions = [
      PermissionKey.ViewOwnUser,
      PermissionKey.CreateUser,
      PermissionKey.UpdateOwnUser,
      PermissionKey.DeleteOwnUser,
    ];
    if (await this.characterRepository.exists(character.email)) {
      throw new HttpErrors.BadRequest(`This email already exists`);
    } else {
      const savedCharacter = await this.characterRepository.create(character);
      //delete savedCharacter.password;
      return savedCharacter;
    }
  }

  //add
  /**
   * user login
   * @param credentials email and password
   */
  @post('/characters/login', {
    responses: {
      '200': {
        description: 'Token',
        content: {},
      },
    },
  })
  async login(@requestBody() credential: Credential): Promise<{token: string}> {
    const token = await this.jwtService.getToken(credential);
    return {token};
  }

  @get('/characters/me', {
    responses: {
      '200': {
        description: 'The current user profile',
        content: {
          'application/json': {
            schema: UserProfileSchema,
          },
        },
      },
    },
  })
  //@authenticate('jwt', {"required": [PermissionKey.ViewOwnUser]})
  @authenticate('jwt')
  async printCurrentUser(): Promise<MyUserProfile> {
    return this.getCurrentUser();
  }

  /**
   * show current character
   */
  @get('/characters', {
    responses: {
      '200': {
        description: 'Character model instance',
        content: {'application/json': {schema: {'x-ts-type': Character}}},
      },
    },
  })
  //@authenticate('jwt', {"required": [PermissionKey.ViewOwnUser]})
  @authenticate('jwt')
  async findById(): Promise<Character> {
    const currentUser = await this.getCurrentUser();
    return this.characterRepository.findById(currentUser.email);
  }

  /**
   * delete current character
   */
  @del('/characters', {
    responses: {
      '204': {
        description: 'Character DELETE success',
      },
    },
  })
  //@authenticate('jwt', {"required": [PermissionKey.DeleteOwnUser]})
  @authenticate('jwt')
  async deleteById(): Promise<void> {
    const currentUser = await this.getCurrentUser();
    //delete weapon, armor, and skill
    await this.characterRepository.weapon(currentUser.email).delete();
    await this.characterRepository.armor(currentUser.email).delete();
    await this.characterRepository.skill(currentUser.email).delete();
    ///
    await this.characterRepository.deleteById(currentUser.email);
  }
}
