import {Entity, hasOne, model, property} from '@loopback/repository';
//import {v4 as uuid} from 'uuid';
import {Armor} from './armor.model';
import {Weapon} from './weapon.model';
import {Skill} from './skill.model';
import {PermissionKey} from '../authorization';

@model()
export class Character extends Entity {
  @property({
    type: 'string',
    id: true,
    required: true,
  })
  email?: string;

  @property({
    type: 'string',
    required: true,
  })
  password: string;

  @property.array(String)
  permissions: PermissionKey[];

  @property({
    type: 'string',
    required: true,
  })
  name: string;

  @property({
    type: 'number',
    required: true,
  })
  level: number;

  @property({
    type: 'number',
    required: true,
  })
  nextLevelExp: number;

  @property({
    type: 'number',
    required: true,
  })
  currentExp: number;

  @property({
    type: 'number',
    required: true,
  })
  maxHealth: number;

  @property({
    type: 'number',
    required: true,
  })
  currentHealth: number;

  @property({
    type: 'number',
    required: true,
  })
  maxMana: number;

  @property({
    type: 'number',
    required: true,
  })
  currentMana: number;

  @property({
    type: 'number',
    required: true,
  })
  attack: number;

  @property({
    type: 'number',
    required: true,
  })
  defence: number;

  @hasOne(() => Armor)
  armor?: Armor;

  @hasOne(() => Weapon)
  weapon?: Weapon;

  @hasOne(() => Skill)
  skill?: Skill;

  constructor(data?: Partial<Character>) {
    super(data);
  }
}

export interface CharacterRelations {
  // describe navigational properties here
}

export type CharacterWithRelations = Character & CharacterRelations;
