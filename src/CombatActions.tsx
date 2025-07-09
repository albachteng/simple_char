import { useState } from 'react'
import { Paper, Text, Stack, Group, Button, Badge, Alert } from '@mantine/core'
import { useChar } from './useChar'

interface CombatActionsProps {
  char: ReturnType<typeof useChar>['char']
  sneakAttackMainHand: ReturnType<typeof useChar>['sneakAttackMainHand']
  sneakAttackOffHand: ReturnType<typeof useChar>['sneakAttackOffHand']
  assassinationMainHand: ReturnType<typeof useChar>['assassinationMainHand']
  assassinationOffHand: ReturnType<typeof useChar>['assassinationOffHand']
  canPerformFinesseAttacks: ReturnType<typeof useChar>['canPerformFinesseAttacks']
  rest: ReturnType<typeof useChar>['rest']
  finesse_points: number
}

interface CombatResult {
  type: 'attack' | 'damage' | 'sneak-attack' | 'assassination' | 'rest'
  weapon?: 'main-hand' | 'off-hand'
  result: number
  breakdown: string
  timestamp: number
}

export function CombatActions({ 
  char, 
  sneakAttackMainHand, 
  sneakAttackOffHand, 
  assassinationMainHand, 
  assassinationOffHand, 
  canPerformFinesseAttacks, 
  rest, 
  finesse_points 
}: CombatActionsProps) {
  const [lastResult, setLastResult] = useState<CombatResult | null>(null)

  // Get equipped weapons info using the correct method
  const equippedWeapons = char.inventory.getEquippedWeapons()
  const mainHandWeapon = equippedWeapons.mainHand
  const offHandWeapon = equippedWeapons.offHand

  const calculateAttackRollWithBreakdown = (hand: 'main-hand' | 'off-hand') => {
    const weapon = hand === 'main-hand' ? mainHandWeapon : offHandWeapon
    if (!weapon) return { result: 0, breakdown: 'No weapon equipped' }

    // Get weapon stats and calculate components
    const weaponStat = weapon.weaponType === 'finesse' || weapon.weaponType === 'ranged' ? 'dex' :
                       weapon.weaponType === 'staff' ? 'int' : 'str'
    const statValue = char.getEffectiveStats()[weaponStat]
    const statMod = Math.floor((statValue - 10) / 2)
    const level = char.lvl
    const enchantment = weapon.enchantmentLevel || 0
    
    // Calculate the actual roll (this will use dice settings)
    const totalResult = hand === 'main-hand' ? char.mainHandAttackRoll() : char.offHandAttackRoll()
    
    // Calculate the d20 component by working backwards
    let d20Roll = totalResult - statMod - enchantment
    if (hand === 'main-hand') {
      d20Roll -= level
    }
    
    // Build breakdown string
    let breakdown = `${d20Roll} (1d20)`
    breakdown += ` + ${statMod} (${weaponStat.toUpperCase()} modifier)`
    if (hand === 'main-hand') {
      breakdown += ` + ${level} (level)`
    }
    if (enchantment > 0) {
      breakdown += ` + ${enchantment} (enchantment)`
    } else if (enchantment < 0) {
      breakdown += ` - ${Math.abs(enchantment)} (cursed)`
    }
    
    return { result: totalResult, breakdown }
  }

  const calculateDamageRollWithBreakdown = (hand: 'main-hand' | 'off-hand') => {
    const weapon = hand === 'main-hand' ? mainHandWeapon : offHandWeapon
    if (!weapon) return { result: 0, breakdown: 'No weapon equipped' }

    // Get weapon stats and calculate components
    const weaponStat = weapon.weaponType === 'finesse' || weapon.weaponType === 'ranged' ? 'dex' :
                       weapon.weaponType === 'staff' ? 'int' : 'str'
    const statValue = char.getEffectiveStats()[weaponStat]
    const statMod = Math.floor((statValue - 10) / 2)
    const enchantment = weapon.enchantmentLevel || 0
    
    // Get weapon die size
    const weaponDie = weapon.weaponType === 'two-hand' ? 12 :
                      weapon.weaponType === 'one-hand' ? 8 :
                      weapon.weaponType === 'finesse' || weapon.weaponType === 'ranged' ? 6 :
                      weapon.weaponType === 'staff' ? 4 : 1
    
    // Calculate the actual roll
    const totalResult = hand === 'main-hand' ? char.mainHandDamageRoll() : char.offHandDamageRoll()
    
    // Calculate the die component by working backwards
    let dieRoll = totalResult - enchantment
    if (hand === 'main-hand') {
      dieRoll -= statMod
    }
    
    // Build breakdown string
    let breakdown = `${dieRoll} (1d${weaponDie})`
    if (hand === 'main-hand') {
      breakdown += ` + ${statMod} (${weaponStat.toUpperCase()} modifier)`
    }
    if (enchantment > 0) {
      breakdown += ` + ${enchantment} (enchantment)`
    } else if (enchantment < 0) {
      breakdown += ` - ${Math.abs(enchantment)} (cursed)`
    }
    
    return { result: totalResult, breakdown }
  }

  const handleAttackRoll = (hand: 'main-hand' | 'off-hand') => {
    const { result, breakdown } = calculateAttackRollWithBreakdown(hand)
    setLastResult({
      type: 'attack',
      weapon: hand,
      result,
      breakdown,
      timestamp: Date.now()
    })
  }

  const handleDamageRoll = (hand: 'main-hand' | 'off-hand') => {
    const { result, breakdown } = calculateDamageRollWithBreakdown(hand)
    setLastResult({
      type: 'damage',
      weapon: hand,
      result,
      breakdown,
      timestamp: Date.now()
    })
  }

  const handleSneakAttack = (hand: 'main-hand' | 'off-hand') => {
    const { result, breakdown } = hand === 'main-hand' ? sneakAttackMainHand() : sneakAttackOffHand()
    setLastResult({
      type: 'sneak-attack',
      weapon: hand,
      result,
      breakdown,
      timestamp: Date.now()
    })
  }

  const handleAssassination = (hand: 'main-hand' | 'off-hand') => {
    const { result, breakdown } = hand === 'main-hand' ? assassinationMainHand() : assassinationOffHand()
    setLastResult({
      type: 'assassination',
      weapon: hand,
      result,
      breakdown,
      timestamp: Date.now()
    })
  }

  const handleRest = () => {
    rest()
    setLastResult({
      type: 'rest',
      result: 0,
      breakdown: 'All resources restored to maximum',
      timestamp: Date.now()
    })
  }

  // Don't show combat actions if no weapons equipped
  if (!mainHandWeapon && !offHandWeapon) {
    return null
  }

  return (
    <Paper p="md" withBorder style={{ marginTop: '16px' }}>
      <Stack gap="md">
        <Text size="lg" fw={600}>Combat Actions</Text>
        
        {lastResult && (
          <Alert 
            color={
              lastResult.type === 'attack' ? 'blue' : 
              lastResult.type === 'damage' ? 'red' : 
              lastResult.type === 'sneak-attack' ? 'orange' : 
              lastResult.type === 'assassination' ? 'violet' : 
              'green'
            } 
            withCloseButton 
            onClose={() => setLastResult(null)}
          >
            <Stack gap="xs">
              <Group>
                <Text fw={600}>
                  {lastResult.type === 'rest' ? 'Rest' : 
                   `${lastResult.weapon} ${
                     lastResult.type === 'attack' ? 'Attack Roll' : 
                     lastResult.type === 'damage' ? 'Damage Roll' : 
                     lastResult.type === 'sneak-attack' ? 'Sneak Attack' : 
                     'Assassination'
                   }`
                  }: 
                </Text>
                {lastResult.type !== 'rest' && (
                  <Badge 
                    size="lg" 
                    color={
                      lastResult.type === 'attack' ? 'blue' : 
                      lastResult.type === 'damage' ? 'red' : 
                      lastResult.type === 'sneak-attack' ? 'orange' : 
                      'violet'
                    }
                  >
                    {lastResult.result}
                  </Badge>
                )}
              </Group>
              <Text size="sm" c="dimmed" style={{ fontFamily: 'monospace' }}>
                {lastResult.breakdown}
              </Text>
            </Stack>
          </Alert>
        )}

        {/* Main-hand weapon actions */}
        {mainHandWeapon && (
          <Stack gap="sm">
            <Group justify="space-between" align="center">
              <div>
                <Text fw={500}>Main-hand: {mainHandWeapon.name}</Text>
                <Text size="sm" c="dimmed">
                  {mainHandWeapon.weaponType} weapon
                  {mainHandWeapon.enchantmentLevel > 0 && ` +${mainHandWeapon.enchantmentLevel}`}
                </Text>
              </div>
              <Group gap="xs">
                <Button 
                  size="sm" 
                  variant="outline" 
                  color="blue"
                  onClick={() => handleAttackRoll('main-hand')}
                >
                  Attack Roll
                </Button>
                <Button 
                  size="sm" 
                  variant="outline" 
                  color="red"
                  onClick={() => handleDamageRoll('main-hand')}
                >
                  Damage Roll
                </Button>
                {canPerformFinesseAttacks() && (
                  <>
                    <Button 
                      size="sm" 
                      variant="outline" 
                      color="orange"
                      onClick={() => handleSneakAttack('main-hand')}
                      disabled={finesse_points <= 0}
                    >
                      Sneak Attack ({finesse_points > 0 ? finesse_points - 1 : 0}d8)
                    </Button>
                    <Button 
                      size="sm" 
                      variant="outline" 
                      color="violet"
                      onClick={() => handleAssassination('main-hand')}
                      disabled={finesse_points <= 0}
                    >
                      Assassination ({finesse_points * 2}d8 crit)
                    </Button>
                  </>
                )}
              </Group>
            </Group>
          </Stack>
        )}

        {/* Off-hand weapon actions */}
        {offHandWeapon && (
          <Stack gap="sm">
            <Group justify="space-between" align="center">
              <div>
                <Text fw={500}>Off-hand: {offHandWeapon.name}</Text>
                <Text size="sm" c="dimmed">
                  {offHandWeapon.weaponType} weapon
                  {offHandWeapon.enchantmentLevel > 0 && ` +${offHandWeapon.enchantmentLevel}`}
                  {' • No level bonus (attack) • No stat bonus (damage)'}
                </Text>
              </div>
              <Group gap="xs">
                <Button 
                  size="sm" 
                  variant="outline" 
                  color="blue"
                  onClick={() => handleAttackRoll('off-hand')}
                >
                  Attack Roll
                </Button>
                <Button 
                  size="sm" 
                  variant="outline" 
                  color="red"
                  onClick={() => handleDamageRoll('off-hand')}
                >
                  Damage Roll
                </Button>
                {canPerformFinesseAttacks() && (
                  <>
                    <Button 
                      size="sm" 
                      variant="outline" 
                      color="orange"
                      onClick={() => handleSneakAttack('off-hand')}
                      disabled={finesse_points <= 0}
                    >
                      Sneak Attack ({finesse_points > 0 ? finesse_points : 0}d8)
                    </Button>
                    <Button 
                      size="sm" 
                      variant="outline" 
                      color="violet"
                      onClick={() => handleAssassination('off-hand')}
                      disabled={finesse_points <= 0}
                    >
                      Assassination ({finesse_points * 2}d8 crit)
                    </Button>
                  </>
                )}
              </Group>
            </Group>
          </Stack>
        )}

        {/* Rest button */}
        <Group justify="center">
          <Button 
            size="sm" 
            variant="outline" 
            color="green"
            onClick={handleRest}
          >
            Rest (Restore All Resources)
          </Button>
        </Group>

        {/* Combat information */}
        <Text size="xs" c="dimmed">
          Attack rolls: d20 + stat modifier + level (main-hand only)
          <br />
          Damage rolls: weapon die + stat modifier (main-hand only)
          <br />
          Sneak attacks: normal damage + finesse points d8, costs 1 finesse point
          <br />
          Assassination: critical hit (doubled dice) + finesse points d8, no cost
        </Text>
      </Stack>
    </Paper>
  )
}
