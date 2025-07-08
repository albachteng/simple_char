import { useState } from 'react';
import { Button } from '@mantine/core';
import { mod } from './useChar';
import { StatButtonGroup, createLevelUpAllocationButtons } from './components/StatButtonGroup';
import { CardSection } from './components/CharacterSection';
import { CompactResourceDisplay } from './components/ResourceDisplay';
import { AbilityManagerViewer } from './AbilityManagerViewer';
import { InventoryViewer } from './InventoryViewer';
import { CombatActions } from './CombatActions';
import { NotesManager } from './NotesManager';
import { DiceSettingsPanel } from './DiceSettings';
import { CharacterSaver } from './CharacterSaver';
import { CharacterNameEditor } from './CharacterNameEditor';
import { StatOverrideControls } from './StatOverrideControls';
import { Stat, Race } from '../types';

interface CharacterDisplayProps {
  // Character data
  characterName: string;
  selectedRace: Race;
  level: number;
  hp: number;
  ac: number;
  combat_maneuvers: number;
  finesse_points: number;
  sorcery_points: number;
  
  // Stats
  str: number;
  dex: number;
  int: number;
  originalStr: number;
  originalDex: number;
  originalInt: number;
  
  // Level up state
  pending_level_up_points: number;
  
  // Character system
  char: any; // TODO: Type this properly
  abilities: string[];
  abilityManager: any;
  max_sorcery_points: number;
  max_combat_maneuvers: number;
  max_finesse_points: number;
  
  // Stat override system
  isUsingStatOverrides: boolean;
  
  // Save/load state
  high: Stat;
  mid: Stat;
  racialBonuses: Stat[];
  
  // Callbacks
  onNameChange: (name: string) => void;
  onReset: () => void;
  onInventoryChange: () => void;
  onLevelUp: (stat: Stat) => void;
  onStartLevelUp: () => void;
  onAllocatePoint: (stat: Stat) => void;
  onToggleStatOverrides: () => void;
  onSetStatOverride: (stat: Stat, value: number) => void;
  onGetStatOverride: (stat: Stat) => number;
  onSaveCharacter: (name: string) => void;
  onLoadCharacter: () => void;
}

export function CharacterDisplay({
  characterName,
  selectedRace,
  level,
  hp,
  ac,
  combat_maneuvers,
  finesse_points,
  sorcery_points,
  str,
  dex,
  int,
  originalStr,
  originalDex,
  originalInt,
  pending_level_up_points,
  char,
  abilities,
  abilityManager,
  max_sorcery_points,
  max_combat_maneuvers,
  max_finesse_points,
  isUsingStatOverrides,
  high,
  mid,
  racialBonuses,
  onNameChange,
  onReset,
  onInventoryChange,
  onLevelUp,
  onStartLevelUp,
  onAllocatePoint,
  onToggleStatOverrides,
  onSetStatOverride,
  onGetStatOverride,
  onSaveCharacter,
  onLoadCharacter,
}: CharacterDisplayProps) {
  const [showSaver, setShowSaver] = useState(false);

  return (
    <>
      <div>
        <div></div>
        <CharacterNameEditor 
          name={characterName}
          onNameChange={onNameChange}
        />
        <h2 style={{ color: '#bbb', fontSize: '16px' }}>
          {selectedRace?.charAt(0).toUpperCase() + selectedRace?.slice(1)} - Level {level}
        </h2>
        <CardSection>
          <CompactResourceDisplay
            hp={hp}
            ac={ac}
            combat_maneuvers={combat_maneuvers}
            finesse_points={finesse_points}
            sorcery_points={sorcery_points}
            max_combat_maneuvers={max_combat_maneuvers}
            max_finesse_points={max_finesse_points}
            max_sorcery_points={max_sorcery_points}
            layout="vertical"
            size="md"
          />
          {pending_level_up_points > 0 ? (
            <div style={{ marginBottom: '16px', padding: '12px', backgroundColor: '#2a2a2a', borderRadius: '8px' }}>
              <h4 style={{ color: '#ffb347', margin: '0 0 8px 0' }}>
                Level Up in Progress - {pending_level_up_points} point{pending_level_up_points !== 1 ? 's' : ''} remaining
              </h4>
              <StatButtonGroup
                layout="horizontal"
                wrapInHeadings={false}
                buttonConfigs={createLevelUpAllocationButtons(onAllocatePoint, pending_level_up_points <= 0)}
              />
            </div>
          ) : null}
          
          <h3>
            STR: {str} ({str >= 10 ? "+" : ""}{mod(str)}) 
            {pending_level_up_points === 0 && (
              <>
                {" "}<Button onClick={() => onLevelUp("str")} size="sm" style={{ marginRight: '4px' }}>+2</Button>
                {" "}<Button onClick={() => onStartLevelUp()} variant="outline" size="sm">Split</Button>
              </>
            )}
          </h3>
          <h3>
            DEX: {dex} ({dex >= 10 ? "+" : ""}{mod(dex)})
            {pending_level_up_points === 0 && (
              <>
                {" "}<Button onClick={() => onLevelUp("dex")} size="sm" style={{ marginRight: '4px' }}>+2</Button>
                {" "}<Button onClick={() => onStartLevelUp()} variant="outline" size="sm">Split</Button>
              </>
            )}
          </h3>
          <h3>
            INT: {int} ({int >= 10 ? "+" : ""}{mod(int)})
            {pending_level_up_points === 0 && (
              <>
                {" "}<Button onClick={() => onLevelUp("int")} size="sm" style={{ marginRight: '4px' }}>+2</Button>
                {" "}<Button onClick={() => onStartLevelUp()} variant="outline" size="sm">Split</Button>
              </>
            )}
          </h3>
          
          <div style={{ marginTop: '16px', marginBottom: '16px' }}>
            <StatOverrideControls
              isUsingOverrides={isUsingStatOverrides}
              originalStr={originalStr}
              originalDex={originalDex}
              originalInt={originalInt}
              onToggleOverrides={onToggleStatOverrides}
              onSetStatOverride={onSetStatOverride}
              getStatOverride={onGetStatOverride}
            />
          </div>
          
          <div style={{ marginTop: '16px' }}>
            <Button onClick={onReset} style={{ marginRight: '8px' }}>Reset</Button>
            <Button onClick={onLoadCharacter} variant="outline" style={{ marginRight: '8px' }}>
              Load Character
            </Button>
            <Button onClick={() => setShowSaver(!showSaver)} variant="outline">
              {showSaver ? 'Hide' : 'Save Character'}
            </Button>
          </div>
        </CardSection>
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
        <InventoryViewer inventoryManager={char.inventory} onInventoryChange={onInventoryChange} />
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
              onSaveCharacter(name);
              setShowSaver(false);
            }}
          />
        )}
      </div>
    </>
  );
}