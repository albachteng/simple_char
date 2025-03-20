import { Button } from '@mantine/core'
import { Dispatch, SetStateAction } from 'react'
import { Stat } from '../types'

type PickProps = {
    setter: Dispatch<SetStateAction<null | Stat>>
    value: 'high' | 'mid'
}

export function Picker({setter, value}: PickProps) {

    const highOrLow = value === 'high' ? 'primary' : 'secondary'
    return (
        <div className="card">
            <h1>{`Pick your ${highOrLow} stat`}</h1>
            {value === 'high' && <p>primary score is 16 or +3</p>}
            {value === 'mid' && <p>secondary score is 10 or +0</p>}
        <h3>
          {" "}<Button onClick={() => setter("str")}>STR {highOrLow}?</Button>
        </h3>
        <h3>
          {" "}<Button onClick={() => setter("dex")}>DEX {highOrLow}?</Button>
        </h3>
        <h3>
          {" "}<Button onClick={() => setter("int")}>INT {highOrLow}?</Button>
        </h3>
        </div>
)};