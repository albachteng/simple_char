// Database entity types

export interface User {
  id: number;
  username: string;
  email: string;
  password_hash: string;
  salt: string;
  created_at: Date;
  updated_at: Date;
  last_login?: Date;
  is_active: boolean;
  is_admin: boolean;
}

export interface UserSession {
  id: number;
  user_id: number;
  session_token: string;
  expires_at: Date;
  created_at: Date;
  last_accessed: Date;
  user_agent?: string;
  ip_address?: string;
}

export interface Character {
  id: number;
  user_id: number;
  name: string;
  
  // Core stats and creation parameters
  high_stat: 'str' | 'dex' | 'int';
  mid_stat: 'str' | 'dex' | 'int';
  race?: string;
  racial_bonuses?: string[];
  
  // Current derived stats
  current_str: number;
  current_dex: number;
  current_int: number;
  
  // Progression tracking
  level: number;
  current_hp: number;
  pending_level_up_points: number;
  
  // Stat override system
  use_stat_overrides: boolean;
  str_override?: number;
  dex_override?: number;
  int_override?: number;
  
  // Resource threshold tracking
  sorcery_threshold_level?: number;
  double_sorcery_threshold_level?: number;
  finesse_threshold_level?: number;
  
  // Metadata
  data_hash?: string;
  created_at: Date;
  updated_at: Date;
  last_accessed: Date;
}

export interface CharacterProgression {
  id: number;
  character_id: number;
  level_number: number;
  stat_choice?: 'str' | 'dex' | 'int';
  hp_roll: number;
  level_up_type: 'traditional' | 'split';
  split_allocation?: Record<string, number>;
  created_at: Date;
}

export interface EquipmentTemplate {
  id: number;
  name: string;
  type: 'weapon' | 'armor' | 'shield' | 'accessory';
  subtype?: string;
  description?: string;
  flavor_text?: string;
  
  // Requirements
  str_requirement: number;
  dex_requirement: number;
  int_requirement: number;
  
  // Base properties
  base_ac_bonus: number;
  base_attack_bonus: number;
  base_damage_dice?: string;
  
  // Equipment slots
  valid_slots?: string[];
  conflicts_with?: string[];
  
  // Metadata
  is_active: boolean;
  created_at: Date;
  created_by?: number;
}

export interface EquipmentAbility {
  id: number;
  name: string;
  description: string;
  ability_type: string;
  trigger_condition?: string;
  resource_cost: number;
  resource_type?: string;
  created_at: Date;
}

export interface EquipmentTemplateAbility {
  equipment_template_id: number;
  equipment_ability_id: number;
  granted_at_enchantment: number;
}

export interface EquipmentStatModifier {
  id: number;
  equipment_template_id: number;
  stat_name: string;
  modifier_type: 'bonus' | 'penalty' | 'override';
  base_value: number;
  per_enchantment_value: number;
  max_enchantment_level: number;
  created_at: Date;
}

export interface EquipmentResourceBonus {
  id: number;
  equipment_template_id: number;
  resource_type: 'sorcery' | 'finesse' | 'combat_maneuver';
  base_bonus: number;
  per_enchantment_bonus: number;
  max_enchantment_level: number;
  created_at: Date;
}

export interface CharacterInventoryItem {
  id: number;
  character_id: number;
  equipment_template_id: number;
  
  // Item instance properties
  custom_name?: string;
  enchantment_level: number;
  is_equipped: boolean;
  equipment_slot?: string;
  
  // Custom modifications
  custom_description?: string;
  custom_stat_modifiers?: Record<string, number>;
  custom_resource_bonuses?: Record<string, number>;
  custom_abilities?: number[];
  
  // Metadata
  acquired_at: Date;
  notes?: string;
  
  // Joined data from equipment_templates
  template_name?: string;
  type?: string;
  subtype?: string;
  template_description?: string;
}

export interface AbilityTemplate {
  id: number;
  name: string;
  type: 'metamagic' | 'spellword' | 'combat_maneuver' | 'racial' | 'equipment';
  description: string;
  short_description?: string;
  
  // Requirements
  min_level: number;
  stat_requirements?: Record<string, number>;
  prerequisite_abilities?: number[];
  
  // Usage
  resource_cost: number;
  resource_type?: string;
  usage_limit?: string;
  
  // Metadata
  source?: string;
  is_active: boolean;
  created_at: Date;
}

export interface CharacterAbility {
  id: number;
  character_id: number;
  ability_template_id: number;
  learned_at_level: number;
  times_used: number;
  custom_notes?: string;
  learned_at: Date;
}

export interface CharacterNote {
  id: number;
  character_id: number;
  title?: string;
  content: string;
  note_type: 'general' | 'combat' | 'story' | 'reminder';
  is_pinned: boolean;
  created_at: Date;
  updated_at: Date;
}

export interface UniversalNote {
  id: number;
  title: string;
  content: string;
  note_type: 'announcement' | 'rule_update' | 'system_info';
  target_audience: 'all' | 'new_characters' | 'existing_characters';
  
  // Visibility
  is_active: boolean;
  show_until?: Date;
  min_character_level: number;
  max_character_level?: number;
  
  // Metadata
  created_by: number;
  created_at: Date;
  updated_at: Date;
}

export interface UserUniversalNoteSeen {
  user_id: number;
  universal_note_id: number;
  seen_at: Date;
}

export interface ApplicationLog {
  id: number;
  timestamp: Date;
  level: 'debug' | 'info' | 'warn' | 'error';
  category: string;
  message: string;
  data?: any;
  user_id?: number;
  character_id?: number;
  session_id?: number;
  ip_address?: string;
  user_agent?: string;
}

export interface CharacterLog {
  id: number;
  character_id: number;
  timestamp: Date;
  level: 'debug' | 'info' | 'warn' | 'error';
  category: string;
  message: string;
  data?: any;
  session_id?: number;
}

export interface Race {
  id: number;
  name: string;
  description?: string;
  stat_bonuses: Array<{stat: string; bonus: number}>;
  racial_abilities?: number[];
  flavor_text?: string;
  is_active: boolean;
  created_at: Date;
}

export interface ApplicationSetting {
  key: string;
  value: string;
  value_type: 'string' | 'number' | 'boolean' | 'json';
  description?: string;
  is_user_configurable: boolean;
  updated_at: Date;
  updated_by?: number;
}

export interface UserPreference {
  user_id: number;
  preference_key: string;
  preference_value: string;
  updated_at: Date;
}

// Composite types for API responses
export interface CharacterWithInventory extends Character {
  inventory: CharacterInventoryItem[];
}

export interface CharacterWithDetails extends Character {
  inventory: CharacterInventoryItem[];
  abilities: CharacterAbility[];
  notes: CharacterNote[];
  progression: CharacterProgression[];
}

// Data transfer objects for creating/updating
export interface CharacterCreateData {
  user_id: number;
  name: string;
  high_stat: 'str' | 'dex' | 'int';
  mid_stat: 'str' | 'dex' | 'int';
  race?: string;
  racial_bonuses?: string[];
  current_str: number;
  current_dex: number;
  current_int: number;
  current_hp: number;
}

export interface CharacterUpdateData {
  name?: string;
  level?: number;
  current_str?: number;
  current_dex?: number;
  current_int?: number;
  current_hp?: number;
  pending_level_up_points?: number;
  use_stat_overrides?: boolean;
  str_override?: number;
  dex_override?: number;
  int_override?: number;
  sorcery_threshold_level?: number;
  double_sorcery_threshold_level?: number;
  finesse_threshold_level?: number;
  data_hash?: string;
}