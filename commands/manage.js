const { SlashCommandBuilder, EmbedBuilder, ActionRowBuilder, ButtonBuilder, ButtonStyle, ComponentType, TextInputStyle, StringSelectMenuBuilder, StringSelectMenuOptionBuilder, ModalBuilder, TextInputBuilder, ChannelType } = require('discord.js');
const request = require('request');
const mysql = require('mysql2/promise');

module.exports = {
    data: new SlashCommandBuilder ()
        .setName('관리')
        .setDescription('각 채널의 활성도에 따라 자동으로 관리합니다.')
        .addBooleanOption(function (option) {
            return option.setName('활성화')
            .setDescription('관리를 시작하거나 중단합니다.')
            .setRequired(true)
        })
        .addIntegerOption(function (option) {
            return option.setName('대성호')
            .setDescription('대성호 제한을 설정합니다. 클수록 대성호가 되기 어렵습니다. (기본값: 10000)')
        }),
    async mainMenu() {
        const confirm = new ButtonBuilder()
            .setCustomId('submit')
            .setLabel('제출')
            .setStyle(ButtonStyle.Primary);
        const cancel = new ButtonBuilder()
            .setCustomId('cancel')
            .setLabel('취소')
            .setStyle(ButtonStyle.Danger);
        const add = new ButtonBuilder()
            .setCustomId('add')
            .setLabel('추가')
            .setStyle(ButtonStyle.Secondary);
        const remove = new ButtonBuilder()
            .setCustomId('remove')
            .setLabel('삭제')
            .setStyle(ButtonStyle.Secondary);
        const del = new ButtonBuilder()
            .setCustomId('delete')
            .setLabel('모두 삭제')
            .setStyle(ButtonStyle.Danger);
        const row = new ActionRowBuilder()
            .addComponents(add, remove, confirm, cancel, del);
        return { row: row };
    },
    async execute(interaction, sql) {
        if (!interaction.member?.permissions.has('ADMINISTRATOR')) {
            const embed = new EmbedBuilder ()
                .setColor(0x990000)
                .setTitle('권한이 없습니다.');
            interaction.reply({ embeds: [ embed ] });
            return;
        }
        const lim = interaction.options.getInteger('대성호') ?? 10000;
        const [ results, fields ] = await sql.query(`SELECT lim FROM MANAGING WHERE server = ${mysql.escape(interaction.guildId)};`);
        if (results.length === 0) {
            if (!interaction.options.getBoolean('활성화')) {
                const embed = new EmbedBuilder ()
                    .setColor(0x990000)
                    .setTitle('서버 관리 중이 아닙니다.');
                interaction.reply({ embeds: [ embed ] });
                return;
            }
            const embed = new EmbedBuilder ()
                .setColor(0x009900)
                .setTitle('서버 관리 시작');
            embed.addFields({
                name: '대성호 제한',
                value: `${lim}`
            });
            const ok = new ButtonBuilder()
                .setCustomId('on')
                .setLabel('시작')
                .setStyle(ButtonStyle.Primary);
            const cancel = new ButtonBuilder()
                .setCustomId('cancel')
                .setLabel('취소')
                .setStyle(ButtonStyle.Danger);
            const row = new ActionRowBuilder()
                .addComponents(ok, cancel);
            interaction.reply({ embeds: [ embed ], components: [ row ] });
        } else {
            if (!interaction.options.getBoolean('활성화')) {
                const embed = new EmbedBuilder ()
                    .setColor(0x009900)
                    .setTitle('서버 관리 중단');
                const ok = new ButtonBuilder()
                    .setCustomId('off')
                    .setLabel('중단')
                    .setStyle(ButtonStyle.Danger);
                const cancel = new ButtonBuilder()
                    .setCustomId('cancel')
                    .setLabel('취소')
                    .setStyle(ButtonStyle.Danger);
                const row = new ActionRowBuilder()
                    .addComponents(ok, cancel);
                interaction.reply({ embeds: [ embed ], components: [ row ] });
                return;
            }
            await sql.query(`UPDATE MANAGING SET lim = ${mysql.escape(lim)} WHERE server = ${mysql.escape(interaction.guildId)};`);
            const embed = new EmbedBuilder ()
                .setColor(0x009900)
                .setTitle('수정 완료');
            embed.addFields({
                name: '대성호 제한',
                value: `${results[0]['lim']} → ${lim}`
            });
            interaction.reply({ embeds: [ embed ] });
        }
    },
    async buttonPress(interaction, sql) {
        interaction.deferUpdate();
        if (interaction.message.interaction.user.id != interaction.user.id) return;
        await interaction.message.edit({ components: [ ] });
        if (interaction.customId == 'cancel') {
            var embed = new EmbedBuilder ()
                .setColor(0x990000)
                .setTitle('취소됨');
            interaction.message.edit({ embeds: [ embed ] });
            return;
        } else if (interaction.customId == 'on') {
            const lim = 10000;
            if (interaction.message.embeds[0].data.fields) for (const item of interaction.message.embeds[0].data.fields) if (item.name == '대성호 제한') id = item.value;
            await sql.query(`INSERT INTO MANAGING (server, lim) VALUES (${mysql.escape(interaction.guildId)}, ${mysql.escape(lim)})`);
            if (!interaction.guild.channels.cache.find(channel => channel.name === '대성호' && channel.type === ChannelType.GuildCategory)) {
                await interaction.guild.channels.create({
                    name: '대성호',
                    type: ChannelType.GuildCategory,
                });
            }
            if (!interaction.guild.channels.cache.find(channel => channel.name === '중성호' && channel.type === ChannelType.GuildCategory)) {
                await interaction.guild.channels.create({
                    name: '중성호',
                    type: ChannelType.GuildCategory,
                });
            }
            if (!interaction.guild.channels.cache.find(channel => channel.name === '소성호' && channel.type === ChannelType.GuildCategory)) {
                await interaction.guild.channels.create({
                    name: '소성호',
                    type: ChannelType.GuildCategory,
                });
            }
            const middle = interaction.guild.channels.cache.find(channel => channel.name === '중성호' && channel.type === ChannelType.GuildCategory).id;
            for (const [ id, item ] of interaction.guild.channels.cache) if (item.type === 0) {
                item.setParent(middle);
            }
            const embed = new EmbedBuilder ()
                .setColor(0x009900)
                .setTitle('완료됨');
            interaction.message.edit({ embeds: [ embed ] });
        } else if (interaction.customId == 'off') {
            await sql.query(`DELETE FROM MANAGING WHERE server = ${mysql.escape(interaction.guildId)};`);
            await sql.query(`DELETE FROM MANAGING_CHAN WHERE server = ${mysql.escape(interaction.guildId)};`);
            const embed = new EmbedBuilder ()
                .setColor(0x009900)
                .setTitle('완료됨');
            interaction.message.edit({ embeds: [ embed ] });
        }
    },
};