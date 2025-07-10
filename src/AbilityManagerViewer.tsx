import { Paper, Text, Stack, Accordion } from '@mantine/core'
import { AbilityManager, AbilityType, LearnedAbility } from './abilities/AbilityManager'
import { LearnAbilitySection } from './components/LearnAbilitySection'
import { RacialAbilitiesSection } from './components/RacialAbilitiesSection'
import { SpellcastingSection } from './components/SpellcastingSection'
import { CombatManeuversSection } from './components/CombatManeuversSection'
import { FinesseAbilitiesSection } from './components/FinesseAbilitiesSection'

interface AbilityManagerViewerProps {
  abilityManager: AbilityManager
  abilities: string[] // racial abilities
  hasSpellcasting: boolean
  hasCombatManeuvers: boolean
  hasFinesse: boolean
  str: number
  dex: number
  int: number
  sorcery_points: number
  max_sorcery_points: number
  combat_maneuvers: number
  max_combat_maneuvers: number
  finesse_points: number
  max_finesse_points: number
  onAbilityChange: () => void
  // Resource spending functions
  spendSorceryPoint?: () => boolean
  spendCombatManeuverPoint?: () => boolean
}


export function AbilityManagerViewer({ 
  abilityManager,
  abilities,
  hasSpellcasting, 
  hasCombatManeuvers,
  hasFinesse,
  str,
  dex,
  int,
  sorcery_points,
  max_sorcery_points,
  combat_maneuvers,
  max_combat_maneuvers,
  finesse_points,
  max_finesse_points,
  onAbilityChange,
  spendSorceryPoint,
  spendCombatManeuverPoint
}: AbilityManagerViewerProps) {
  
  // Determine which ability types are available
  const availableTypes: AbilityType[] = []
  if (hasSpellcasting) {
    availableTypes.push('metamagic', 'spellword')
  }
  if (hasCombatManeuvers) {
    availableTypes.push('combat_maneuver')
  }

  // Get learned abilities from the manager
  const learnedMetamagic = abilityManager.getAbilitiesByType('metamagic')
  const learnedSpellwords = abilityManager.getAbilitiesByType('spellword')
  const learnedManeuvers = abilityManager.getAbilitiesByType('combat_maneuver')

  // Show spellcasting if character has spellcasting capability
  const showSpellcasting = hasSpellcasting
  // Show combat maneuvers if character can use them
  const showCombatManeuvers = hasCombatManeuvers

  // Don't render if no abilities of any kind
  if (abilities.length === 0 && !showSpellcasting && !showCombatManeuvers && !hasFinesse && availableTypes.length === 0) {
    return null
  }

  const handleLearnAbility = (type: AbilityType, ability: string) => {
    const success = abilityManager.learnAbility(ability, type)
    if (success) {
      onAbilityChange()
    }
  }

  const handleForgetAbility = (ability: LearnedAbility) => {
    const success = abilityManager.forgetAbility(ability.name, ability.type)
    if (success) {
      onAbilityChange()
    }
  }

  const getAvailableAbilities = (type: AbilityType): string[] => {
    return abilityManager.getAvailableAbilities(type)
  }

  return (
    <Paper p="md" withBorder style={{ marginTop: '16px' }}>
      <Stack gap="md">
        <Text size="lg" fw={600}>Special Abilities</Text>
        
        <LearnAbilitySection 
          availableTypes={availableTypes}
          onLearnAbility={handleLearnAbility}
          getAvailableAbilities={getAvailableAbilities}
        />
        
        <Accordion multiple defaultValue={['racial']}>
          <RacialAbilitiesSection abilities={abilities} />
          
          {showSpellcasting && (
            <SpellcastingSection 
              int={int}
              sorcery_points={sorcery_points}
              max_sorcery_points={max_sorcery_points}
              learnedSpellwords={learnedSpellwords}
              learnedMetamagic={learnedMetamagic}
              onForgetAbility={handleForgetAbility}
              spendSorceryPoint={spendSorceryPoint}
            />
          )}
          
          {showCombatManeuvers && (
            <CombatManeuversSection 
              str={str}
              combat_maneuvers={combat_maneuvers}
              max_combat_maneuvers={max_combat_maneuvers}
              learnedManeuvers={learnedManeuvers}
              onForgetAbility={handleForgetAbility}
              spendCombatManeuverPoint={spendCombatManeuverPoint}
            />
          )}
          
          {hasFinesse && (
            <FinesseAbilitiesSection 
              dex={dex}
              finesse_points={finesse_points}
              max_finesse_points={max_finesse_points}
            />
          )}
        </Accordion>
      </Stack>
    </Paper>
  )
}