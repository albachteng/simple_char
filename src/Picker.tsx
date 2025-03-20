import { Button } from '@mantine/core'
import { Dispatch, SetStateAction } from 'react'
import { Stat } from '../types'

type PickProps = {
    setter: Dispatch<SetStateAction<null | Stat>>
    value: 'high' | 'mid'
}

export function Picker({setter, value}: PickProps) {

    return (
        <div className="card">
            <h1>{`Pick your ${value === 'high' ? 'primary' : 'secondary'} stat`}</h1>
            {value === 'high' && <p>primary score is 16 or +3</p>}
            {value === 'mid' && <p>secondary score is 10 or +0</p>}
        <h3>
          {" "}<Button onClick={() => setter("str")}>STR high?</Button>
        </h3>
        <h3>
          {" "}<Button onClick={() => setter("dex")}>DEX high?</Button>
        </h3>
        <h3>
          {" "}<Button onClick={() => setter("int")}>INT high?</Button>
        </h3>
        </div>
)};