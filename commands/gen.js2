const { SlashCommandBuilder, EmbedBuilder, ActionRowBuilder, ButtonBuilder, ButtonStyle, ComponentType, TextInputStyle } = require('discord.js');
const request = require('request');

module.exports = {
    data: new SlashCommandBuilder ()
        .setName('생성')
        .setDescription('AI 그림을 생성합니다.')
        .addStringOption(option => option.setName('긍정').setDescription('그림에 포함할 프롬프트').setRequired(true))
        .addStringOption(option => option.setName('부정').setDescription('그림에 포함하지 않을 프롬프트').setRequired(false))
        .addIntegerOption(option => option.setName('단계').setDescription('1과 150 사이의 정수, 기본값 20').setRequired(false)),
    async execute(interaction, sql) {
        interaction.reply('hello');
    },
};