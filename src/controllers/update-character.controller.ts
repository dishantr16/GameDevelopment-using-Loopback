import {Filter, repository} from '@loopback/repository';
import {get, patch, del, requestBody} from '@loopback/rest';
import {Character, Armor, Weapon, Skill} from '../models';
import {
  CharacterRepository,
  WeaponRepository,
  ArmorRepository,
  SkillRepository,
} from '../repositories';
//add
import {inject, Getter} from '@loopback/core';
import {MyUserProfile} from '../authorization';
import {authenticate, AuthenticationBindings} from '@loopback/authentication';

interface NewChar {
  name: string;
  gear: Gear;
}

interface Gear {
  weapon: Weapon;
  armor: Armor;
  skill: Skill;
}

export class UpdateCharacterController {
  constructor(
    @repository(CharacterRepository)
    public characterRepository: CharacterRepository,
    @repository(WeaponRepository)
    public weaponRepository: WeaponRepository,
    @repository(ArmorRepository)
    public armorRepository: ArmorRepository,
    @repository(SkillRepository)
    public skillRepository: SkillRepository,
    //
    @inject.getter(AuthenticationBindings.CURRENT_USER)
    public getCurrentUser: Getter<MyUserProfile>,
  ) {}

  /**
   * get armor, weapon, and skill info for current user
   */
  @get('/updatecharacter', {
    responses: {
      '200': {
        description: 'armor, weapon, and skill info',
        content: {},
      },
    },
  })
  @authenticate('jwt')
  async findById(): Promise<any[]> {
    const currentUser = await this.getCurrentUser();
    const res: any[] = ['no weapon', 'no armor', 'no skill'];

    const wfilter: Filter<Weapon> = {where: {characterId: currentUser.email}};
    if ((await this.weaponRepository.find(wfilter))[0] !== undefined) {
      res[0] = await this.characterRepository.weapon(currentUser.email).get();
    }
    const afilter: Filter<Armor> = {where: {characterId: currentUser.email}};
    if ((await this.armorRepository.find(afilter))[0] !== undefined) {
      res[1] = await this.characterRepository.armor(currentUser.email).get();
    }
    const sfilter: Filter<Skill> = {where: {characterId: currentUser.email}};
    if ((await this.skillRepository.find(sfilter))[0] !== undefined) {
      res[2] = await this.characterRepository.skill(currentUser.email).get();
    }
    return res;
  }

  /**
   * levelup for a current character
   */
  @patch('/updatecharacter/levelup', {
    responses: {
      '200': {
        description: 'level up',
        content: {'application/json': {schema: Character}},
      },
    },
  })
  @authenticate('jwt')
  async levelUp(): Promise<Character> {
    const currentUser = await this.getCurrentUser();
    const char: Character = await this.characterRepository.findById(
      currentUser.email,
    );
    let levels = 0;
    while (char.currentExp! >= char.nextLevelExp!) {
      levels++;
      char.currentExp! -= char.nextLevelExp!;
      char.nextLevelExp! += 100;
    }
    char.level! += levels;
    char.maxHealth! += 10 * levels;
    char.currentHealth! = char.maxHealth!;
    char.maxMana! += 5 * levels;
    char.currentMana! = char.maxMana!;
    char.attack! += 3 * levels;
    char.defence! += levels;
    await this.characterRepository!.updateById(currentUser.email, char);
    return char;
  }

  @patch('/updatecharacter/initCharacter', {
    responses: {
      '200': {
        description: 'initCharacter',
        content: {},
      },
    },
  })
  @authenticate('jwt')
  async initCharacter(@requestBody() newChar: NewChar): Promise<NewChar> {
    const currentUser = await this.getCurrentUser();
    //equip new weapon
    const char: Character = await this.characterRepository.findById(
      currentUser.email,
    );
    console.log(newChar);
    char.attack! += newChar.gear.weapon.attack!;
    char.defence! += newChar.gear.weapon.defence!;
    char.attack! += newChar.gear.armor.attack!;
    char.defence! += newChar.gear.armor.defence!;
    char.name = newChar.name;
    await this.characterRepository.updateById(currentUser.email, char);
    //console.log(await this.characterRepository.findById(currentUser.email));
    await this.characterRepository
      .weapon(currentUser.email)
      .create(newChar.gear.weapon);
    await this.characterRepository
      .armor(currentUser.email)
      .create(newChar.gear.armor);
    await this.characterRepository
      .skill(currentUser.email)
      .create(newChar.gear.skill);
    return newChar;
  }

