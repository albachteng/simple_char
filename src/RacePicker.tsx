import { Button, Group, Stack, Text } from '@mantine/core'
import { Dispatch, SetStateAction } from 'react'
import { PickerSection } from './components/CharacterSection'
import { Race } from '../types'
import { RACIAL_BONUS } from '../constants'

type RacePickerProps = {
    setter: Dispatch<SetStateAction<Race | null>>
}

export function RacePicker({ setter }: RacePickerProps) {
    const races: Race[] = ["elf", "gnome", "human", "dwarf", "dragonborn", "halfling"]

    return (
        <PickerSection 
            title="Choose Your Race"
            subtitle="Each race provides unique stat bonuses and a special ability"
        >
            <Stack gap="md">
                {races.map(race => {
                    const raceData = RACIAL_BONUS[race]
                    const bonusDescription = raceData.bonus.map(b => 
                        `+${b.plus} ${b.stat.toUpperCase()}`
                    ).join(", ")
                    
                    return (
                        <Group key={race} justify="center" align="center">
                            <Button 
                                onClick={() => setter(race)}
                                size="lg"
                            >
                                {race.charAt(0).toUpperCase() + race.slice(1)}
                            </Button>
                            <Text size="sm" c="dimmed" ta="center">
                                <strong>Bonuses:</strong> {bonusDescription}<br/>
                                <strong>Ability:</strong> {raceData.ability}
                            </Text>
                        </Group>
                    )
                })}
            </Stack>
        </PickerSection>
    )
}
