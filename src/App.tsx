import { useEffect, useState } from 'react';
import './App.css'
import {mod, useChar} from './useChar'
import { Button } from '@mantine/core'
import {Picker} from './Picker'
import { RacePicker } from './RacePicker'
import { StatBonusPicker } from './StatBonusPicker'
import { AbilityViewer } from './AbilityViewer'
import { LogViewer } from './LogViewer'
import { Stat, Race } from '../types';
import { RACIAL_BONUS } from '../constants';

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
    race,
    abilities,
  } = useChar()

  const [high, setHigh] = useState<null | Stat>(null);
  const [mid, setMid] = useState<null | Stat>(null);
  const [selectedRace, setSelectedRace] = useState<null | Race>(null);
  const [racialBonuses, setRacialBonuses] = useState<Stat[]>([]);
  const [currentBonusIndex, setCurrentBonusIndex] = useState(0);

  // Calculate how many "any" bonuses need to be selected
  const getAnyBonusCount = (race: Race | null): number => {
    if (!race || !RACIAL_BONUS[race]) return 0;
    return RACIAL_BONUS[race].bonus.filter(b => b.stat === "any").length;
  }

  const anyBonusCount = getAnyBonusCount(selectedRace);
  const needsBonusSelection = selectedRace && currentBonusIndex < anyBonusCount;

  useEffect(() => {
    if (high && mid && selectedRace && !needsBonusSelection) {
      reset(high, mid, selectedRace, racialBonuses);
    }
  }, [high, mid, selectedRace, racialBonuses, needsBonusSelection])

  const handleBonusSelection = (stat: Stat) => {
    const newBonuses = [...racialBonuses, stat];
    setRacialBonuses(newBonuses);
    setCurrentBonusIndex(currentBonusIndex + 1);
  };

  const handleReset = () => {
    setHigh(null);
    setMid(null);
    setSelectedRace(null);
    setRacialBonuses([]);
    setCurrentBonusIndex(0);
  };

  return (
    <div className="app-container">
      {!high ? <Picker value={'high'} setter={setHigh}/> : 
       !mid ? <Picker value={'mid'} setter={setMid}/> : 
       !selectedRace ? <RacePicker setter={setSelectedRace}/> :
       needsBonusSelection ? (
         <StatBonusPicker 
           setter={handleBonusSelection}
           bonusAmount={RACIAL_BONUS[selectedRace].bonus.filter(b => b.stat === "any")[currentBonusIndex]?.plus || 1}
           bonusNumber={currentBonusIndex + 1}
         />
       ) :
       <>
         <div>
           <div></div>
           <h1>Name: Some Name</h1>
           <h2 style={{ color: '#bbb', fontSize: '16px' }}>
             {selectedRace?.charAt(0).toUpperCase() + selectedRace?.slice(1)} - Level {level}
           </h2>
           <div className="card">
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
             {" "}<Button onClick={handleReset}>Reset</Button>
           </div>
           <AbilityViewer abilities={abilities} />
         </div>
         <LogViewer />
       </>
      }
    </div>
  )
}

export default App
