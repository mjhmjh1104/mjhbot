const { Client, Collection, Events, GatewayIntentBits, EmbedBuilder, ChannelType } = require('discord.js');
const { clientId, token, sdAPI, sqlPW, caToken } = require('./config.json');
const client = new Client ({ intents: [ GatewayIntentBits.Guilds, GatewayIntentBits.GuildMessageReactions, GatewayIntentBits.GuildMessages, GatewayIntentBits.MessageContent ] });
const request = require('request');
const fs = require('fs');
const path = require('path');
const CharacterAI = require('node_characterai');
const characterAI = new CharacterAI();
const axios = require('axios');
const mysql = require('mysql2/promise');

const { processMessageAll, processReactAll, loadConditions } = require('./chatbot.js');

const characterId = "0PvjXF5wB6TrNOlbtvWZ48gRgeYR_58vCHnQRxFcNao";
var char;

const padZero = (num) => (num < 10 ? '0' + num : num);

client.commands = new Collection ();

const positives = "best quality, masterpiece, ";
// const negatives = "(worst quality:1.4),(low quality:1.4),(censored:1.2),(over three finger\(fingers excluding thumb\):2),(fused anatomy),(bad anatomy\(body\)),(bad anatomy\(hand\)),(bad anatomy\(finger\)),(over four fingers\(finger\):2),(bad anatomy\(arms\)),(over two arms\(body\)),(bad anatomy\(leg\)),(over two legs\(body\)),(interrupted\(body, arm, leg, finger, toe\)),(bad anatomy\(arm\)),(bad detail\(finger\):1.2),(bad anatomy\(fingers\):1.2),(multiple\(fingers\):1.2),(bad anatomy\(finger\):1.2),(bad anatomy\(fingers\):1.2),(fused\(fingers\):1.2),(over four fingers\(finger\):2),(multiple\(hands\)),(multiple\(arms\)),(multiple\(legs\)),(over three toes\(toes excluding big toe\):2),(bad anatomy\(foot\)),(bad anatomy\(toe\)),(over four toes\(toe\):2),(bad detail\(toe\):1.2),(bad anatomy\(toes\):1.2),(multiple\(toes\):1.2),(bad anatomy\(toe\):1.2),(bad anatomy\(toes\):1.2),(fused\(toes\):1.2),(over four toes\(toe\):2),(multiple\(feet\))";
const negatives = "";

const commandsPath = path.join(__dirname, 'commands');
const commandFiles = fs.readdirSync(commandsPath).filter(file => file.endsWith('.js'));

for (const file of commandFiles) {
    const filePath = path.join(commandsPath, file);
    const command = require(filePath);
    if ('data' in command && 'execute' in command) {
        client.commands.set(command.data.name, command);
    } else {
        console.log(`[WARNING] The command at ${filePath} is missing a required "data" or "execute" property.`);
    }
}

const sql = mysql.createPool({
    host: '127.0.0.1',
    user: 'mjhbot',
    password: sqlPW,
    database: 'mjhbot',
    waitForConnections: true,
    enableKeepAlive: true
});

sql.query('CREATE TABLE IF NOT EXISTS LIST (id CHAR(100) NOT NULL UNIQUE, games INTEGER, glicko DOUBLE, price DOUBLE)');
sql.query('CREATE TABLE IF NOT EXISTS COMMANDS (id CHAR(32) PRIMARY KEY, server VARCHAR(25) NOT NULL, content TEXT, lastmodified TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP, lastmodifieduser VARCHAR(50) NOT NULL)');
sql.query('CREATE TABLE IF NOT EXISTS NOTIFY (id CHAR(100) NOT NULL UNIQUE)');
sql.query('CREATE TABLE IF NOT EXISTS MANAGING (server VARCHAR(25) NOT NULL UNIQUE, lim INTEGER NOT NULL, created TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP)');
sql.query('CREATE TABLE IF NOT EXISTS MANAGING_CHAN (server VARCHAR(25) NOT NULL, channel VARCHAR(25) NOT NULL, date DATE NOT NULL, cnt INTEGER NOT NULL DEFAULT 0)');
sql.query('CREATE TABLE IF NOT EXISTS BLOCK (id CHAR(100) NOT NULL UNIQUE)');

loadConditions(sql);

client.once(Events.ClientReady, async c => {
    console.log(`Ready! Logged in as ${c.user.tag}`);
});

if (!String.prototype.format) {
    String.prototype.format = function(...args) {
        return this.replace(/(\{\d+\})/g, function(a) {
            return args[+(a.substr(1, a.length - 2)) || 0];
        });
    };
}

