const { SlashCommandBuilder, EmbedBuilder, ActionRowBuilder, ButtonBuilder, ButtonStyle, ComponentType, TextInputStyle } = require('discord.js');
const request = require('request');
const mysql = require('mysql');

module.exports = {
    data: new SlashCommandBuilder ()
        .setName('알림')
        .setDescription('이 채널에서 주가 변동 알림을 받습니다.'),
    async execute(interaction, sql) {
        var id = interaction.channelId;
        sql.query(`SELECT COUNT(*) FROM NOTIFY WHERE id = '${id}'`, function (err, results, fields) {
            if (err) {
                var embed = new EmbedBuilder ();
                embed.setColor(0x990000)
                .setTitle('알림 설정 실패')
                .setDescription('데이터베이스 오류');
                interaction.reply({ embeds: [ embed ] });
                return;
            }
            var cnt = results[0]['COUNT(*)'];
            if (cnt > 0) {
                sql.query(`DELETE FROM NOTIFY WHERE id = '${id}'`, function (err, results, fields) {
                    if (err) {
                        var embed = new EmbedBuilder ();
                        embed.setColor(0x990000)
                        .setTitle('알림 설정 실패')
                        .setDescription('데이터베이스 오류');
                        interaction.reply({ embeds: [ embed ] });
                        return;
                    }
                    var embed = new EmbedBuilder ();
                    embed.setColor(0x009900)
                    .setTitle('알림 설정 성공')
                    .setDescription('앞으로 이 채널에서 주가 변동 알림을 받지 않습니다.');
                    interaction.reply({ embeds: [ embed ] });
                    return;
                });
            } else {
                sql.query(`INSERT INTO NOTIFY (id) VALUES ('${id}')`, function (err, results, fields) {
                    if (err) {
                        var embed = new EmbedBuilder ();
                        embed.setColor(0x990000)
                        .setTitle('알림 설정 실패')
                        .setDescription('데이터베이스 오류');
                        interaction.reply({ embeds: [ embed ] });
                        return;
                    }
                    var embed = new EmbedBuilder ();
                    embed.setColor(0x009900)
                    .setTitle('알림 설정 성공')
                    .setDescription('앞으로 이 채널에서 주가 변동 알림을 받습니다.');
                    interaction.reply({ embeds: [ embed ] });
                    return;
                });
            }
        });
    },
};