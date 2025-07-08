import { useState, useEffect } from 'react';
import { Button } from '@mantine/core';
import { Picker } from './Picker';
import { RacePicker } from './RacePicker';
import { StatBonusPicker } from './StatBonusPicker';
import { CharacterLoader } from './CharacterLoader';
import { Stat, Race } from '../types';
import { RACIAL_BONUS } from '../constants';

interface CharacterCreationFlowProps {
  onCharacterCreated: (
    high: Stat,
    mid: Stat,
    race: Race,
    racialBonuses: Stat[],
    characterName: string
  ) => void;
  onLoadCharacter: (
    loadedChar: any,
    loadedHigh: Stat,
    loadedMid: Stat,
    loadedRacialBonuses: Stat[],
    name: string
  ) => void;
}

export function CharacterCreationFlow({
  onCharacterCreated,
  onLoadCharacter,
}: CharacterCreationFlowProps) {
  const [high, setHigh] = useState<null | Stat>(null);
  const [mid, setMid] = useState<null | Stat>(null);
  const [selectedRace, setSelectedRace] = useState<null | Race>(null);
  const [racialBonuses, setRacialBonuses] = useState<Stat[]>([]);
  const [currentBonusIndex, setCurrentBonusIndex] = useState(0);
  const [showLoader, setShowLoader] = useState(false);

  // Calculate how many "any" bonuses need to be selected
  const getAnyBonusCount = (race: Race | null): number => {
    if (!race || !RACIAL_BONUS[race]) return 0;
    return RACIAL_BONUS[race].bonus.filter(b => b.stat === "any").length;
  };

  const anyBonusCount = getAnyBonusCount(selectedRace);
  const needsBonusSelection = selectedRace && currentBonusIndex < anyBonusCount;

  // Trigger character creation when all selections are complete
  useEffect(() => {
    if (high && mid && selectedRace && !needsBonusSelection) {
      onCharacterCreated(high, mid, selectedRace, racialBonuses, '');
    }
  }, [high, mid, selectedRace, racialBonuses, needsBonusSelection, onCharacterCreated]);

  const handleBonusSelection = (stat: Stat) => {
    const newBonuses = [...racialBonuses, stat];
    setRacialBonuses(newBonuses);
    setCurrentBonusIndex(currentBonusIndex + 1);
  };

  const handleLoadCharacter = (
    loadedChar: any,
    loadedHigh: Stat,
    loadedMid: Stat,
    loadedRacialBonuses: Stat[],
    name: string
  ) => {
    onLoadCharacter(loadedChar, loadedHigh, loadedMid, loadedRacialBonuses, name);
  };

  if (!high) {
    return (
      <div>
        <CharacterLoader 
          opened={showLoader}
          onLoad={handleLoadCharacter} 
          onCancel={() => setShowLoader(false)}
        />
        <Picker value={'high'} setter={setHigh} />
        <div style={{ marginTop: '16px', textAlign: 'center' }}>
          <Button variant="outline" onClick={() => setShowLoader(true)}>
            Load Saved Character
          </Button>
        </div>
      </div>
    );
  }

  if (!mid) {
    return <Picker value={'mid'} setter={setMid} />;
  }

  if (!selectedRace) {
    return <RacePicker setter={setSelectedRace} />;
  }

  if (needsBonusSelection) {
    return (
      <StatBonusPicker 
        setter={handleBonusSelection}
        bonusAmount={RACIAL_BONUS[selectedRace].bonus.filter(b => b.stat === "any")[currentBonusIndex]?.plus || 1}
        bonusNumber={currentBonusIndex + 1}
      />
    );
  }

  // This should not render since useEffect will trigger character creation
  return null;
}