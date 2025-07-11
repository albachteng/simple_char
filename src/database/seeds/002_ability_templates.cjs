/**
 * Seeds ability_templates table with metamagic, spellwords, and combat maneuvers
 * Based on data from constants.ts and src/abilities/AbilityManager.ts
 */

exports.seed = async function(knex) {
  // Clear existing entries
  await knex('ability_templates').del();

  // Constants from constants.ts
  const METAMAGIC = ['Aura', 'Cascade', 'Cloak', 'Distant', 'Empowered', 'Glyph', 'Grasp', 'Heighten', 'Hypnotic', 'Orb', 'Orbit', 'Precise', 'Quick', 'Sculpt', 'Subtle', 'Twin', 'Wall'];
  const SPELLWORDS = ['Chill', 'Confound', 'Counterspell', 'Deafen', 'Flametongue', 'Growth', 'Heat', 'Illusion', 'Light', 'Mend', 'Push/Pull', 'Rain', 'Reflect', 'Shadow', 'Shield', 'Soothe', 'Spark', 'Thread', 'Vision'];
  const COMBAT_MANEUVERS = ['Blinding', 'Cleave', 'Command', 'Daring', 'Disarming', 'Enraged', 'Goading', 'Grappling', 'Leaping', 'Menace', 'Precision', 'Preparation', 'Reckless', 'Riposte', 'Stampede', 'Throw', 'Trip'];

  // Description data (from AbilityManager.ts)
  const METAMAGIC_DESCRIPTIONS = {
    'Aura': 'Spells gain an area of effect around the target',
    'Cascade': 'Spell effects chain to additional targets',
    'Cloak': 'Spells become invisible or harder to detect',
    'Distant': 'Spell range is significantly increased',
    'Empowered': 'Spell damage is maximized or enhanced',
    'Glyph': 'Spells can be stored and triggered later',
    'Grasp': 'Spells can manipulate objects or creatures',
    'Heighten': 'Spell save DCs are increased',
    'Hypnotic': 'Spells entrance or mesmerize targets',
    'Orb': 'Spells create persistent magical orbs',
    'Orbit': 'Spell effects circle around the caster',
    'Precise': 'Spells automatically hit or have perfect accuracy',
    'Quick': 'Casting time is reduced or instant',
    'Sculpt': 'Spell areas can be shaped to avoid allies',
    'Subtle': 'Spells require no visible components',
    'Twin': 'Spells affect two targets simultaneously',
    'Wall': 'Spells create barriers or walls of energy'
  };

  const SPELLWORD_DESCRIPTIONS = {
    'Chill': 'Manipulate cold and ice',
    'Confound': 'Cause confusion and bewilderment',
    'Counterspell': 'Disrupt and cancel other magic',
    'Deafen': 'Affect hearing and sound',
    'Flametongue': 'Control fire and heat',
    'Growth': 'Enhance size and vitality',
    'Heat': 'Generate warmth and energy',
    'Illusion': 'Create false images and deceptions',
    'Light': 'Manipulate illumination and brightness',
    'Mend': 'Repair and restore objects',
    'Push/Pull': 'Apply force and movement',
    'Rain': 'Control weather and precipitation',
    'Reflect': 'Redirect attacks and effects',
    'Shadow': 'Manipulate darkness and shadows',
    'Shield': 'Provide protection and defense',
    'Soothe': 'Calm emotions and heal wounds',
    'Spark': 'Generate electricity and lightning',
    'Thread': 'Manipulate fabric of reality',
    'Vision': 'Enhance sight and perception'
  };

  const COMBAT_MANEUVER_DESCRIPTIONS = {
    'Blinding': 'Temporarily blind your opponent',
    'Cleave': 'Strike through to hit multiple enemies',
    'Command': 'Issue orders that must be obeyed',
    'Daring': 'Take risks for greater rewards',
    'Disarming': 'Remove weapons from enemy hands',
    'Enraged': 'Channel fury for devastating attacks',
    'Goading': 'Provoke enemies into poor decisions',
    'Grappling': 'Grab and restrain opponents',
    'Leaping': 'Use mobility for tactical advantage',
    'Menace': 'Intimidate foes into submission',
    'Precision': 'Strike with perfect accuracy',
    'Preparation': 'Set up advantageous positions',
    'Reckless': 'Sacrifice defense for offense',
    'Riposte': 'Counter-attack after dodging',
    'Stampede': 'Charge through enemy lines',
    'Throw': 'Hurl weapons or objects',
    'Trip': 'Knock opponents prone'
  };

  // Build ability templates array
  const abilities = [];

  // Add metamagic abilities
  METAMAGIC.forEach(name => {
    abilities.push({
      name: name,
      type: 'metamagic',
      description: METAMAGIC_DESCRIPTIONS[name] || `Metamagic technique: ${name}`,
      min_level: 1,
      stat_requirements: JSON.stringify({"int": 11}), // MIN_SPELLCASTING_INT from constants
      prerequisite_abilities: JSON.stringify([]),
      resource_cost: 1,
      resource_type: 'sorcery',
      is_active: true
    });
  });

  // Add spellword abilities  
  SPELLWORDS.forEach(name => {
    abilities.push({
      name: name,
      type: 'spellword',
      description: SPELLWORD_DESCRIPTIONS[name] || `Spellword: ${name}`,
      min_level: 1,
      stat_requirements: JSON.stringify({"int": 11}), // MIN_SPELLCASTING_INT from constants
      prerequisite_abilities: JSON.stringify([]),
      resource_cost: 1,
      resource_type: 'sorcery',
      is_active: true
    });
  });

  // Add combat maneuver abilities
  COMBAT_MANEUVERS.forEach(name => {
    abilities.push({
      name: name,
      type: 'combat_maneuver',
      description: COMBAT_MANEUVER_DESCRIPTIONS[name] || `Combat maneuver: ${name}`,
      min_level: 1,
      stat_requirements: JSON.stringify({"str": 16}), // MIN_MANEUVER_STR from constants
      prerequisite_abilities: JSON.stringify([]),
      resource_cost: 1,
      resource_type: 'combat_maneuver',
      is_active: true
    });
  });

  // Insert ability templates
  await knex('ability_templates').insert(abilities);

  console.log(`Seeded ${abilities.length} ability templates:`);
  console.log(`  - ${METAMAGIC.length} metamagic abilities`);
  console.log(`  - ${SPELLWORDS.length} spellword abilities`);
  console.log(`  - ${COMBAT_MANEUVERS.length} combat maneuver abilities`);
};