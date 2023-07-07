const { SlashCommandBuilder, EmbedBuilder, ActionRowBuilder, ButtonBuilder, ButtonStyle, ComponentType, TextInputStyle } = require('discord.js');
const request = require('request');
const mysql = require('mysql');

module.exports = {
    data: new SlashCommandBuilder ()
        .setName('목록')
        .setDescription('상장된 계정 목록을 봅니다.'),
    async execute(interaction, sql) {
        sql.query('SELECT id, games, glicko, price FROM LIST', function (err, results, fields) {
            if (err) {
                interaction.reply('Error on database');
                return;
            }
            if (results.length == 0) {
                var embed = new EmbedBuilder ();
                embed.setColor(0x990000)
                .setTitle('상장 계정 목록')
                .setDescription('상장되지 않음');
                interaction.reply({ embeds: [ embed ] });
                return;
            }
            var embed = new EmbedBuilder ();
            embed.setColor(0x009900)
            .setTitle('상장 계정 목록')
            .setDescription(`${results.length} 개의 계정 상장됨`);
            results.forEach(item => embed.addFields({
                name: `${item.id}(${item.glicko.toFixed(2)})`,
                value: `${item.price.toFixed(0)} 원에 거래 중`
            }));
            interaction.reply({ embeds: [ embed ] });
        });
        // var embed = new EmbedBuilder ();
        // embed.setColor(0x009900)
        // .setTitle('Tetra League 플레이 기록이 없습니다.')
        // .setDescription(`${flag}**${qry.data.user.username.toUpperCase()}**`)
        // .addFields({ name: 'Games Played', value: qry.data.user.gamesplayed.toString(), inline: true })
        // .addFields({ name: 'Games Won', value: qry.data.user.gameswon.toString(), inline: true })
        // .addFields({ name: 'Playtime', value: (qry.data.user.gametime / 3600).toFixed(1) + ' hours' });
        // interaction.reply({ embeds: [ embed ] });
    },
};