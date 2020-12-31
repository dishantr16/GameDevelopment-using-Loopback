import {
  Count,
  CountSchema,
  Filter,
  repository,
  Where,
} from '@loopback/repository';
import {
  post,
  param,
  get,
  getFilterSchemaFor,
  getWhereSchemaFor,
  patch,
  del,
  requestBody,
} from '@loopback/rest';
//import {inject} from '@loopback/core';
import {Character} from '../models';
import {CharacterRepository} from '../repositories';
import {HttpErrors} from '@loopback/rest';
import {PermissionKey} from '../authorization';
import {authenticate} from '@loopback/authentication';

export class AdminController {
  constructor(
    @repository(CharacterRepository)
    public characterRepository: CharacterRepository,
  ) {}

  @post('/admin', {
    responses: {
      '200': {
        description: 'create admin',
        content: {'application/json': {schema: {'x-ts-type': Character}}},
      },
    },
  })
  async create(
    @param.query.string('admin_code') admin_code: string,
    @requestBody() character: Character,
  ): Promise<Character> {
    if (admin_code !== '901029') {
      throw new HttpErrors.Forbidden('WRONG_ADMIN_CODE');
    }

    character.permissions = [
      PermissionKey.ViewOwnUser,
      PermissionKey.CreateUser,
      PermissionKey.UpdateOwnUser,
      PermissionKey.DeleteOwnUser,
      PermissionKey.UpdateAnyUser,
      PermissionKey.ViewAnyUser,
      PermissionKey.DeleteAnyUser,
    ];
    if (await this.characterRepository.exists(character.email)) {
      throw new HttpErrors.BadRequest(`This email already exists`);
    } else {
      const savedCharacter = await this.characterRepository.create(character);
      //delete savedCharacter.password;
      return savedCharacter;
    }
  }

  /**
   * count character
   * @param where filter
   */
  @get('/admin/characters/count', {
    responses: {
      '200': {
        description: 'Character model count',
        content: {'application/json': {schema: CountSchema}},
      },
    },
  })
  // @authenticate('jwt', {"required": [PermissionKey.ViewAnyUser]})
  async count(
    @param.query.object('where', getWhereSchemaFor(Character))
    where?: Where<Character>,
  ): Promise<Count> {
    return this.characterRepository.count(where);
  }

  /**
   * show all character
   * @param where filter
   */
  @get('/admin/characters', {
    responses: {
      '200': {
        description: 'Array of Character model instances',
        content: {
          'application/json': {
            schema: {type: 'array', items: {'x-ts-type': Character}},
          },
        },
      },
    },
  })
  // @authenticate('jwt', {"required": [PermissionKey.ViewAnyUser]})
  async find(
    @param.query.object('filter', getFilterSchemaFor(Character))
    filter?: Filter<Character>,
  ): Promise<Character[]> {
    return this.characterRepository.find(filter);
  }

  /**
   * path all character
   * @param where filter
   */
  @patch('/admin/characters', {
    responses: {
      '200': {
        description: 'Character PATCH success count',
        content: {'application/json': {schema: CountSchema}},
      },
    },
  })
  // @authenticate('jwt', {"required": [PermissionKey.ViewAnyUser, PermissionKey.UpdateAnyUser]})
  async updateAll(
    @requestBody() character: Character,
    @param.query.object('where', getWhereSchemaFor(Character))
    where?: Where<Character>,
  ): Promise<Count> {
    return this.characterRepository.updateAll(character, where);
  }

  /**
   * show character by email
   * @param email email
   */
  @get('/admin/characters/{email}', {
    responses: {
      '200': {
        description: 'Character model instance',
        content: {'application/json': {schema: {'x-ts-type': Character}}},
      },
    },
  })
  // @authenticate('jwt', {"required":[PermissionKey.ViewAnyUser]})
  @authenticate('jwt')
  async findById(
    @param.path.string('email') email: string,
  ): Promise<Character> {
    return this.characterRepository.findById(email);
  }

  /**
   * patch character by email
   * @param where filter
   */
  @patch('/admin/characters/{email}', {
    responses: {
      '204': {
        description: 'Character PATCH success',
      },
    },
  })
  // @authenticate('jwt', {"required": [PermissionKey.ViewAnyUser, PermissionKey.UpdateAnyUser]})
  @authenticate('jwt')
  async updateById(
    @param.query.string('email') email: string,
    @requestBody() character: Character,
  ): Promise<void> {
    await this.characterRepository.updateById(email, character);
  }

  /**
   * delete character by email
   */
  @del('/admin/characters/{email}', {
    responses: {
      '204': {
        description: 'Character DELETE success',
      },
    },
  })
  //@authenticate('jwt', {"required": [PermissionKey.ViewAnyUser, PermissionKey.DeleteAnyUser]})
  @authenticate('jwt')
  async deleteById(@param.path.string('email') email: string): Promise<void> {
    //delete weapon, armor, and skill
    await this.characterRepository.weapon(email).delete();
    await this.characterRepository.armor(email).delete();
    await this.characterRepository.skill(email).delete();
    ///
    await this.characterRepository.deleteById(email);
  }
}