async function generateArt(prompt) {
    const result = await axios.post('https://stablediffusionapi.com/api/v3/dreambooth', JSON.stringify({
        "key": sdAPI,
        "model_id": "fuwafuwamix",
        "prompt": positives + prompt,
        "negative_prompt": negatives,
        "width": "512",
        "height": "512",
        "samples": 1,
        "num_inference_steps": "30",
        "safety_checker": "no",
        "enhance_prompt": "yes",
        "seed": null,
        "guidance_scale": 7.5,
        "webhook": null,
        "track_id": null
    }), {
        headers: {
          "Content-Type": "application/json",
        },
    });
    console.log(JSON.stringify(result.data));
    if (result.data.output === undefined) return null;
    var len = result.data.output.length;
    var res = '';
    for (var i = 0; i < len; i++) if (result.data.output[i] !== undefined) res += result.data.output[i] + '\n';
    if (res.length == 0) return null;
    else return 'prompt: ' + positives + prompt + '\n' + res;
}

async function manage(command, message) {
    const args = command.split(' ').filter(n => n);
    console.log(args);
    if (args.length == 0) return;
    const cmd = args.shift().toLowerCase();
    // if (cmd == "정보") {
    //     const guild = message.guild;
    //     const channels = guild.channels.cache;
    //     if (args.length == 0) {
    //         let res = '';
    //         for (const [ id, item ] of channels) {
    //             if (item.type === 0) {
    //                 res += item + ' ';
    //                 res += item.name + ' ';
    //                 const [ results, fields ] = await sql.query(`SELECT cnt FROM MANAGING_CHAN WHERE server = ${mysql.escape(guild.id)} AND channel = ${mysql.escape(id)};`);
    //                 let curr = 0;
    //                 if (results.length > 0) curr = results[0]['cnt'];
    //                 res += curr + '\n';
    //             }
    //         }
    //         message.reply(res);
    //     } else {
    //         message.reply(JSON.stringify(channels.get(args[0])));
    //     }
    //     return;
    // }
    // if (cmd == "실행") {
    //     manageChannels();
    //     return;
    // }
}

const prefix = 'mb ', prefix_hanguel = 'ㅡㅠ ';

async function countMessage(message, chan) {
    const chanId = chan.id;
    const guildId = chan.guildId;
    const [ results, fields ] = await sql.query(`SELECT COUNT(1) FROM MANAGING WHERE server = ${mysql.escape(guildId)};`);
    if (results[0]['COUNT(1)'] === 0) return;
    const messages = await chan.messages.fetch({ limit: 100 });
    const oneMinuteAgo = Date.now() - 60000;
    const recentMessages = messages.filter(msg => msg.createdTimestamp >= oneMinuteAgo);
    const cnt = recentMessages.size;
    const dt = new Date ();
    await sql.query(`INSERT INTO MANAGING_CHAN (server, channel, date, cnt) VALUES (${mysql.escape(guildId)}, ${mysql.escape(chanId)}, '${dt.getFullYear()}-${padZero(dt.getMonth() + 1)}-${padZero(dt.getDate())}', ${mysql.escape(cnt)}) ON DUPLICATE KEY UPDATE cnt = cnt + ${mysql.escape(cnt)};`);
}

client.on(Events.MessageCreate, message => {
    if (message.author.bot) return;
    const chan = client.channels.cache.get(message.channelId);
    if (message.content.startsWith(prefix)) {
        manage(message.content.slice(prefix.length), message);
        return;
    }
    if (message.content.startsWith(prefix_hanguel)) {
        manage(message.content.slice(prefix_hanguel.length), message);
        return;
    }
    countMessage(message, chan);
    (async function () {
        const [ results, fields ] = await sql.query(`SELECT COUNT(1) FROM BLOCK WHERE id = ${mysql.escape(message.author.id)};`);
        if (results[0]['COUNT(1)'] !== 0) return;
        processMessageAll(message, chan);
    })();
});

client.on(Events.MessageReactionAdd, (reaction, user) => {
    const chan = client.channels.cache.get(reaction.message.channelId);
    processReactAll(reaction, chan);
});

