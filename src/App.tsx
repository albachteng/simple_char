import { useState, useEffect } from 'react';
import './App.css'
import { useChar } from './useChar'
import { CharacterCreationFlow } from './CharacterCreationFlow'
import { CharacterDisplay } from './CharacterDisplay'
import { CharacterLoader } from './CharacterLoader'
import { LogViewer } from './LogViewer'
import { logger } from './logger'
import { Stat, Race } from '../types';

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
    // Finesse attack and rest methods
    sneakAttackMainHand,
    sneakAttackOffHand,
    assassinationMainHand,
    assassinationOffHand,
    canPerformFinesseAttacks,
    rest,
  } = useChar()

  const [characterName, setCharacterName] = useState('');
  const [selectedRace, setSelectedRace] = useState<null | Race>(null);
  const [high, setHigh] = useState<null | Stat>(null);
  const [mid, setMid] = useState<null | Stat>(null);
  const [racialBonuses, setRacialBonuses] = useState<Stat[]>([]);

  // Track if we have a created character (completed creation flow)
  const [hasCharacter, setHasCharacter] = useState(false);
  const [showCharacterLoader, setShowCharacterLoader] = useState(false);

  // Update logger context when character name changes
  useEffect(() => {
    if (characterName && characterName.trim() !== '') {
      logger.setCurrentCharacter(characterName)
    } else {
      logger.clearCurrentCharacter()
    }
  }, [characterName])

  const handleCharacterCreated = (
    newHigh: Stat,
    newMid: Stat,
    newRace: Race,
    newRacialBonuses: Stat[],
    newCharacterName: string
  ) => {
    // Create the character
    reset(newHigh, newMid, newRace, newRacialBonuses);
    
    // Update UI state
    setHigh(newHigh);
    setMid(newMid);
    setSelectedRace(newRace);
    setRacialBonuses(newRacialBonuses);
    setCharacterName(newCharacterName);
    setHasCharacter(true);
  };

  const handleLoadCharacter = (
    loadedChar: any,
    loadedHigh: Stat,
    loadedMid: Stat,
    loadedRacialBonuses: Stat[],
    name: string
  ) => {
    // Use the actual loaded character instead of recreating it
    loadCharacter(loadedChar);
    
    // Set the UI state to match the loaded character
    setHigh(loadedHigh);
    setMid(loadedMid);
    setSelectedRace(loadedChar.race);
    setRacialBonuses(loadedRacialBonuses);
    setCharacterName(name);
    setHasCharacter(true);
    
    // Close the character loader modal
    setShowCharacterLoader(false);
  };

  const handleReset = () => {
    // Reset character to a new default character
    reset('str', 'dex');
    
    // Reset UI state
    setHigh(null);
    setMid(null);
    setSelectedRace(null);
    setRacialBonuses([]);
    setCharacterName('');
    setHasCharacter(false);
  };

  const handleInventoryChange = () => {
    // Sync equipment state when inventory changes
    char.syncEquipmentFromInventory();
    // Trigger UI update by emitting character update event
    char.triggerUpdate();
  };

  return (
    <div className="app-container">
      {!hasCharacter ? (
        <CharacterCreationFlow
          onCharacterCreated={handleCharacterCreated}
          onLoadCharacter={handleLoadCharacter}
        />
      ) : (
        <>
          <CharacterLoader 
            opened={showCharacterLoader}
            onLoad={handleLoadCharacter} 
            onCancel={() => setShowCharacterLoader(false)}
          />
          <CharacterDisplay
            characterName={characterName}
            selectedRace={selectedRace!}
            level={level}
            hp={hp}
            ac={ac}
            combat_maneuvers={combat_maneuvers}
            finesse_points={finesse_points}
            sorcery_points={sorcery_points}
            str={str}
            dex={dex}
            int={int}
            originalStr={originalStr}
            originalDex={originalDex}
            originalInt={originalInt}
            pending_level_up_points={pending_level_up_points}
            char={char}
            abilities={abilities}
            abilityManager={abilityManager}
            max_sorcery_points={max_sorcery_points}
            max_combat_maneuvers={max_combat_maneuvers}
            max_finesse_points={max_finesse_points}
            isUsingStatOverrides={isUsingStatOverrides}
            high={high!}
            mid={mid!}
            racialBonuses={racialBonuses}
            onNameChange={setCharacterName}
            onReset={handleReset}
            onInventoryChange={handleInventoryChange}
            onLevelUp={(stat) => char.level_up(stat)}
            onStartLevelUp={start_level_up}
            onAllocatePoint={allocate_point}
            onToggleStatOverrides={toggleStatOverrides}
            onSetStatOverride={setStatOverride}
            onGetStatOverride={getStatOverride}
            onSaveCharacter={setCharacterName}
            onLoadCharacter={() => setShowCharacterLoader(true)}
            sneakAttackMainHand={sneakAttackMainHand}
            sneakAttackOffHand={sneakAttackOffHand}
            assassinationMainHand={assassinationMainHand}
            assassinationOffHand={assassinationOffHand}
            canPerformFinesseAttacks={canPerformFinesseAttacks}
            rest={rest}
          />
          <LogViewer characterName={characterName} />
        </>
      )
      }
    </div>
  )
}

export default App