  /**
   * update weapon for current character
   * @param weapon weapon
   */
  @patch('/updatecharacter/weapon', {
    responses: {
      '200': {
        description: 'update weapon',
        content: {'application/json': {schema: Weapon}},
      },
    },
  })
  @authenticate('jwt')
  async updateWeapon(@requestBody() weapon: Weapon): Promise<Weapon> {
    const currentUser = await this.getCurrentUser();
    //equip new weapon
    const char: Character = await this.characterRepository.findById(
      currentUser.email,
    );
    char.attack! += weapon.attack;
    char.defence! += weapon.defence;

    //unequip old weapon
    const filter: Filter<Weapon> = {where: {characterId: currentUser.email}};
    if ((await this.weaponRepository.find(filter))[0] !== undefined) {
      const oldWeapon: Weapon = await this.characterRepository
        .weapon(currentUser.email)
        .get();
      char.attack! -= oldWeapon.attack;
      char.defence! -= oldWeapon.defence;
      await this.characterRepository.weapon(currentUser.email).delete();
    }
    await this.characterRepository.updateById(currentUser.email, char);
    return this.characterRepository.weapon(currentUser.email).create(weapon);
  }

  /**
   * update armor for current character
   * @param armor armor
   */
  @patch('/updatecharacter/armor', {
    responses: {
      '200': {
        description: 'update armor',
        content: {'application/json': {schema: Armor}},
      },
    },
  })
  @authenticate('jwt')
  async updateArmor(@requestBody() armor: Armor): Promise<Armor> {
    const currentUser = await this.getCurrentUser();
    //equip new armor
    const char: Character = await this.characterRepository.findById(
      currentUser.email,
    );
    char.attack! += armor.attack;
    char.defence! += armor.defence;

    //unequip old armor
    const filter: Filter<Armor> = {where: {characterId: currentUser.email}};
    if ((await this.armorRepository.find(filter))[0] !== undefined) {
      const oldArmor: Armor = await this.characterRepository
        .armor(currentUser.email)
        .get();
      char.attack! -= oldArmor.attack;
      char.defence! -= oldArmor.defence;
      await this.characterRepository.armor(currentUser.email).delete();
    }
    await this.characterRepository.updateById(currentUser.email, char);
    return this.characterRepository.armor(currentUser.email).create(armor);
  }

  /**
   * update skill for current character
   * @param skill skill
   */
  @patch('/updatecharacter/skill', {
    responses: {
      '200': {
        description: 'update skill',
        content: {'application/json': {schema: Skill}},
      },
    },
  })
  @authenticate('jwt')
  async updateSkill(@requestBody() skill: Skill): Promise<Skill> {
    const currentUser = await this.getCurrentUser();
    await this.characterRepository.skill(currentUser.email).delete();
    return this.characterRepository.skill(currentUser.email).create(skill);
  }

  /**
   * delete weapon for current character
   */
  @del('/updatecharacter/weapon', {
    responses: {
      '204': {
        description: 'DELETE Weapon',
      },
    },
  })
  @authenticate('jwt')
  async deleteWeapon(): Promise<void> {
    const currentUser = await this.getCurrentUser();
    //unequip old weapon
    const filter: Filter<Weapon> = {where: {characterId: currentUser.email}};
    if ((await this.weaponRepository.find(filter))[0] !== undefined) {
      const oldWeapon: Weapon = await this.characterRepository
        .weapon(currentUser.email)
        .get();
      const char: Character = await this.characterRepository.findById(
        currentUser.email,
      );
      char.attack! -= oldWeapon.attack;
      char.defence! -= oldWeapon.defence;
      await this.characterRepository.weapon(currentUser.email).delete();
      await this.characterRepository.updateById(currentUser.email, char);
    }
  }

  /**
   * delete armor for current character
   */
  @del('/updatecharacter/armor', {
    responses: {
      '204': {
        description: 'DELETE Armor',
      },
    },
  })
  @authenticate('jwt')
  async deleteArmor(): Promise<void> {
    const currentUser = await this.getCurrentUser();
    //unequip old armor
    const filter: Filter<Armor> = {where: {characterId: currentUser.email}};
    if ((await this.armorRepository.find(filter))[0] !== undefined) {
      const oldArmor: Armor = await this.characterRepository
        .armor(currentUser.email)
        .get();
      const char: Character = await this.characterRepository.findById(
        currentUser.email,
      );
      char.attack! -= oldArmor.attack;
      char.defence! -= oldArmor.defence;
      await this.characterRepository.armor(currentUser.email).delete();
      await this.characterRepository.updateById(currentUser.email, char);
    }
  }

  /**
   * delete skill for current character
   */
  @del('/updatecharacter/skill', {
    responses: {
      '204': {
        description: 'DELETE Skill',
      },
    },
  })
  @authenticate('jwt')
  async deleteSkill(): Promise<void> {
    const currentUser = await this.getCurrentUser();
    await this.characterRepository.skill(currentUser.email).delete();
  }
}
