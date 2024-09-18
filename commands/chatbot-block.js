const { SlashCommandBuilder, EmbedBuilder, ActionRowBuilder, ButtonBuilder, ButtonStyle, ComponentType, TextInputStyle, StringSelectMenuBuilder, StringSelectMenuOptionBuilder, ModalBuilder, TextInputBuilder, ChannelType } = require('discord.js');
const request = require('request');
const mysql = require('mysql2/promise');

module.exports = {
    data: new SlashCommandBuilder ()
        .setName('차단')
        .setDescription('MJH Bot의 응답을 차단합니다. (서버 공통)')
        .addBooleanOption(function (option) {
            return option.setName('차단')
            .setDescription('false일 경우 차단 해제합니다.')
            .setRequired(true)
        }),
    async execute(interaction, sql) {
        const block = interaction.options.getBoolean('차단');
        if (block) {
            await sql.query(`INSERT INTO BLOCK (id) VALUES (${mysql.escape(interaction.user.id)});`);
            interaction.reply('차단 완료');
        } else {
            await sql.query(`DELETE FROM BLOCK WHERE id = ${mysql.escape(interaction.user.id)};`);
            interaction.reply('차단 해제 완료');
        }
    },
};