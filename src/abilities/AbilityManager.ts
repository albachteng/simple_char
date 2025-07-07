import { logger } from '../logger'
import { METAMAGIC, SPELLWORDS, COMBAT_MANEUVERS } from '../../constants'

export type AbilityType = 'metamagic' | 'spellword' | 'combat_maneuver'

export interface LearnedAbility {
  id: string
  name: string
  type: AbilityType
  description: string
  learnedAt?: number // level when learned
}

export class AbilityManager {
  private learnedAbilities: Map<string, LearnedAbility> = new Map()
  private storageKey = 'character_abilities'

  constructor() {
    this.loadAbilities()
  }

  // Add a new ability to the character's known abilities
  learnAbility(name: string, type: AbilityType, level?: number): boolean {
    const abilityId = `${type}_${name}`
    
    // Check if ability exists in the master lists
    if (!this.isValidAbility(name, type)) {
      logger.equipment(`Cannot learn unknown ability: ${name} (${type})`)
      return false
    }

    // Check if already learned
    if (this.learnedAbilities.has(abilityId)) {
      logger.equipment(`Ability already learned: ${name}`)
      return false
    }

    const ability: LearnedAbility = {
      id: abilityId,
      name,
      type,
      description: this.getAbilityDescription(name, type),
      learnedAt: level
    }

    this.learnedAbilities.set(abilityId, ability)
    this.saveAbilities()
    
    logger.equipment(`Learned new ability: ${name} (${type})`, {
      abilityId,
      type,
      level,
      totalAbilities: this.learnedAbilities.size
    })
    
    return true
  }

  // Remove an ability from the character's known abilities
  forgetAbility(name: string, type: AbilityType): boolean {
    const abilityId = `${type}_${name}`
    
    if (!this.learnedAbilities.has(abilityId)) {
      logger.equipment(`Cannot forget unknown ability: ${name}`)
      return false
    }

    this.learnedAbilities.delete(abilityId)
    this.saveAbilities()
    
    logger.equipment(`Forgot ability: ${name} (${type})`, {
      abilityId,
      type,
      remainingAbilities: this.learnedAbilities.size
    })
    
    return true
  }

  // Get all learned abilities of a specific type
  getAbilitiesByType(type: AbilityType): LearnedAbility[] {
    return Array.from(this.learnedAbilities.values())
      .filter(ability => ability.type === type)
      .sort((a, b) => a.name.localeCompare(b.name))
  }

  // Get all learned abilities
  getAllAbilities(): LearnedAbility[] {
    return Array.from(this.learnedAbilities.values())
      .sort((a, b) => {
        // Sort by type first, then by name
        if (a.type !== b.type) {
          return a.type.localeCompare(b.type)
        }
        return a.name.localeCompare(b.name)
      })
  }

  // Check if a specific ability is learned
  hasAbility(name: string, type: AbilityType): boolean {
    const abilityId = `${type}_${name}`
    return this.learnedAbilities.has(abilityId)
  }

  // Get count of learned abilities by type
  getAbilityCount(type?: AbilityType): number {
    if (!type) {
      return this.learnedAbilities.size
    }
    return this.getAbilitiesByType(type).length
  }

  // Get available abilities that haven't been learned yet
  getAvailableAbilities(type: AbilityType): string[] {
    const allAbilities = this.getMasterAbilityList(type)
    const learnedNames = this.getAbilitiesByType(type).map(a => a.name)
    return allAbilities.filter(name => !learnedNames.includes(name))
  }

  // Reset all learned abilities
  clearAllAbilities(): void {
    this.learnedAbilities.clear()
    this.saveAbilities()
    logger.equipment('Cleared all learned abilities')
  }

  // Private helper methods
  private isValidAbility(name: string, type: AbilityType): boolean {
    const masterList = this.getMasterAbilityList(type)
    return masterList.includes(name)
  }

  private getMasterAbilityList(type: AbilityType): string[] {
    switch (type) {
      case 'metamagic':
        return METAMAGIC
      case 'spellword':
        return SPELLWORDS
      case 'combat_maneuver':
        return COMBAT_MANEUVERS
      default:
        return []
    }
  }

