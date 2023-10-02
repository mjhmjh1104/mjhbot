const { SlashCommandBuilder, EmbedBuilder, ActionRowBuilder, ButtonBuilder, ButtonStyle, ComponentType, TextInputStyle, StringSelectMenuBuilder, StringSelectMenuOptionBuilder, ModalBuilder, TextInputBuilder } = require('discord.js');
const request = require('request');
const mysql = require('mysql2/promise');
const crypto = require('crypto');
const { loadConditions } = require('../chatbot.js');

const commandList = [
    {
        label: '조건: 일치',
        description: '지정한 문자열과 완전히 일치할 때',
        value: 'matchexact',
        modal: '일치하는 문자열을 지정'
    },
    {
        label: '조건: 포함',
        description: '지정한 문자열을 포함할 때',
        value: 'match',
        modal: '포함하는 문자열을 지정'
    },
    {
        label: '조건: 반응',
        description: '지정한 이모지로 반응할 때',
        value: 'onreact',
        modal: '유니코드 또는 정수 이모지 아이디로 반응하는 이모지를 지정'
    },
    {
        label: '조건: 멘션',
        description: '지정한 사람을 멘션할 때',
        value: 'mention',
        modal: '멘션되는 사람의 정수 유저 아이디를 지정'
    },
    {
        label: '한정: 확률',
        description: '지정한 확률로',
        value: 'chance',
        modal: '0과 100 사이의 수로 확률을 지정'
    },
    {
        label: '행동: 반응',
        description: '지정한 이모지로 반응하기',
        value: 'react',
        modal: '유니코드 또는 정수 이모지 아이디로 반응할 이모지를 지정'
    },
    {
        label: '행동: 전송',
        description: '지정한 메시지를 보내기',
        value: 'send',
        modal: '보낼 메시지를 지정'
    },
    {
        label: '행동: 랜덤',
        description: '지정한 메시지 중 하나를 보내기',
        value: 'sendrandom',
        modal: '보낼 메시지를 지정'
    }
];

function genID() {
    return crypto.randomBytes(16).toString('hex');
}

