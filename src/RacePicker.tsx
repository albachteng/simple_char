import { Button } from '@mantine/core'
import { Dispatch, SetStateAction } from 'react'
import { Race } from '../types'
import { RACIAL_BONUS } from '../constants'

type RacePickerProps = {
    setter: Dispatch<SetStateAction<Race | null>>
}

export function RacePicker({ setter }: RacePickerProps) {
    const races: Race[] = ["elf", "gnome", "human", "dwarf", "dragonborn", "halfling"]

    return (
        <div className="card" style={{display: 'flex', flexDirection: 'column', alignItems: 'space-around' }}>
            <h1>Choose Your Race</h1>
            <p>Each race provides unique stat bonuses and a special ability</p>
            
            {races.map(race => {
                const raceData = RACIAL_BONUS[race]
                const bonusDescription = raceData.bonus.map(b => 
                    `+${b.plus} ${b.stat.toUpperCase()}`
                ).join(", ")
                
                return (
                    <div key={race} style={{ display: 'flex', alignItems: 'center', justifyItems: 'center', justifySelf: 'center', margin: '16px 0' }}>
                        <h3>
                            <Button 
                                onClick={() => setter(race)}
                                size="lg"
                                style={{ marginRight: '12px' }}
                            >
                                {race.charAt(0).toUpperCase() + race.slice(1)}
                            </Button>
                        </h3>
                        <p style={{ 
                            fontSize: '14px', 
                            color: '#bbb', 
                            margin: '4px 0 0 0',
                            textAlign: 'center'
                        }}>
                            <strong>Bonuses:</strong> {bonusDescription}<br/>
                            <strong>Ability:</strong> {raceData.ability}
                        </p>
                    </div>
                )
            })}
        </div>
    )
}
