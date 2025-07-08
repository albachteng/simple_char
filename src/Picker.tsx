import { Dispatch, SetStateAction } from 'react'
import { StatButtonGroup, createStatSelectionButtons } from './components/StatButtonGroup'
import { PickerSection } from './components/CharacterSection'
import { Stat } from '../types'

type PickProps = {
    setter: Dispatch<SetStateAction<null | Stat>>
    value: 'high' | 'mid'
}

export function Picker({setter, value}: PickProps) {
    const highOrLow = value === 'high' ? 'primary' : 'secondary'
    const subtitle = value === 'high' ? 'primary score is 16 or +3' : 'secondary score is 10 or +0'
    
    const buttonConfigs = createStatSelectionButtons(
        (stat) => setter(stat),
        `${highOrLow}?`
    );
    
    return (
        <PickerSection 
            title={`Pick your ${highOrLow} stat`}
            subtitle={subtitle}
        >
            <StatButtonGroup
                layout="vertical"
                wrapInHeadings={true}
                buttonConfigs={buttonConfigs}
            />
        </PickerSection>
)};