import { useEffect, useState } from 'react';
import './App.css'
import {mod, useChar} from './useChar'
import { Button } from '@mantine/core'
import {Picker} from './Picker'
import { RacePicker } from './RacePicker'
import { StatBonusPicker } from './StatBonusPicker'
import { AbilityManagerViewer } from './AbilityManagerViewer'
import { LogViewer } from './LogViewer'
import { CharacterSaver } from './CharacterSaver'
import { CharacterLoader } from './CharacterLoader'
import { CharacterNameEditor } from './CharacterNameEditor'
import { InventoryViewer } from './InventoryViewer'
import { DiceSettingsPanel } from './DiceSettings'
import { StatOverrideControls } from './StatOverrideControls'
import { CombatActions } from './CombatActions'
import { NotesManager } from './NotesManager'
import { Stat, Race } from '../types';
import { RACIAL_BONUS } from '../constants';

function App() {

  const {
    char, 
    reset,
    loadCharacter,
    level,
    hp, 
    ac, 
    str, 
    dex, 
    int,
    originalStr,
    originalDex,
    originalInt,
    // shield,
    // armor,
    sorcery_points,
    max_sorcery_points,
    combat_maneuvers,
    max_combat_maneuvers,
    finesse_points,
    max_finesse_points,
    abilities,
    abilityManager,
    pending_level_up_points,
    start_level_up,
    allocate_point,
    isUsingStatOverrides,
    toggleStatOverrides,
    setStatOverride,
    getStatOverride,
  } = useChar()

  const [high, setHigh] = useState<null | Stat>(null);
  const [mid, setMid] = useState<null | Stat>(null);
  const [selectedRace, setSelectedRace] = useState<null | Race>(null);
  const [racialBonuses, setRacialBonuses] = useState<Stat[]>([]);
  const [currentBonusIndex, setCurrentBonusIndex] = useState(0);
  const [characterName, setCharacterName] = useState('');
  const [showLoader, setShowLoader] = useState(false);
  const [showSaver, setShowSaver] = useState(false);

  // Calculate how many "any" bonuses need to be selected
  const getAnyBonusCount = (race: Race | null): number => {
    if (!race || !RACIAL_BONUS[race]) return 0;
    return RACIAL_BONUS[race].bonus.filter(b => b.stat === "any").length;
  }

  const anyBonusCount = getAnyBonusCount(selectedRace);
  const needsBonusSelection = selectedRace && currentBonusIndex < anyBonusCount;

  // Track if we're in character creation mode vs loaded character mode
  const [isCharacterLoaded, setIsCharacterLoaded] = useState(false);

  useEffect(() => {
    // Only reset for new character creation, not for loaded characters
    if (high && mid && selectedRace && !needsBonusSelection && !isCharacterLoaded) {
      reset(high, mid, selectedRace, racialBonuses);
    }
  }, [high, mid, selectedRace, racialBonuses, needsBonusSelection, isCharacterLoaded])

  const handleBonusSelection = (stat: Stat) => {
    const newBonuses = [...racialBonuses, stat];
    setRacialBonuses(newBonuses);
    setCurrentBonusIndex(currentBonusIndex + 1);
  };

  const handleReset = () => {
    // Reset character to a new default character
    reset('str', 'dex');
    
    // Reset UI state
    setHigh(null);
    setMid(null);
    setSelectedRace(null);
    setRacialBonuses([]);
    setCurrentBonusIndex(0);
    setCharacterName('');
    setIsCharacterLoaded(false);
    setShowLoader(false);
    setShowSaver(false);
  };

  const handleLoadCharacter = (loadedChar: any, loadedHigh: Stat, loadedMid: Stat, loadedRacialBonuses: Stat[], name: string) => {
    // Use the actual loaded character instead of recreating it
    loadCharacter(loadedChar);
    
    // Set the UI state to match the loaded character
    setHigh(loadedHigh);
    setMid(loadedMid);
    setSelectedRace(loadedChar.race);
    setRacialBonuses(loadedRacialBonuses);
    setCurrentBonusIndex(loadedRacialBonuses.length);
    setCharacterName(name);
    setIsCharacterLoaded(true); // Mark as loaded character
    setShowLoader(false);
  };

  const handleInventoryChange = () => {
    // Sync equipment state when inventory changes
    char.syncEquipmentFromInventory();
    // Trigger UI update by emitting character update event
    char.triggerUpdate();
  };

  return (
    <div className="app-container">
      {showLoader ? (
        <CharacterLoader 
          onLoad={handleLoadCharacter} 
          onCancel={() => setShowLoader(false)}
        />
      ) : !high ? (
        <div>
          <Picker value={'high'} setter={setHigh}/>
          <div style={{ marginTop: '16px', textAlign: 'center' }}>
            <Button variant="outline" onClick={() => setShowLoader(true)}>
              Load Saved Character
            </Button>
          </div>
        </div>
      ) : 
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
           <CharacterNameEditor 
             name={characterName}
             onNameChange={setCharacterName}
           />
           <h2 style={{ color: '#bbb', fontSize: '16px' }}>
             {selectedRace?.charAt(0).toUpperCase() + selectedRace?.slice(1)} - Level {level}
           </h2>
           <div className="card">
             <h3>HP: {hp}</h3>
             <h3>AC: {ac}</h3>
             <h3>Maneuvers: {combat_maneuvers}</h3>
             <h3>Finesse: {finesse_points}</h3>
             <h3>Sorcery: {sorcery_points}</h3>
             {pending_level_up_points > 0 ? (
               <div style={{ marginBottom: '16px', padding: '12px', backgroundColor: '#2a2a2a', borderRadius: '8px' }}>
                 <h4 style={{ color: '#ffb347', margin: '0 0 8px 0' }}>
                   Level Up in Progress - {pending_level_up_points} point{pending_level_up_points !== 1 ? 's' : ''} remaining
                 </h4>
                 <div style={{ display: 'flex', gap: '8px' }}>
                   <Button 
                     size="sm" 
                     variant="outline" 
                     onClick={() => allocate_point("str")}
                     disabled={pending_level_up_points <= 0}
                   >
                     +1 STR
                   </Button>
                   <Button 
                     size="sm" 
                     variant="outline" 
                     onClick={() => allocate_point("dex")}
                     disabled={pending_level_up_points <= 0}
                   >
                     +1 DEX
                   </Button>
                   <Button 
                     size="sm" 
                     variant="outline" 
                     onClick={() => allocate_point("int")}
                     disabled={pending_level_up_points <= 0}
                   >
                     +1 INT
                   </Button>
                 </div>
               </div>
             ) : null}
             
             <h3>
               STR: {str} ({str >= 10 ? "+" : ""}{mod(str)}) 
               {pending_level_up_points === 0 && (
                 <>
                   {" "}<Button onClick={() => char.level_up("str")} size="sm" style={{ marginRight: '4px' }}>+2</Button>
                   {" "}<Button onClick={() => start_level_up()} variant="outline" size="sm">Split</Button>
                 </>
               )}
             </h3>
             <h3>
               DEX: {dex} ({dex >= 10 ? "+" : ""}{mod(dex)})
               {pending_level_up_points === 0 && (
                 <>
                   {" "}<Button onClick={() => char.level_up("dex")} size="sm" style={{ marginRight: '4px' }}>+2</Button>
                   {" "}<Button onClick={() => start_level_up()} variant="outline" size="sm">Split</Button>
                 </>
               )}
             </h3>
             <h3>
               INT: {int} ({int >= 10 ? "+" : ""}{mod(int)})
               {pending_level_up_points === 0 && (
                 <>
                   {" "}<Button onClick={() => char.level_up("int")} size="sm" style={{ marginRight: '4px' }}>+2</Button>
                   {" "}<Button onClick={() => start_level_up()} variant="outline" size="sm">Split</Button>
                 </>
               )}
             </h3>
             
             <div style={{ marginTop: '16px', marginBottom: '16px' }}>
               <StatOverrideControls
                 isUsingOverrides={isUsingStatOverrides}
                 originalStr={originalStr}
                 originalDex={originalDex}
                 originalInt={originalInt}
                 onToggleOverrides={toggleStatOverrides}
                 onSetStatOverride={setStatOverride}
                 getStatOverride={getStatOverride}
               />
             </div>
             
             <div style={{ marginTop: '16px' }}>
               <Button onClick={handleReset} style={{ marginRight: '8px' }}>Reset</Button>
               <Button onClick={() => setShowLoader(true)} variant="outline" style={{ marginRight: '8px' }}>
                 Load Character
               </Button>
               <Button onClick={() => setShowSaver(!showSaver)} variant="outline">
                 {showSaver ? 'Hide' : 'Save Character'}
               </Button>
             </div>
           </div>
          <AbilityManagerViewer
            abilityManager={abilityManager}
            abilities={abilities}
            hasSpellcasting={int >= 11 && max_sorcery_points > 0}
            hasCombatManeuvers={max_combat_maneuvers > 0}
            hasFinesse={max_finesse_points > 0}
            str={str}
            dex={dex}
            int={int}
            sorcery_points={sorcery_points}
            max_sorcery_points={max_sorcery_points}
            combat_maneuvers={combat_maneuvers}
            max_combat_maneuvers={max_combat_maneuvers}
            finesse_points={finesse_points}
            max_finesse_points={max_finesse_points}
            onAbilityChange={() => char.triggerUpdate()}
          />
           <InventoryViewer inventoryManager={char.inventory} onInventoryChange={handleInventoryChange} />
           <CombatActions char={char} />
           <NotesManager onNotesChange={() => char.triggerUpdate()} />
           <DiceSettingsPanel onSettingsChange={() => char.triggerUpdate()} />
           {showSaver && high && mid && selectedRace && (
             <CharacterSaver 
               char={char}
               high={high}
               mid={mid}
               racialBonuses={racialBonuses}
               characterName={characterName}
               onSave={(name) => {
                 setCharacterName(name);
                 setShowSaver(false);
               }}
             />
           )}
         </div>
         <LogViewer />
       </>
      }
    </div>
  )
}

export default App
