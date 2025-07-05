export interface SavedCharacter {
  name: string
  hash: string
  data: {
    high: string
    mid: string
    race: string | null
    racialBonuses: string[]
    level: number
    hp_rolls: number[]
    level_up_choices: string[] // Track which stat was leveled each time
    armor: string
    weapon: string
    shield: boolean
    inventory: any // Store the full inventory data
  }
  timestamp: number
}

export interface ICharacterStorage {
  saveCharacter(character: SavedCharacter): Promise<void>
  loadCharacter(name: string): Promise<SavedCharacter | null>
  loadCharacterByHash(hash: string): Promise<SavedCharacter | null>
  listCharacters(): Promise<SavedCharacter[]>
  deleteCharacter(name: string): Promise<boolean>
  characterExists(name: string): Promise<boolean>
}