module.exports = {
    data: new SlashCommandBuilder ()
        .setName('편집raw')
        .setDescription('트리거를 JSON 형식으로 편집합니다.'),
    async execute(interaction, sql) {
        var embed = new EmbedBuilder ()
                .setColor(0x009900)
                .setTitle('트리거 RAW 편집')
        var select = new StringSelectMenuBuilder ()
            .setCustomId('trigger')
            .setPlaceholder('편집할 트리거 선택')
            .addOptions(
                new StringSelectMenuOptionBuilder ()
                    .setLabel('신규')
                    .setDescription('새 트리거 만들기')
                    .setValue('new')
            );
        const [ results, fields ] = await sql.query(`SELECT id, content FROM COMMANDS WHERE server = ${mysql.escape(interaction.guildId)};`);
        for (const item of results) {
            select.addOptions(
                new StringSelectMenuOptionBuilder ()
                    .setLabel(item.id)
                    .setDescription(`${item.content.substr(0, 30)}...`)
                    .setValue(item.id)
            );
        }
        select.addOptions(
            new StringSelectMenuOptionBuilder ()
                .setLabel('취소')
                .setDescription('이전 화면으로 돌아가기')
                .setValue('cancel')
        );
        const row = new ActionRowBuilder()
            .addComponents(select);
        interaction.reply({ embeds: [ embed ], components: [ row ] });
    },
    async menuSelect(interaction, sql) {
        if (interaction.message.interaction.user.id != interaction.user.id) {
            interaction.deferUpdate();
            return;
        }
        if (interaction.customId == 'trigger') {
            if (interaction.values[0] == 'cancel') {
                const embed = new EmbedBuilder ()
                    .setColor(0x990000)
                    .setTitle('취소됨');
                interaction.message.edit({ embeds: [ embed ], components: [ ] });
                interaction.deferUpdate();
                return;
            }
            const edit = new ButtonBuilder()
                .setCustomId('edit')
                .setLabel('편집')
                .setStyle(ButtonStyle.Primary);
            const cancel = new ButtonBuilder()
                .setCustomId('cancel')
                .setLabel('취소')
                .setStyle(ButtonStyle.Danger);
            const row = new ActionRowBuilder()
                .addComponents(edit, cancel);
            const embed = new EmbedBuilder ()
                .setColor(0x009900)
                .setTitle('트리거 RAW 편집')
                .addFields({
                    name: '트리거 ID',
                    value: interaction.values[0]
                });
            await interaction.message.edit({ embeds: [ embed ], components: [ row ] });
            interaction.deferUpdate();
            return;
        }
        interaction.deferUpdate();
    },
    async buttonPress(interaction, sql) {
        if (interaction.message.interaction.user.id != interaction.user.id) {
            interaction.deferUpdate();
            return;
        }
        if (interaction.customId == 'cancel') {
            const embed = new EmbedBuilder ()
                .setColor(0x990000)
                .setTitle('취소됨');
            interaction.message.edit({ embeds: [ embed ], components: [ ] });
            interaction.deferUpdate();
            return;
        } else if (interaction.customId == 'edit') {
            const modal = new ModalBuilder()
                .setCustomId('modal')
                .setTitle('RAW 편집');
            var input = new TextInputBuilder()
                .setCustomId('value')
                .setLabel('JSON 형식으로 입력합니다.')
                .setStyle(TextInputStyle.Paragraph);
            var id = null;
            if (interaction.message.embeds[0].data.fields) for (const item of interaction.message.embeds[0].data.fields) if (item.name == '트리거 ID') if (item.value != 'new') id = item.value;
            if (id) {
                const [ results, fields ] = await sql.query(`SELECT content FROM COMMANDS WHERE server = ${mysql.escape(interaction.guildId)} AND id = ${mysql.escape(id)};`);
                if (results.length < 1) {
                    var embed = new EmbedBuilder ()
                        .setColor(0x990000)
                        .setTitle('취소됨');
                    interaction.message.edit({ embeds: [ embed ] });
                    interaction.deferUpdate();
                    return;
                }
                input.setValue(results[0].content);
            }
            modal.addComponents(new ActionRowBuilder().addComponents(input));

            await interaction.showModal(modal);
            return;
        }
        interaction.deferUpdate();
    },
    async modalSubmit(interaction, sql) {
        if (interaction.message.interaction.user.id != interaction.user.id) {
            interaction.deferUpdate();
            return;
        }
        var embed = new EmbedBuilder ()
            .setColor(0x990000)
            .setTitle('제출되지 않음');
        try {
            var id = genID();
            
            var content = interaction.fields.getTextInputValue('value');
            var cnt = content.length;
            content = JSON.parse(content);
            for (item in content) {
                const value = content[item];
                if (!value) throw new Error ('empty value');
                if (!Array.isArray(value)) throw new Error ('not array');
                if (value.length < 1) throw new Error ('empty array');
                for (const i of value) {
                    if (typeof i !== 'string') throw new Error ('not string');
                    if (i.length < 1) throw new Error ('empty string');
                }
            }
            var created = true;
            if (interaction.message.embeds[0].data.fields) for (const item of interaction.message.embeds[0].data.fields) {
                if (item.name == '트리거 ID') {
                    if (item.value != 'new') {
                        id = item.value;
                        created = false;
                    }
                }
            }
            content = JSON.stringify(content);
            const [ results, fields ] = await sql.query(`REPLACE INTO COMMANDS (id, server, content, lastmodifieduser) VALUES (${mysql.escape(id)}, ${mysql.escape(interaction.guildId)}, ${mysql.escape(content)}, ${mysql.escape(interaction.user.id)})`);
            if (cnt > 0) {
                const [ results, fields ] = await sql.query(`REPLACE INTO COMMANDS (id, server, content, lastmodifieduser) VALUES (${mysql.escape(id)}, ${mysql.escape(interaction.guildId)}, ${mysql.escape(content)}, ${mysql.escape(interaction.user.id)})`);
                embed = new EmbedBuilder ()
                    .setColor(0x009900)
                    .setTitle('제출됨');
            } else if (!created) {
                await sql.query(`DELETE FROM COMMANDS where id = ${mysql.escape(id)}`);
                embed = new EmbedBuilder ()
                    .setColor(0x990000)
                    .setTitle('삭제됨');
            }
        } catch (e) {
            embed = new EmbedBuilder ()
                .setColor(0x990000)
                .setTitle('올바르지 않은 JSON');
        }
        interaction.message.edit({ embeds: [ embed ], components: [ ] });
        interaction.deferUpdate();
        loadConditions(sql);
        return;
    },
};