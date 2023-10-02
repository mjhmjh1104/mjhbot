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
    },
    {
        label: '행동: 랜덤(일별)',
        description: '지정한 메시지 중 하나를 보내기',
        value: 'sendrandomdaily',
        modal: '보낼 메시지를 지정'
    }
];

function genID() {
    return crypto.randomBytes(16).toString('hex');
}

module.exports = {
    data: new SlashCommandBuilder ()
        .setName('편집')
        .setDescription('트리거를 편집합니다.'),
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
        var embed = new EmbedBuilder ()
                .setColor(0x009900)
                .setTitle('트리거 편집')
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
        const row = new ActionRowBuilder()
            .addComponents(select);
        interaction.reply({ embeds: [ embed ], components: [ row ] });
    },
    async buttonPress(interaction, sql) {
        if (interaction.message.interaction.user.id != interaction.user.id) {
            interaction.deferUpdate();
            return;
        }
        await interaction.message.edit({ components: [ ] });
        if (interaction.customId == 'cancel') {
            var embed = new EmbedBuilder ()
                .setColor(0x990000)
                .setTitle('취소됨');
            interaction.message.edit({ embeds: [ embed ] });
            interaction.deferUpdate();
            return;
        } else if (interaction.customId == 'add') {
            var select = new StringSelectMenuBuilder ()
                .setCustomId('type')
                .setPlaceholder('추가할 옵션 선택')
            for (const item of commandList) {
                select.addOptions(
                    new StringSelectMenuOptionBuilder ()
                        .setLabel(item.label)
                        .setDescription(item.description)
                        .setValue(item.value)
                );
            }
            select.addOptions(
                new StringSelectMenuOptionBuilder ()
                    .setLabel('취소')
                    .setDescription('이전 화면으로 돌아가기')
                    .setValue('cancel'),
            );
            const row = new ActionRowBuilder()
                .addComponents(select);
            interaction.message.edit({ components: [ row ] });
            interaction.deferUpdate();
            return;
        } else if (interaction.customId == 'remove') {
            var select = new StringSelectMenuBuilder ()
                .setCustomId('remove')
                .setPlaceholder('제거할 옵션 선택')
            var k = 0;
            if (interaction.message.embeds[0].data.fields) for (const item of interaction.message.embeds[0].data.fields) {
                for (const command of commandList) if (command.label === item.name) {
                    select.addOptions(
                        new StringSelectMenuOptionBuilder ()
                            .setLabel(item.name)
                            .setDescription(item.value)
                            .setValue(k.toString())
                    );
                }
                k++;
            }
            select.addOptions(
                new StringSelectMenuOptionBuilder ()
                    .setLabel('취소')
                    .setDescription('이전 화면으로 돌아가기')
                    .setValue('cancel'),
            );
            const row = new ActionRowBuilder()
                .addComponents(select);
            interaction.message.edit({ components: [ row ] });
            interaction.deferUpdate();
            return;
        } else if (interaction.customId == 'submit') {
            var id = genID();
            var content = { };
            var cnt = 0;
            var created = true;
            if (interaction.message.embeds[0].data.fields) for (const item of interaction.message.embeds[0].data.fields) {
                if (item.name == '트리거 ID') {
                    if (item.value != 'new') {
                        id = item.value;
                        created = false;
                    }
                } else {
                    cnt++;
                    for (const command of commandList) if (command.label == item.name) {
                        if (content[command.value] === undefined) content[command.value] = [];
                        content[command.value].push(item.value);
                    }
                }
            }
            content = JSON.stringify(content);
            var embed = new EmbedBuilder ()
                .setColor(0x990000)
                .setTitle('제출되지 않음');
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
            interaction.message.edit({ embeds: [ embed ] });
            interaction.deferUpdate();
            loadConditions(sql);
            return;
        } else if (interaction.customId == 'delete') {
            var embed = new EmbedBuilder ()
                .setColor(0x009900)
                .setTitle('트리거 편집')
            if (interaction.message.embeds[0].data.fields) for (const item of interaction.message.embeds[0].data.fields) {
                if (item.name == '트리거 ID') {
                    embed.addFields({
                        name: item.name,
                        value: item.value
                    });
                }
            }
            const { row } = await this.mainMenu();
            await interaction.message.edit({ embeds: [ embed ], components: [ row ] });
            interaction.deferUpdate();
            return;
        }
        interaction.deferUpdate();
    },
    async menuSelect(interaction, sql) {
        if (interaction.message.interaction.user.id != interaction.user.id) {
            interaction.deferUpdate();
            return;
        }
        if (interaction.customId == 'trigger') {
            if (interaction.values[0] == 'cancel') {
                var embed = new EmbedBuilder ()
                    .setColor(0x990000)
                    .setTitle('취소됨');
                interaction.message.edit({ embeds: [ embed ], components: [ ] });
                interaction.deferUpdate();
                return;
            }
            await interaction.message.edit({ components: [ ] });
            var embed = new EmbedBuilder (interaction.message.embeds[0])
                .addFields({
                    name: '트리거 ID',
                    value: interaction.values[0]
                });
            if (interaction.values[0] != 'new') {
                const [ results, fields ] = await sql.query(`SELECT content FROM COMMANDS WHERE id = ${mysql.escape(interaction.values[0])};`);
                if (results.length > 0) {
                    const content = JSON.parse(results[0].content);
                    for (const item in content) for (const command of commandList) if (command.value == item) for (const value of content[item]) embed.addFields({
                        name: command.label,
                        value: value
                    });
                }
            }
            const { row } = await this.mainMenu();
            await interaction.message.edit({ embeds: [ embed ], components: [ row ] });
            interaction.deferUpdate();
            return;
        } else if (interaction.customId == 'type') {
            if (interaction.values[0] == 'cancel') {
                const { row } = await this.mainMenu();
                await interaction.message.edit({ components: [ row ] });
                interaction.deferUpdate();
                return;
            }
            for (const item of commandList) if (interaction.values[0] == item.value) {
                const modal = new ModalBuilder()
                    .setCustomId(item.value)
                    .setTitle(item.label);
                const input = new TextInputBuilder()
                    .setCustomId('value')
                    .setLabel(item.modal)
                    .setStyle(TextInputStyle.Paragraph);
                modal.addComponents(new ActionRowBuilder().addComponents(input));

                await interaction.showModal(modal);
                return;
            }
        } else if (interaction.customId == 'remove') {
            if (interaction.values[0] == 'cancel') {
                const { row } = await this.mainMenu();
                await interaction.message.edit({ components: [ row ] });
                interaction.deferUpdate();
                return;
            }
            var embed = new EmbedBuilder ()
                .setColor(0x009900)
                .setTitle('트리거 편집')
            var k = 0;
            if (interaction.message.embeds[0].data.fields) for (const item of interaction.message.embeds[0].data.fields) {
                if (interaction.values[0] != k) {
                    embed.addFields({
                        name: item.name,
                        value: item.value
                    });
                }
                k++;
            }
            const { row } = await this.mainMenu();
            await interaction.message.edit({ embeds: [ embed ], components: [ row ] });
            interaction.deferUpdate();
            return;
        }
        interaction.deferUpdate();
    },
    async modalSubmit(interaction, sql) {
        if (interaction.message.interaction.user.id != interaction.user.id) {
            interaction.deferUpdate();
            return;
        }
        await interaction.message.edit({ components: [ ] });
        for (const item of commandList) if (interaction.customId == item.value) {
            const embed = new EmbedBuilder (interaction.message.embeds[0])
                .addFields({
                    name: item.label,
                    value: interaction.fields.getTextInputValue('value').toLowerCase()
                });
            const { row } = await this.mainMenu();
            await interaction.message.edit({ embeds: [ embed ], components: [ row ] });
            interaction.deferUpdate();
            return;
        }
        interaction.deferUpdate();
    },
};