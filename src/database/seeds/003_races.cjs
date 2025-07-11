/**
 * Seeds races table with character races and their bonuses
 * Based on RACIAL_BONUS data from constants.ts
 */

exports.seed = async function(knex) {
  // Clear existing entries
  await knex('races').del();

  // RACIAL_BONUS data from constants.ts
  const RACIAL_BONUS = {
    elf: {
      ability: "Treewalk",
      bonus: [{ plus: 2, stat: "dex"}]
    },
    gnome: {
      ability: "Tinker",
      bonus: [{ plus: 2, stat: "int"}],
    },
    human: {
      ability: "Contract", 
      bonus: [{ plus: 1, stat: "any"}, { plus: 1, stat: "any"}],
    },
    dwarf: {
      ability: "Stonesense", 
      bonus: [{plus: 2, stat: "str"}],
    },
    dragonborn: {
      ability: "Flametongue", 
      bonus: [{plus: 2, stat: "any"}],
    },
    halfling: {
      ability: "Lucky", 
      bonus: [{plus: 1, stat: "dex"}, {plus: 1, stat: "int"}],
    }
  };

  // Expanded race descriptions
  const RACE_DESCRIPTIONS = {
    elf: "Graceful and long-lived, elves are naturally attuned to nature and possess an innate connection to the forests. Their keen senses and agile movements make them excellent scouts and rangers.",
    gnome: "Small but brilliant, gnomes are natural inventors and tinkerers. Their curious minds and dexterous hands allow them to create ingenious mechanical devices and understand complex magical theory.",
    human: "Adaptable and ambitious, humans are the most versatile of all races. Their drive to form contracts and alliances allows them to excel in any field they choose to pursue.",
    dwarf: "Stout and resilient, dwarves have an innate understanding of stone and metal. Their natural strength and connection to the earth makes them formidable warriors and master craftsmen.",
    dragonborn: "Descendants of ancient dragons, dragonborn possess the fiery breath and fierce pride of their ancestors. Their draconic heritage grants them both power and presence.",
    halfling: "Small in stature but large in heart, halflings are known for their remarkable luck and cheerful disposition. Their nimble fingers and sharp minds serve them well in any endeavor."
  };

  // Racial ability descriptions  
  const RACIAL_ABILITY_DESCRIPTIONS = {
	"Treewalk": "In the forests, the elves' movements become almost impossible to follow",
	"Tinker": "Repairs and alterations, and a willingness to take anything apart",
	"Contract": "A favor or allegiance owed, or perhaps an uncanny gift for negotiating",
	"Stonesense": "Dwarves know the logic of stones, their language and nature",
	"Flametongue": "You know the Flametongue spellword and can cast it for free - a legacy of draconic lineage",
	"Lucky": "The smallfolk are implausibly capable, always pulling victory from the jaws of defeat"
  };

  // Build races array
  const races = [];

  Object.entries(RACIAL_BONUS).forEach(([raceName, raceData]) => {
    // Convert bonus array to a more descriptive format
    const statBonuses = raceData.bonus.map(bonus => ({
      stat: bonus.stat,
      bonus: bonus.plus
    }));

    races.push({
      name: raceName.charAt(0).toUpperCase() + raceName.slice(1), // Capitalize first letter
      description: RACE_DESCRIPTIONS[raceName] || `The ${raceName} race with unique traits and abilities.`,
      stat_bonuses: JSON.stringify(statBonuses),
      racial_abilities: JSON.stringify([]), // Will be populated when ability system is linked
      flavor_text: `${RACIAL_ABILITY_DESCRIPTIONS[raceData.ability]}\n\nRacial Ability: ${raceData.ability}`,
      is_active: true
    });
  });

  // Insert races
  await knex('races').insert(races);

  console.log(`Seeded ${races.length} character races:`);
  races.forEach(race => {
    const bonuses = JSON.parse(race.stat_bonuses);
    const bonusText = bonuses.map(b => `+${b.bonus} ${b.stat.toUpperCase()}`).join(', ');
    console.log(`  - ${race.name}: ${bonusText}`);
  });
};