  private getAbilityDescription(name: string, type: AbilityType): string {
    // Import descriptions from AbilityViewer
    const METAMAGIC_DESCRIPTIONS: { [key: string]: string } = {
      "Aura": "Area of effect is centered on you",
      "Cascade": "The spell overwhelms with rapid, repeated impacts",
      "Cloak": "Wreathe yourself in the spell's effects",
      "Distant": "Increase the range of the spell",
      "Empowered": "Increase spell damage or effect potency",
      "Glyph": "Inscribe a textual representation of the spell's effects",
      "Grasp": "Envelop, smother or secure the spell's powers",
      "Heighten": "Cast spell as if from a higher level",
      "Hypnotic": "Add a charm/mesmerizing effect to a spell",
      "Orb": "Shape spell into a floating orb that follows commands",
      "Orbit": "Create multiple smaller versions that circle the target",
      "Precise": "Spell automatically hits or has enhanced accuracy",
      "Quick": "Cast spell as a bonus action instead of full action",
      "Sculpt": "Shape or paint the area of effect precisely",
      "Subtle": "Cast without verbal or somatic components, provide nuance",
      "Twin": "Double, mirror or repeat",
      "Wall": "A barrier, a ledge or a fortress"
    }

    const SPELLWORD_DESCRIPTIONS: { [key: string]: string } = {
      "Chill": "Freeze or slow targets, create ice effects",
      "Confound": "Confuse enemies, scramble thoughts or senses",
      "Counterspell": "Cancel or redirect enemy magic",
      "Deafen": "Remove hearing, create zones of silence",
      "Flametongue": "Create and control fire effects",
      "Growth": "Increase size of objects or creatures",
      "Heat": "Create warmth, melt ice, cause fever",
      "Illusion": "Create false images or sounds",
      "Light": "Illuminate areas, create blinding flashes",
      "Mend": "Repair objects, heal minor wounds",
      "Push/Pull": "Move objects or creatures with force",
      "Rain": "Control weather, create water effects",
      "Reflect": "Bounce attacks or spells back at attackers",
      "Shadow": "Manipulate darkness and shadows",
      "Shield": "Create protective barriers",
      "Soothe": "Calm emotions, reduce pain or fear",
      "Spark": "Create electricity, power devices",
      "Thread": "Bind or connect objects and creatures",
      "Vision": "See distant places, reveal hidden things"
    }

    const MANEUVER_DESCRIPTIONS: { [key: string]: string } = {
      "Blinding": "Strike to temporarily blind opponent",
      "Cleave": "Hit multiple adjacent enemies with one attack",
      "Command": "Force enemy to follow a simple command",
      "Daring": "Gain advantage through risky maneuvers",
      "Disarming": "Remove weapon from enemy's grasp",
      "Enraged": "Enter fury state for increased damage",
      "Goading": "Force enemy to attack you instead of allies",
      "Grappling": "Grab and restrain an opponent",
      "Leaping": "Jump attack for extra damage and mobility",
      "Menace": "Intimidate enemies to reduce their effectiveness",
      "Precision": "Target weak points for extra damage",
      "Preparation": "Set up advantageous position for next attack",
      "Reckless": "All-out attack with increased risk and reward",
      "Riposte": "Counter-attack after successful defense",
      "Stampede": "Charge through multiple enemies",
      "Throw": "Hurl objects or enemies as weapons",
      "Trip": "Knock opponent prone"
    }

    switch (type) {
      case 'metamagic':
        return METAMAGIC_DESCRIPTIONS[name] || `A metamagic technique: ${name}`
      case 'spellword':
        return SPELLWORD_DESCRIPTIONS[name] || `A magical word of power: ${name}`
      case 'combat_maneuver':
        return MANEUVER_DESCRIPTIONS[name] || `A combat technique: ${name}`
      default:
        return `Unknown ability: ${name}`
    }
  }

  private saveAbilities(): void {
    try {
      const data = Array.from(this.learnedAbilities.values())
      localStorage.setItem(this.storageKey, JSON.stringify(data))
      logger.equipment('Saved learned abilities to localStorage', { count: data.length })
    } catch (error) {
      logger.equipment('Failed to save abilities to localStorage', { error })
    }
  }

  private loadAbilities(): void {
    try {
      const data = localStorage.getItem(this.storageKey)
      if (data) {
        const abilities: LearnedAbility[] = JSON.parse(data)
        this.learnedAbilities.clear()
        
        abilities.forEach(ability => {
          this.learnedAbilities.set(ability.id, ability)
        })
        
        logger.equipment('Loaded learned abilities from localStorage', { count: abilities.length })
      }
    } catch (error) {
      logger.equipment('Failed to load abilities from localStorage', { error })
      this.learnedAbilities.clear()
    }
  }
}