const { SlashCommandBuilder, EmbedBuilder, ActionRowBuilder, ButtonBuilder, ButtonStyle, ComponentType, TextInputStyle } = require('discord.js');
const request = require('request');

module.exports = {
    data: new SlashCommandBuilder ()
        .setName('상장')
        .setDescription('Tetra League 계정을 상장합니다.')
        .addStringOption(option => option.setName('닉네임').setDescription('상장할 계정').setRequired(true)),
    async execute(interaction) {
        const nick = interaction.options.getString('닉네임');
        if (!nick) return interaction.reply({ content: 'No such user' });
        request({
            uri: 'https://ch.tetr.io/api/users/' + nick,
            qs: {}
        }, (err, res, body) => {
            if (err) {
                interaction.reply('Error on server');
                return;
            }
            try {
                const qry = JSON.parse(body);
                if (!qry.success) {
                    interaction.reply('No such user');
                    return;
                }
                var str = '';
                // str += 'Won ' + qry.data.user.gameswon + ' of ' + qry.data.user.gamesplayed + ' games\n';
                // str += 'Played for ' + (qry.data.user.gametime / 3600).toFixed(1) + ' hours\n';
                // if (qry.data.user.league.rating > 0) {
                //     str += 'Rating: ' + qry.data.user.league.rating.toFixed(2) + '\n';
                //     str += 'Glicko: ' + qry.data.user.league.glicko.toFixed(2) + '\n';
                // } else {
                //     str += 'This user never played Tetra League\n';
                //     interaction.reply(str);
                //     return;
                // }
                // const row = new ActionRowBuilder ({
                //     components: [{
                //         custom_id: "id",
                //         label: "Click me",
                //         style: TextInputStyle.Short,
                //         type: ComponentType.TextInput,
                //     }]
                // });
                var embed = new EmbedBuilder ();
                var flag = '';
                if (qry.data.user.country) flag = `:flag_${qry.data.user.country.toLowerCase()}: `
                if (qry.data.user.league.rating < 0) {
                    embed.setColor(0x990000)
                    .setTitle('Tetra League 플레이 기록이 없습니다.')
                    .setDescription(`${flag}**${qry.data.user.username.toUpperCase()}**`)
                    .addFields({ name: 'Games Played', value: qry.data.user.gamesplayed.toString(), inline: true })
                    .addFields({ name: 'Games Won', value: qry.data.user.gameswon.toString(), inline: true })
                    .addFields({ name: 'Playtime', value: (qry.data.user.gametime / 3600).toFixed(1) + ' hours' });
                    interaction.reply({ embeds: [ embed ] });
                    return;
                } else if (qry.data.user.league.rank == 's-' || qry.data.user.league.rank == 's' || qry.data.user.league.rank == 's+' || qry.data.user.league.rank == 'ss' || qry.data.user.league.rank == 'u' || qry.data.user.league.rank == 'x') {
                    embed.setColor(0x009900)
                    .setTitle('계정을 상장합니다.')
                    .setDescription(`${flag}**${qry.data.user.username.toUpperCase()}**`)
                    .addFields({ name: 'Games Played', value: qry.data.user.gamesplayed.toString(), inline: true })
                    .addFields({ name: 'Games Won', value: qry.data.user.gameswon.toString(), inline: true })
                    .addFields({ name: 'Playtime', value: (qry.data.user.gametime / 3600).toFixed(1) + ' hours' })
                    .addFields({ name: 'Rating', value: qry.data.user.league.rating.toFixed(2).toString(), inline: true })
                    .addFields({ name: 'Glicko', value: qry.data.user.league.glicko.toFixed(2).toString(), inline: true })
                } else {
                    embed.setColor(0x990000)
                    .setTitle('S- 이상만 상장할 수 있습니다.')
                    .setDescription(`${flag}**${qry.data.user.username.toUpperCase()}**`)
                    .addFields({ name: 'Games Played', value: qry.data.user.gamesplayed.toString(), inline: true })
                    .addFields({ name: 'Games Won', value: qry.data.user.gameswon.toString(), inline: true })
                    .addFields({ name: 'Playtime', value: (qry.data.user.gametime / 3600).toFixed(1) + ' hours' })
                    .addFields({ name: 'Rating', value: qry.data.user.league.rating.toFixed(2).toString(), inline: true })
                    .addFields({ name: 'Glicko', value: qry.data.user.league.glicko.toFixed(2).toString(), inline: true })
                    interaction.reply({ embeds: [ embed ] });
                    return;
                }
                const confirm = new ButtonBuilder()
                    .setCustomId('ok')
                    .setLabel('상장')
                    .setStyle(ButtonStyle.Primary);
                const cancel = new ButtonBuilder()
                    .setCustomId('cancel')
                    .setLabel('취소')
                    .setStyle(ButtonStyle.Secondary);
                const row = new ActionRowBuilder()
                    .addComponents(cancel, confirm);
                interaction.reply({ embeds: [ embed ], components: [row] });
            } catch (e) {
                interaction.reply('Error on processing query: ' + e);
                return;
            }
        });
    },
    async buttonPress(interaction) {
        console.log(interaction);
    },
};