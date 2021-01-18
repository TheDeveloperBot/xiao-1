const Command = require('../../structures/Command');
const { MessageEmbed } = require('discord.js');
const { stripIndents } = require('common-tags');
const { list } = require('../../util/Util');

module.exports = class PokedexCommand extends Command {
	constructor(client) {
		super(client, {
			name: 'pokedex-stats',
			aliases: ['pokemon-stats', 'pokémon-stats', 'pokédex-stats', 'pkmn-stats'],
			group: 'pokedex',
			memberName: 'pokedex-stats',
			description: 'Responds with the stats for a Pokémon.',
			clientPermissions: ['EMBED_LINKS'],
			credit: [
				{
					name: 'Pokémon',
					url: 'https://www.pokemon.com/us/',
					reason: 'Images, Original Game'
				},
				{
					name: 'PokéAPI',
					url: 'https://pokeapi.co/',
					reason: 'API'
				},
				{
					name: 'Serebii.net',
					url: 'https://www.serebii.net/index2.shtml',
					reason: 'Images'
				}
			],
			args: [
				{
					key: 'pokemon',
					prompt: 'What Pokémon would you like to get information on?',
					type: 'string'
				},
				{
					key: 'form',
					prompt: 'What form do you want to get information for?',
					type: 'string',
					default: '',
					parse: form => {
						if (form.toLowerCase() === 'normal') return '';
						return form.toLowerCase();
					}
				}
			]
		});
	}

	async run(msg, { pokemon, form }) {
		try {
			const data = await this.client.pokemon.fetch(pokemon);
			if (!data) return msg.say('Could not find any results.');
			if (!data.gameDataCached) await data.fetchGameData();
			const variety = data.varieties.find(vrity => form ? vrity.name.toLowerCase() === form : vrity.default);
			if (!variety) {
				const varieties = data.varieties.map(vrity => vrity.name || 'Normal');
				return msg.say(`Invalid form. The forms available for this Pokémon are: ${list(varieties, 'and')}`);
			}
			const statTotal = data.baseStatTotal(variety.id);
			const repeat = {
				hp: Math.round((variety.stats.hp / 255) * 10) * 2,
				atk: Math.round((variety.stats.atk / 255) * 10) * 2,
				def: Math.round((variety.stats.def / 255) * 10) * 2,
				sAtk: Math.round((variety.stats.sAtk / 255) * 10) * 2,
				sDef: Math.round((variety.stats.sDef / 255) * 10) * 2,
				spd: Math.round((variety.stats.spd / 255) * 10) * 2,
				total: Math.round((statTotal / 720) * 10) * 2
			};
			const embed = new MessageEmbed()
				.setColor(0xED1C24)
				.setAuthor(`#${data.displayID} - ${data.name}`, data.boxImageURL, data.serebiiURL)
				.setThumbnail(data.spriteImageURL)
				.addField(`❯ Base Stats (${variety.name || 'Base'} Form)`, stripIndents`
					\`HP:          [${'█'.repeat(repeat.hp)}${' '.repeat(20 - repeat.hp)}]\` **${variety.stats.hp}**
					\`Attack:      [${'█'.repeat(repeat.atk)}${' '.repeat(20 - repeat.atk)}]\` **${variety.stats.atk}**
					\`Defense:     [${'█'.repeat(repeat.def)}${' '.repeat(20 - repeat.def)}]\` **${variety.stats.def}**
					\`Sp. Attack:  [${'█'.repeat(repeat.sAtk)}${' '.repeat(20 - repeat.sAtk)}]\` **${variety.stats.sAtk}**
					\`Sp. Defense: [${'█'.repeat(repeat.sDef)}${' '.repeat(20 - repeat.sDef)}]\` **${variety.stats.sDef}**
					\`Speed:       [${'█'.repeat(repeat.spd)}${' '.repeat(20 - repeat.spd)}]\` **${variety.stats.spd}**
					\`-----------------------------------\`
					\`Total:       [${'█'.repeat(repeat.total)}${' '.repeat(20 - repeat.total)}]\` **${statTotal}**
				`)
				.addField('❯ Abilities', variety.abilities.join('/'))
				.addField('❯ Other Forms', stripIndents`
					Use ${this.usage(`${data.id} <form>`)} to get stats for another form.
					Forms Available: ${data.varieties.map(vrity => vrity.name || 'Normal').join(', ')}
				`);
			return msg.embed(embed);
		} catch (err) {
			return msg.reply(`Oh no, an error occurred: \`${err.message}\`. Try again later!`);
		}
	}
};
