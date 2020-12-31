import {
  DefaultCrudRepository,
  HasOneRepositoryFactory,
  repository,
} from '@loopback/repository';
import {Character, CharacterRelations, Armor, Weapon, Skill} from '../models';
import {MongoDataSource} from '../datasources';
import {inject} from '@loopback/core';
import {Getter} from '@loopback/core';
import {ArmorRepository} from './armor.repository';
import {WeaponRepository} from './weapon.repository';
import {SkillRepository} from './skill.repository';

export class CharacterRepository extends DefaultCrudRepository<
  Character,
  typeof Character.prototype.email,
  CharacterRelations
> {
  public armor: HasOneRepositoryFactory<
    Armor,
    typeof Character.prototype.email
  >;
  public weapon: HasOneRepositoryFactory<
    Weapon,
    typeof Character.prototype.email
  >;

  public skill: HasOneRepositoryFactory<
    Skill,
    typeof Character.prototype.email
  >;

  constructor(
    @inject('datasources.mongo') dataSource: MongoDataSource,
    @repository.getter(ArmorRepository)
    protected armorRepositoryGetter: Getter<ArmorRepository>,
    @repository.getter(WeaponRepository)
    protected weaponRepositoryGetter: Getter<WeaponRepository>,
    @repository.getter(SkillRepository)
    protected skillRepositoryGetter: Getter<SkillRepository>,
  ) {
    super(Character, dataSource);
    this.armor = this.createHasOneRepositoryFactoryFor(
      'armor',
      armorRepositoryGetter,
    );
    this.weapon = this.createHasOneRepositoryFactoryFor(
      'weapon',
      weaponRepositoryGetter,
    );
    this.skill = this.createHasOneRepositoryFactoryFor(
      'skill',
      skillRepositoryGetter,
    );
  }
}
