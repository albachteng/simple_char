import { useEffect, useState } from 'react';
import './App.css'
import {mod, useChar} from './useChar'
import { Button } from '@mantine/core'
import {Picker} from './Picker'
import { Stat } from '../types';

function App() {

  const {
    char, 
    reset,
    level,
    hp, 
    ac, 
    str, 
    dex, 
    int,
    // shield,
    // armor,
    sorcery_points,
    combat_maneuvers,
    finesse_points,
  } = useChar()

  const [high, setHigh] = useState<null | Stat>(null);
  const [mid, setMid] = useState<null | Stat>(null);

  useEffect(() => {
    high && mid && reset(high, mid);
  }, [high, mid])

  return (
    !high ? <Picker value={'high'} setter={setHigh}/> : 
    !mid ? <Picker value={'mid'} setter={setMid}/> : 
    <div>
      <div></div>
      <h1>Name: Some Name</h1>
      <div className="card">
        <h3>LV: {level}</h3>
        <h3>HP: {hp}</h3>
        <h3>AC: {ac}</h3>
        <h3>Maneuvers: {combat_maneuvers}</h3>
        <h3>Finesse: {finesse_points}</h3>
        <h3>Sorcery: {sorcery_points}</h3>
        <h3>
          STR: {str} ({str >= 10 ? "+" : ""}{mod(str)}) 
          {" "}<Button onClick={() => char.level_up("str")}>Level STR</Button>
        </h3>
        <h3>
          DEX: {dex} ({dex >= 10 ? "+" : ""}{mod(dex)})
          {" "}<Button onClick={() => char.level_up("dex")}>Level DEX</Button>
        </h3>
        <h3>
          INT: {int} ({int >= 10 ? "+" : ""}{mod(int)})
          {" "}<Button onClick={() => char.level_up("int")}>Level INT</Button>
        </h3>
        {" "}<Button onClick={() => {
          setHigh(null);
          setMid(null);
        }}>Reset</Button>
      </div>
    </div>
  )
}

export default App
