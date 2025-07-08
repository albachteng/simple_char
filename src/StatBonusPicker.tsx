import { StatButtonGroup, createBonusAllocationButtons } from './components/StatButtonGroup'
import { PickerSection } from './components/CharacterSection'
import { Stat } from '../types'

type StatBonusPickerProps = {
    setter: (stat: Stat) => void
    bonusAmount: number
    bonusNumber: number // which bonus is this (1st, 2nd, etc.)
}

export function StatBonusPicker({ setter, bonusAmount, bonusNumber }: StatBonusPickerProps) {
    const buttonConfigs = createBonusAllocationButtons(setter, bonusAmount);
    
    return (
        <PickerSection 
            title={`Choose Stat for Bonus #${bonusNumber}`}
            subtitle={`Apply +${bonusAmount} to which stat?`}
        >
            <StatButtonGroup
                layout="vertical"
                wrapInHeadings={true}
                buttonConfigs={buttonConfigs}
            />
        </PickerSection>
    )
}