client.on(Events.InteractionCreate, async interaction => {
    if (interaction.isChatInputCommand()) {
        const command = client.commands.get(interaction.commandName);
        if (!command) return;
        try {
            await command.execute(interaction, sql);
        } catch (error) {
            console.error(error);
            if (interaction.replied || interaction.deferred) {
                await interaction.followUp({ content: 'Error while executing command', ephemeral: true });
            } else {
                await interaction.reply({ content: 'Error while executing command', ephemeral: true });
            }
        }
    } else if (interaction.isButton()) {
        const command = client.commands.get(interaction.message.interaction.commandName);
        if (!command) return;
        try {
            await command.buttonPress(interaction, sql);
        } catch (error) {
            console.error(error);
            if (interaction.replied || interaction.deferred) {
                await interaction.followUp({ content: 'Error while executing command', ephemeral: true });
            } else {
                await interaction.reply({ content: 'Error while executing command', ephemeral: true });
            }
        }
    } else if (interaction.isStringSelectMenu()) {
        const command = client.commands.get(interaction.message.interaction.commandName);
        if (!command) return;
        try {
            await command.menuSelect(interaction, sql);
        } catch (error) {
            console.error(error);
            if (interaction.replied || interaction.deferred) {
                await interaction.followUp({ content: 'Error while executing command', ephemeral: true });
            } else {
                await interaction.reply({ content: 'Error while executing command', ephemeral: true });
            }
        }
    } else if (interaction.isModalSubmit()) {
        const command = client.commands.get(interaction.message.interaction.commandName);
        if (!command) return;
        try {
            await command.modalSubmit(interaction, sql);
        } catch (error) {
            console.error(error);
            if (interaction.replied || interaction.deferred) {
                await interaction.followUp({ content: 'Error while executing command', ephemeral: true });
            } else {
                await interaction.reply({ content: 'Error while executing command', ephemeral: true });
            }
        }
    } 
});

client.login(token);

process.on("unhandledRejection", async error => {
    console.error("Promise rejection:", error);
});

async function manageChannels() {
    const [ results, fields ] = await sql.query(`SELECT server, lim, created FROM MANAGING;`);
    for (server of results) {
        const guild = client.guilds.cache.get(server['server']);
        if (!guild.channels.cache.find(channel => channel.name === '대성호' && channel.type === ChannelType.GuildCategory)) {
            await guild.channels.create({
                name: '대성호',
                type: ChannelType.GuildCategory,
            });
        }
        if (!guild.channels.cache.find(channel => channel.name === '중성호' && channel.type === ChannelType.GuildCategory)) {
            await guild.channels.create({
                name: '중성호',
                type: ChannelType.GuildCategory,
            });
        }
        if (!guild.channels.cache.find(channel => channel.name === '소성호' && channel.type === ChannelType.GuildCategory)) {
            await guild.channels.create({
                name: '소성호',
                type: ChannelType.GuildCategory,
            });
        }
        const big = guild.channels.cache.find(channel => channel.name === '대성호' && channel.type === ChannelType.GuildCategory).id;
        const middle = guild.channels.cache.find(channel => channel.name === '중성호' && channel.type === ChannelType.GuildCategory).id;
        const small = guild.channels.cache.find(channel => channel.name === '소성호' && channel.type === ChannelType.GuildCategory).id;
        let bigs = [], smalls = [], middles = [];
        for (const [ id, item ] of guild.channels.cache) if (item.type === 0) {
            const [ results, fields ] = await sql.query(`SELECT cnt, date FROM MANAGING_CHAN WHERE server = ${mysql.escape(server['server'])} AND channel = ${mysql.escape(id)};`);
            let curr = 0;
            for (const item of results) {
                const currDate = new Date (item['date']).toLocaleString().split(',')[0];
                let dt = new Date();
                let valid = false;
                for (let i = 0; i < 7; i++) {
                    valid |= currDate === dt.toLocaleString().split(',')[0];
                    dt.setDate(dt.getDate() - 1);
                }
                if (!valid) {
                    await sql.query(`DELETE FROM MANAGING_CHAN WHERE server = ${mysql.escape(server['server'])} AND channel = ${mysql.escape(id)} AND date = '${item['date'].getFullYear()}-${padZero(item['date'].getMonth() + 1)}-${padZero(item['date'].getDate())}'`);
                    continue;
                }
                curr += item['cnt'];
            }
            if (curr >= server['lim']) {
                await item.setParent(big);
                bigs.push([ curr, item ]);
            } else if (curr == 0) {
                await item.setParent(small);
                smalls.push([ curr, item ]);
            } else {
                await item.setParent(middle);
                middles.push([ curr, item ]);
            }
        }
        bigs.sort(function compare(a, b) {
            return b[0] - a[0];
        });
        middles.sort(function compare(a, b) {
            return b[0] - a[0];
        });
        smalls.sort(function compare(a, b) {
            return b[0] - a[0];
        });
        let k = 0;
        for ([ _, item ] of bigs) {
            await item.setPosition(k);
            k++;
        }
        k = 0;
        for ([ _, item ] of middles) {
            await item.setPosition(k);
            k++;
        }
        k = 0;
        for ([ _, item ] of smalls) {
            await item.setPosition(k);
            k++;
        }
    }
    setChecker();
}

function setChecker() {
    var now = new Date();
    var millisTill10 = new Date(now.getFullYear(), now.getMonth(), now.getDate(), 15, 0, 0, 0) - now;
    while (millisTill10 < 0) millisTill10 += 86400000;
    setTimeout(manageChannels, millisTill10);
}

setChecker();