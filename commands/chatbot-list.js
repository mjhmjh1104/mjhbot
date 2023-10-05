const { SlashCommandBuilder, EmbedBuilder, ActionRowBuilder, ButtonBuilder, ButtonStyle, ComponentType, TextInputStyle } = require('discord.js');
const request = require('request');
const mysql = require('mysql2/promise');

module.exports = {
    data: new SlashCommandBuilder ()
        .setName('목록')
        .setDescription('트리거 목록을 봅니다.'),
    async execute(interaction, sql) {
        const [ results, fields ] = await sql.query(`SELECT content, lastmodified, lastmodifieduser FROM COMMANDS WHERE server = ${mysql.escape(interaction.guildId)}`);
        if (results.length == 0) {
            var embed = new EmbedBuilder ();
            embed.setColor(0x990000)
            .setTitle('트리거 목록')
            .setDescription('트리거 없음');
            interaction.reply({ embeds: [ embed ] });
            return;
        }
        var embed = new EmbedBuilder ();
        embed.setColor(0x009900)
        .setTitle('트리거 목록')
        .setDescription(`${results.length} 개의 트리거`);
        results.forEach(function (item) {
            console.log(item.lastmodifieduser);
            console.log(interaction.guild.members.cache);
            const crew = interaction.guild.members.cache.get(item.lastmodifieduser);
            var displayname = item.lastmodifieduser;
            if (crew) {
                var nickname = crew.nickname;
                if (!nickname) nickname = crew.user.globalName;
                displayname = nickname;
            }
            return embed.addFields({
                name: `${displayname}가 마지막으로 수정한 트리거`,
                value: `${item.content.substring(0, 64)} ...`
            });
        });
        interaction.reply({ embeds: [ embed ] });
    },
};