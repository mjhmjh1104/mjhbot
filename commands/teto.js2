const { SlashCommandBuilder, EmbedBuilder, ActionRowBuilder, ButtonBuilder, ButtonStyle, ComponentType, TextInputStyle } = require('discord.js');
const request = require('request');

module.exports = {
    data: new SlashCommandBuilder ()
        .setName('상장')
        .setDescription('Tetra League 계정을 상장합니다.')
        .addStringOption(option => option.setName('닉네임').setDescription('상장할 계정').setRequired(true)),
    async execute(interaction, sql) {

        const nick = interaction.options.getString('닉네임');
        if (!nick) {
            var embed = new EmbedBuilder ();
            embed.setColor(0x990000)
            .setTitle('상장 실패')
            .setDescription("계정이 존재하지 않음");
            interaction.reply({ embeds: [ embed ] });
            return;
        }
        request({
            uri: 'https://ch.tetr.io/api/users/' + nick,
            qs: {}
        }, (err, res, body) => {
            if (err) {
                var embed = new EmbedBuilder ();
                embed.setColor(0x990000)
                .setTitle('상장 실패')
                .setDescription("서버 오류");
                interaction.reply({ embeds: [ embed ] });
                return;
            }
            try {
                const qry = JSON.parse(body);
                if (!qry.success) {
                    var embed = new EmbedBuilder ();
                    embed.setColor(0x990000)
                    .setTitle('상장 실패')
                    .setDescription("계정이 존재하지 않음");
                    interaction.reply({ embeds: [ embed ] });
                    return;
                }
                sql.query(`SELECT COUNT(*) FROM LIST WHERE id = '${qry.data.user.username.toUpperCase()}'`, function (err, results, fields) {
                    if (err) {
                        var embed = new EmbedBuilder ();
                        embed.setColor(0x990000)
                        .setTitle('상장 실패')
                        .setDescription("데이터베이스 오류");
                        interaction.reply({ embeds: [ embed ] });
                        return;
                    }
                    var cnt = results[0]['COUNT(*)'];
                    var embed = new EmbedBuilder ();
                    var flag = '';
                    if (qry.data.user.country) flag = `:flag_${qry.data.user.country.toLowerCase()}: `
                    if (cnt > 0) {
                        embed.setColor(0x009900)
                        .setTitle('계정을 상장 폐지합니다.')
                        .setDescription(`${flag}**${qry.data.user.username.toUpperCase()}**`)
                        .addFields({ name: 'Games Played', value: qry.data.user.gamesplayed.toString(), inline: true })
                        .addFields({ name: 'Games Won', value: qry.data.user.gameswon.toString(), inline: true })
                        .addFields({ name: 'Playtime', value: (qry.data.user.gametime / 3600).toFixed(1) + ' hours' })
                        .addFields({ name: 'Rating', value: qry.data.user.league.rating.toFixed(2).toString(), inline: true })
                        .addFields({ name: 'Glicko', value: qry.data.user.league.glicko.toFixed(2).toString(), inline: true });
                    } else if (qry.data.user.league.rating < 0) {
                        embed.setColor(0x990000)
                        .setTitle('Tetra League 플레이 기록이 없습니다.')
                        .setDescription(`${flag}**${qry.data.user.username.toUpperCase()}**`)
                        .addFields({ name: 'Games Played', value: qry.data.user.gamesplayed.toString(), inline: true })
                        .addFields({ name: 'Games Won', value: qry.data.user.gameswon.toString(), inline: true })
                        .addFields({ name: 'Playtime', value: (qry.data.user.gametime / 3600).toFixed(1) + ' hours' });
                        interaction.reply({ embeds: [ embed ] });
                        return;
                    } else if (qry.data.user.league.rank == 'a+' || qry.data.user.league.rank == 's-' || qry.data.user.league.rank == 's' || qry.data.user.league.rank == 's+' || qry.data.user.league.rank == 'ss' || qry.data.user.league.rank == 'u' || qry.data.user.league.rank == 'x') {
                        embed.setColor(0x009900)
                        .setTitle('계정을 상장합니다.')
                        .setDescription(`${flag}**${qry.data.user.username.toUpperCase()}**`)
                        .addFields({ name: 'Games Played', value: qry.data.user.gamesplayed.toString(), inline: true })
                        .addFields({ name: 'Games Won', value: qry.data.user.gameswon.toString(), inline: true })
                        .addFields({ name: 'Playtime', value: (qry.data.user.gametime / 3600).toFixed(1) + ' hours' })
                        .addFields({ name: 'Rating', value: qry.data.user.league.rating.toFixed(2).toString(), inline: true })
                        .addFields({ name: 'Glicko', value: qry.data.user.league.glicko.toFixed(2).toString(), inline: true });
                    } else {
                        embed.setColor(0x990000)
                        .setTitle('A+ 이상만 상장할 수 있습니다.')
                        .setDescription(`${flag}**${qry.data.user.username.toUpperCase()}**`)
                        .addFields({ name: 'Games Played', value: qry.data.user.gamesplayed.toString(), inline: true })
                        .addFields({ name: 'Games Won', value: qry.data.user.gameswon.toString(), inline: true })
                        .addFields({ name: 'Playtime', value: (qry.data.user.gametime / 3600).toFixed(1) + ' hours' })
                        .addFields({ name: 'Rating', value: qry.data.user.league.rating.toFixed(2).toString(), inline: true })
                        .addFields({ name: 'Glicko', value: qry.data.user.league.glicko.toFixed(2).toString(), inline: true });
                        interaction.reply({ embeds: [ embed ] });
                        return;
                    }
                    const confirm = new ButtonBuilder()
                        .setCustomId('ok')
                        .setLabel(cnt > 0 ? '상장 폐지' : '상장')
                        .setStyle(ButtonStyle.Primary);
                    const cancel = new ButtonBuilder()
                        .setCustomId('cancel')
                        .setLabel('취소')
                        .setStyle(ButtonStyle.Secondary);
                    const row = new ActionRowBuilder()
                        .addComponents(cancel, confirm);
                    interaction.reply({ embeds: [ embed ], components: [ row ] });
                });
            } catch (e) {
                interaction.reply('Error on processing query: ' + e);
                return;
            }
        });
    },
    async buttonPress(interaction, sql) {
        if (interaction.message.interaction.user.id != interaction.user.id) return;
        interaction.message.edit({ components: [ ] });
        if (interaction.customId == 'cancel') {
            interaction.deferUpdate();
            return;
        }
        var nick = interaction.message.embeds[0].description.split('**')[1].toLowerCase();
        if (!nick) {
            var embed = new EmbedBuilder ();
            embed.setColor(0x990000)
            .setTitle('상장 실패')
            .setDescription("계정이 존재하지 않음");
            interaction.reply({ embeds: [ embed ] });
            return;
        }
        request({
            uri: 'https://ch.tetr.io/api/users/' + nick,
            qs: {}
        }, (err, res, body) => {
            if (err) {
                var embed = new EmbedBuilder ();
                embed.setColor(0x990000)
                .setTitle('상장 실패')
                .setDescription("계정이 존재하지 않음");
                interaction.reply({ embeds: [ embed ] });
                return;
            }
            try {
                const qry = JSON.parse(body);
                if (!qry.success) {
                    var embed = new EmbedBuilder ();
                    embed.setColor(0x990000)
                    .setTitle('상장 실패')
                    .setDescription("서버 오류");
                    interaction.reply({ embeds: [ embed ] });
                    return;
                }
                sql.query(`SELECT COUNT(*) FROM LIST WHERE id = '${qry.data.user.username.toUpperCase()}'`, function (err, results, fields) {
                    if (err) {
                        var embed = new EmbedBuilder ();
                        embed.setColor(0x990000)
                        .setTitle('상장 실패')
                        .setDescription("데이터베이스 오류");
                        interaction.reply({ embeds: [ embed ] });
                        return;
                    }
                    var cnt = results[0]['COUNT(*)'];
                    var embed = new EmbedBuilder ();
                    var flag = '';
                    if (qry.data.user.country) flag = `:flag_${qry.data.user.country.toLowerCase()}: `
                    if (cnt) {
                        sql.query(`DELETE FROM LIST WHERE id = '${qry.data.user.username.toUpperCase()}'`, function (err, results, fields) {
                            if (err) {
                                var embed = new EmbedBuilder ();
                                embed.setColor(0x990000)
                                .setTitle('상장 폐지 실패')
                                .setDescription("데이터베이스 오류");
                                console.log(err);
                                interaction.reply({ embeds: [ embed ] });
                                return;
                            }
                            var embed = new EmbedBuilder ();
                            embed.setColor(0x009900)
                            .setTitle('상장 폐지 성공')
                            .setDescription(`${flag}**${qry.data.user.username.toUpperCase()}**`)
                            .addFields({ name: 'Games Played', value: qry.data.user.league.gamesplayed.toString() })
                            .addFields({ name: 'Glicko', value: qry.data.user.league.glicko.toFixed(2).toString(), inline: true })
                            .addFields({ name: 'Price', value: '상장 폐지됨', inline: true });
                            interaction.reply({ embeds: [ embed ] });
                        });
                    } else if (qry.data.user.league.rating < 0 || !(qry.data.user.league.rank == 'a+' || qry.data.user.league.rank == 's-' || qry.data.user.league.rank == 's' || qry.data.user.league.rank == 's+' || qry.data.user.league.rank == 'ss' || qry.data.user.league.rank == 'u' || qry.data.user.league.rank == 'x')) {
                        embed.setColor(0x990000)
                        .setTitle('상장 실패')
                        .setDescription("A+ 이상만 상장할 수 있습니다.");
                        interaction.reply({ embeds: [ embed ] });
                        return;
                    } else {
                        var price = 10000;
                        var sumPrice = 0, sumGlicko = 0;
                        sql.query('SELECT id, games, glicko, price FROM LIST', function (err, results, fields) {
                            if (err) {
                                embed.setColor(0x990000)
                                .setTitle('상장 실패')
                                .setDescription("데이터베이스 오류");
                                interaction.reply({ embeds: [ embed ] });
                                return;
                            }
                            if (results.length > 0) {
                                results.forEach(function (item) {
                                    sumPrice += item.price;
                                    sumGlicko += item.glicko;
                                });
                                price = qry.data.user.league.glicko / sumGlicko * sumPrice;
                            } else price = qry.data.user.league.glicko * 10;
                            sql.query(`INSERT INTO LIST (id, games, glicko, price) VALUES ('${qry.data.user.username.toUpperCase()}', ${qry.data.user.league.gamesplayed}, ${qry.data.user.league.glicko}, ${price})`, function (err, results, fields) {
                                if (err) {
                                    embed.setColor(0x990000)
                                    .setTitle('상장 실패')
                                    .setDescription("데이터베이스 오류");
                                    interaction.reply({ embeds: [ embed ] });
                                    return;
                                }
                                var embed = new EmbedBuilder ();
                                embed.setColor(0x009900)
                                .setTitle('상장 성공')
                                .setDescription(`${flag}**${qry.data.user.username.toUpperCase()}**`)
                                .addFields({ name: 'Games Played', value: qry.data.user.league.gamesplayed.toString() })
                                .addFields({ name: 'Glicko', value: qry.data.user.league.glicko.toFixed(2).toString(), inline: true })
                                .addFields({ name: 'Price', value: price.toFixed(0).toString(), inline: true });
                                interaction.reply({ embeds: [ embed ] });
                            });
                        });
                    }
                });
            } catch (e) {
                interaction.reply('Error on processing query: ' + e);
                return;
            }
        });
        // embed.setColor(0x009900)
        // .setTitle('계정이 상장되었습니다.')
    },
};