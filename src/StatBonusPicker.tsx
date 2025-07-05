import { Button } from '@mantine/core'
import { Stat } from '../types'

type StatBonusPickerProps = {
    setter: (stat: Stat) => void
    bonusAmount: number
    bonusNumber: number // which bonus is this (1st, 2nd, etc.)
}

export function StatBonusPicker({ setter, bonusAmount, bonusNumber }: StatBonusPickerProps) {
    return (
        <div className="card">
            <h1>Choose Stat for Bonus #{bonusNumber}</h1>
            <p>Apply +{bonusAmount} to which stat?</p>
            
            <h3>
                <Button onClick={() => setter("str")}>STR (+{bonusAmount})</Button>
            </h3>
            <h3>
                <Button onClick={() => setter("dex")}>DEX (+{bonusAmount})</Button>
            </h3>
            <h3>
                <Button onClick={() => setter("int")}>INT (+{bonusAmount})</Button>
            </h3>
        </div>
    )
}