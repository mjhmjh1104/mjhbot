const { Client, Collection, Events, GatewayIntentBits, EmbedBuilder } = require('discord.js');
const { clientId, token, sdAPI, sqlPW } = require('./config.json');
const client = new Client ({ intents: [ GatewayIntentBits.Guilds, GatewayIntentBits.GuildMessageReactions, GatewayIntentBits.GuildMessages, GatewayIntentBits.MessageContent ] });
const request = require('request');
const fs = require('fs');
const path = require('path');
const CharacterAI = require('node_characterai');
const characterAI = new CharacterAI();
const axios = require('axios');
const mysql = require('mysql');

const characterId = "0PvjXF5wB6TrNOlbtvWZ48gRgeYR_58vCHnQRxFcNao";
var char;

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

const sql = mysql.createConnection({
    host: '127.0.0.1',
    user: 'mjhbot',
    password: sqlPW,
    database: 'mjhbot'
});
sql.connect();

sql.query('CREATE TABLE IF NOT EXISTS LIST (id CHAR(100) NOT NULL UNIQUE, games INTEGER, glicko DOUBLE, price DOUBLE)');
sql.query('CREATE TABLE IF NOT EXISTS NOTIFY (id CHAR(100) NOT NULL UNIQUE)');

const conditions = JSON.parse(fs.readFileSync('condition.json', 'utf8'));
var messageConditions = [ ];
var reactConditions = [ ];

conditions.forEach(item => {
    if (item.match != undefined || item.matchexact != undefined) messageConditions.push(item);
    if (item.onreact != undefined) reactConditions.push(item);
});

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

function inappropriate(x) {
    return x.includes("씨발") || x.includes("병신") || x.includes("죽어");
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
    if (cmd == "ㅅㄷ새" || cmd == 'teto' || cmd == "테토" || cmd == "xpxh") {
        if (args.length < 1) {
            message.reply('Wrong query');
            return;
        }
        request({
            uri: 'https://ch.tetr.io/api/users/' + args[0],
            qs: {}
        }, (err, res, body) => {
            if (err) {
                message.reply('Error on server');
                return;
            }
            try {
                const qry = JSON.parse(body);
                if (!qry.success) {
                    message.reply('No such user');
                    return;
                }
                var str = '';
                str += 'Username: ' + qry.data.user.username + '\n';
                str += 'Won ' + qry.data.user.gameswon + ' of ' + qry.data.user.gamesplayed + ' games\n';
                str += 'Played for ' + (qry.data.user.gametime / 3600).toFixed(1) + ' hours\n';
                str += 'Rating: ' + qry.data.user.league.rating.toFixed(2) + '\n';
                str += 'Glicko: ' + qry.data.user.league.glicko.toFixed(2) + '\n';
                // console.log(qry.data.user.league);
                message.reply(str);
            } catch (e) {
                message.reply('Error on processing query');
                return;
            }
        });
    }
    // if (cmd == "상장" || cmd == "tkdwkd" || cmd == "리스트" || cmd == "list") {
    //     if (args.length < 1) {
    //         message.reply('Wrong query');
    //         return;
    //     }
    //     request({
    //         uri: 'https://ch.tetr.io/api/users/' + args[0],
    //         qs: {}
    //     }, (err, res, body) => {
    //         if (err) {
    //             message.reply('Error on server');
    //             return;
    //         }
    //         try {
    //             const qry = JSON.parse(body);
    //             if (!qry.success) {
    //                 message.reply('No such user');
    //                 return;
    //             }
    //             str = '';
    //             var username = qry.data.user.username;
    //             var glicko = qry.data.user.league.glicko;
    //             str += username + '(Glicko ' + glicko + ') 상장합니까?\n';
    //             const rep = message.reply(str);
    //         } catch (e) {
    //             message.reply('Error on processing query');
    //             return;
    //         }
    //     });
    //     return;
    // }
    if (cmd == "오마" || cmd == "코키치" || cmd == "dhak" || cmd == "zhzlcl" || cmd == "ouma" || cmd == "oma" || cmd == "kokichi" || cmd == "ㅐㅕㅡㅁ" || cmd == "ㅐㅡㅁ" || cmd == "ㅏㅐㅏㅑ초ㅑ" || cmd == "王馬" || cmd == "小吉" || cmd == "王馬小吉" || cmd == "오마코키치" || cmd == "dhakzhzlcl") {
        try {
            console.log(args);
            if (args.length == 0) return;
            if (args.length > 0 && args[0] == 'AUTH') {
                if (characterAI.isAuthenticated()) {
                    message.reply('이미 생성됨');
                    return;
                } else {
                    await message.reply('세션 생성 중');
                    await characterAI.authenticateAsGuest();
                    await message.reply('세션 생성 완료, 연결 중');
                    chat = await characterAI.createOrContinueChat(characterId);
                    message.reply('연결 완료');
                    return;
                }
            }
            if (args.length > 0 && args[0] == 'DESTROY') {
                if (characterAI.isAuthenticated()) {
                    message.reply('세션 파기 중');
                    await characterAI.unauthenticate();
                    message.reply('세션 파기 완료');
                    return;
                } else {
                    message.reply('생성되지 않음');
                    return;
                }
            }
            if (!characterAI.isAuthenticated()) {
                message.reply('세션 없음');
                return;
            }
            if (args.length > 0 && args[0] == 'RESET') {
                message.reply('초기화 중');
                await chat.saveAndStartNewChat();
                message.reply('초기화 완료');
                return;
            }
            if (args.length > 0) script = args.join(' ');
            message.reply('User: ' + script);
            const response = await chat.sendAndAwaitResponse(script, true)
            console.log(response.text);
            message.reply('Kokichi Oma: ' + response.text);
        } catch (e) {
            if (e && e.text) message.reply('나중에 시도하십시오');
            else message.reply('오류 발생: ' + e.toString().substring(0, 2000));
        }
        return;
    }
    // if (cmd == "그림" || cmd == "이미지" || cmd == "로리" || cmd == "img" || cmd == "image" || cmd == "loli") {
    //     if (args.length == 0) return;
    //     var result = await generateArt(args.join(' '));
    //     while (result === null) {
    //         message.reply('재시도 중');
    //         result = await generateArt(args.join(' '));
    //     }
    //     message.reply(result);
    //     return;
    // }
}

function getSpamton() {
    var idx = Math.floor(Math.random() * sptr.length);
    return sptr[idx];
}

const prefix = 'mb ', prefix_hanguel = 'ㅡㅠ ';

function include(x, y) {
    if (x === undefined) return false;
    if (x === y) return true;
    if (Array.isArray(x) && x.includes(y)) return true;
    return false;
}

function apply(orig, targ, cond) {
    var ret = '';
    var flag = 0;
    var cnt = 0;
    var command = '', arg = '';
    if (cond.matchexact !== undefined) {
        if (Array.isArray(cond.matchexact)) cond.matchexact.forEach(item => {
            if (orig === item) cnt++;
        });
        else if (orig === cond.matchexact) cnt++;
    }
    if (cond.match !== undefined) {
        if (Array.isArray(cond.match)) cond.match.forEach(item => cnt += (orig.match(new RegExp(item, 'g')) || []).length);
        else cnt += (orig.match(new RegExp(cond.match, 'g')) || []).length;
    }
    // console.log(orig, cnt);
    for (var i = 0; i < targ.length; i++) {
        var ex = false;
        if (targ[i] == '\\') {
            if (flag == 1) {
                if (command == 'cnt') ret += arg.repeat(cnt);
                command = arg = '';
                flag = 0;
                ex = true;
            } else if (flag == 0) {
                flag = 1;
                ex = true;
            }
        }
        if (targ[i] == '{' && flag == 1) {
            flag = 2;
            ex = true;
        }
        if (targ[i] == '}' && flag == 2) {
            if (command == 'cnt') ret += arg.repeat(cnt);
            command = arg = '';
            flag = 0;
            ex = true;
        }
        if (!ex) {
            if (flag == 0) ret += targ[i];
            if (flag == 1) command += targ[i];
            if (flag == 2) arg += targ[i];
        }
    }
    if (flag == 1) {
        if (command == 'cnt') ret += arg.repeat(cnt);
        command = arg = '';
        flag = 0;
    }
    return ret;
}

function proceed(message, chan, condition) {
    if (condition.send !== undefined) {
        if (Array.isArray(condition.send)) condition.send.forEach(item => chan.send(apply(message.content, item, condition)));
        else chan.send(apply(message.content, condition.send, condition));
    }
    if (condition.sendrandom !== undefined) chan.send(condition.sendrandom[Math.floor(Math.random() * condition.sendrandom.length)]);
    if (condition.react !== undefined ) {
        if (Array.isArray(condition.react)) condition.react.forEach(item => message.react(item));
        else message.react(condition.react);
    }
}

function processMessage(message, chan, condition) {
    if (include(condition.except, message.guild.id)) return;
    if (condition.in !== undefined && !include(condition.in, message.guild.id)) return;
    var flag = false;
    if (include(condition.matchexact, message.content)) flag = true;
    if (condition.match !== undefined) {
        var matchlist = [ ];
        if (Array.isArray(condition.match)) matchlist = condition.match;
        else matchlist = [ condition.match ];
        matchlist.forEach(item => flag |= message.content.toLowerCase().includes(item));
    }
    if (flag) proceed(message, chan, condition);
}

function processReact(react, chan, condition) {
    if (include(condition.except, react.message.guild.id)) return;
    if (condition.in !== undefined && !include(condition.in, react.message.guild.id)) return;
    var flag = false;
    if (include(condition.onreact, react._emoji.name)) flag = true;
    if (flag) proceed(react.message, chan, condition);
}

client.on(Events.MessageCreate, message => {
    if (message.author.bot) return;
    // if (inappropriate(message.content)) {
    //     message.delete();
    //     return;
    // }
    const chan = client.channels.cache.get(message.channelId);
    if (message.content.startsWith(prefix)) {
        manage(message.content.slice(prefix.length), message);
        return;
    }
    if (message.content.startsWith(prefix_hanguel)) {
        manage(message.content.slice(prefix_hanguel.length), message);
        return;
    }
    // if (message.content == 'ㅎㅇ') chan.send('ㅎㅇ');
    // else if (message.content == 'ㅂㅇ') chan.send('ㅂㅇ');
    messageConditions.forEach(item => processMessage(message, chan, item));
    // if (message.content == 'ㅈㅎ') chan.send('ㅈㅎ');
    // if (message.content == 'ㅅㅎ') chan.send('ㅅㅎ');
    // if (message.content == 'ㄷㅇ') chan.send('ㄷㅇ');
    // if (message.content.includes('범') || message.content.includes('기버')) {
    //     if (message.guild.id != '993456436438904882') chan.send('기' + '범'.repeat((message.content.match(/범/g) || []).length + (message.content.match(/기버/g) || []).length));
    // }
    // if (message.content.includes('천안문') || message.content.toLowerCase().includes('tiananmen') || message.content.includes('天安门') || message.content.includes('毛')) chan.send('我爱北京天安门\n天安门上太阳升\n伟大领袖毛主席\n指引我们向前进');
    // if (message.content.includes('天安門')) chan.send('我愛北京天安門\n天安門上太陽昇\n偉大領袖毛主席\n指引我們向前進');
    // if (message.content == '대' || message.content.includes('大') || message.content.includes('대성호')) chan.send('<:da:1076509964820041798><:xing:1076510046768336977><:hao:1076510140280356885>');
    // if (message.content.includes('스팸톤') || message.content.toLowerCase().includes('spamton') || message.content.includes("スパムトン")) chan.send(getSpamton());
    // if (message.content.includes('귀여워') || message.content.includes('귀엽다') || message.content.includes('ㄱㅇㅇ') || message.content.includes('게이') || message.content.toLowerCase().includes('cute') || message.content.toLowerCase().includes('gay') || message.content.includes('카와이') || message.content.includes('可愛') || message.content.includes('かわい')) message.react('↖️');
    // if (message.content.includes('갈') || message.content.includes('갉') || message.content.includes('갊') || message.content.includes('갋') || message.content.includes('갌') || message.content.includes('갍') || message.content.includes('갎') || message.content.includes('갏') || message.content.toLowerCase().includes('gal') || message.content.includes('ㄱㅏㄹ') || message.content.includes('ガル')) message.react('1011628426391724052');
    // if (message.content.includes('성호') || message.content.toLowerCase().includes('xing') || message.content.includes('星')) {
    //     message.react('1076509964820041798');
    //     message.react('1076510046768336977');
    //     message.react('1076510140280356885');
    // }
    
});

client.on(Events.MessageReactionAdd, (reaction, user) => {
    // if (reaction._emoji.name == '🖕') reaction.remove(user);
    const chan = client.channels.cache.get(reaction.message.channelId);
    reactConditions.forEach(item => processReact(reaction, chan, item));
    // if (reaction._emoji.name == '↖️') reaction.message.react('↖️');
    // if (reaction._emoji.name == 'gal') reaction.message.react('1011628426391724052');
    // if (reaction._emoji.name == '😳') reaction.message.react('😳');
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
    }
});

client.login(token);

process.on("unhandledRejection", async error => {
    console.error("Promise rejection:", error);
});

async function getGlicko(id) {
    var ret = null;
    await (async () => {
        return new Promise ((resolve, reject) => {
            request({
                uri: 'https://ch.tetr.io/api/users/' + id.toLowerCase(),
                qs: {}
            }, (err, res, body) => {
                if (err) {
                    resolve();
                    return;
                }
                try {
                    const qry = JSON.parse(body);
                    if (!qry.success) {
                        resolve();
                        return;
                    }
                    ret = {
                        id: id,
                        games: qry.data.user.league.gamesplayed,
                        glicko: qry.data.user.league.glicko,
                        _id: qry.data.user._id
                    };
                } catch (e) {
                    resolve();
                    return;
                }
                resolve();
            });
        });
    })();
    return ret;
}

async function getGames(id) {
    var ret = [ ];
    await (async () => {
        return new Promise ((resolve, reject) => {
            request({
                uri: 'https://ch.tetr.io/api/streams/league_userrecent_' + id,
                qs: {}
            }, (err, res, body) => {
                if (err) {
                    resolve();
                    return;
                }
                try {
                    const qry = JSON.parse(body);
                    if (!qry.success) {
                        resolve();
                        return;
                    }
                    ret = qry.data.records;
                } catch (e) {
                    resolve();
                    return;
                }
                resolve();
            });
        });
    })();
    return ret;
}

async function setGlicko(x) {
    await (async () => {
        return new Promise ((resolve, reject) => {
            sql.query(`UPDATE LIST SET games = ${x.games}, glicko = ${x.glicko}, price = ${x.price} WHERE id = '${x.id}'`, async function (err, results, fields) {
                if (err) console.log(err);
                resolve();
            });
        });
    })();
}

const wins = [ 'overpowered {1}', 'KO\'ed {1}', 'wrecked {1}', 'gave the L to {1}', 'roasted {1}', 'smacked {1}', 'bamboozled {1}', 'memed {1}', 'smashed {1}', 'dominated {1}', 'broke {1}', 'shattered {1} to pieces', 'knocked {1} out', 'stunned {1}', 'eliminated {1}', 'beated {1}', 'defeated {1}', 'overwhelmed {1}', 'conquered {1}', 'outclassed {1}', 'outdid {1}', 'forced {1} to lose' ];
const loses = [ 'got overpowered by {1}', 'got KO\'ed by {1}', 'got wrecked by {1}', 'took the L to {1}', 'got roasted by {1}', 'got smacked by {1}', 'got bamboozled by {1}', 'got memed by {1}', 'got smashed by {1}', 'got dominated by {1}', 'got broke by {1}', 'got shattered to pieces by {1}', 'got knocked out by {1}', 'got stunned by {1}', 'got eliminated by {1}', 'got beated by {1}', 'got defeated by {1}', 'got overwhelmed by {1}', 'got conquered by {1}', 'got outclassed by {1}', 'got outdone by {1}', 'got forced to lose by {1}' ];

function makedescript(x, w, l) {
    var str = '';
    if (w.length != 0 && l.length != 0) {
        str += ('{0} ' + wins[Math.floor(Math.random() * wins.length)] + ' with the score of ' + w[0].score).format(x, w[0].user);
        for (var i = 1; i < w.length - 1; i++) str += (', ' + wins[Math.floor(Math.random() * wins.length)] + ' with the score of ' + w[i].score).format(null, w[i].user);
        if (w.length > 1) str += (' and ' + wins[Math.floor(Math.random() * wins.length)] + ' with the score of ' + w[w.length - 1].score).format(null, w[w.length - 1].user);
        str += (', and ' + loses[Math.floor(Math.random() * loses.length)] + ' with the score of ' + l[0].score).format(null, l[0].user);
        for (var i = 1; i < l.length - 1; i++) str += (', ' + loses[Math.floor(Math.random() * loses.length)] + ' with the score of ' + l[i].score).format(null, l[i].user);
        if (l.length > 1) str += (' and ' + loses[Math.floor(Math.random() * loses.length)] + ' with the score of ' + l[l.length - 1].score + '.').format(null, l[l.length - 1].user);
    } else if (w.length != 0) {
        str += ('{0} ' + wins[Math.floor(Math.random() * wins.length)] + ' with the score of ' + w[0].score).format(x, w[0].user);
        for (var i = 1; i < w.length - 1; i++) str += (', ' + wins[Math.floor(Math.random() * wins.length)] + ' with the score of ' + w[i].score).format(null, w[i].user);
        if (w.length > 1) str += (' and ' + wins[Math.floor(Math.random() * wins.length)] + ' with the score of ' + w[w.length - 1] + '.').format(null, w[w.length - 1].user);
    } else if (l.length != 0) {
        str += ('{0} ' + loses[Math.floor(Math.random() * loses.length)] + ' with the score of ' + l[0].score).format(x, l[0].user);
        for (var i = 1; i < l.length - 1; i++) str += (', ' + loses[Math.floor(Math.random() * loses.length)] + ' with the score of ' + l[i].score).format(null, l[i].user);
        if (l.length > 1) str += (' and ' + loses[Math.floor(Math.random() * loses.length)] + ' with the score of ' + l[l.length - 1] + '.').format(null, l[l.length - 1].user);
    } else str = 'But nobody came to {0}.'.format(x);
    return str;
}

async function checkDiff() {
    sql.query('SELECT id, games, glicko, price FROM LIST', async function (err, results, fields) {
        if (err) {
            console.log(err);
            return;
        }
        var embedList = null;
        var sumPrice = 0, sumGlicko = 0;
        results.forEach(function (item) {
            sumPrice += item.price;
            sumGlicko += item.glicko;
        });
        for (const item of results) {
            const curr = await getGlicko(item.id);
            if (curr === null) continue;
            if (curr.games <= item.games) continue;
            var gamecnt = curr.games - item.games;
            var embed = new EmbedBuilder ();
            embed.setColor(0x009900)
            .setTitle('주가 변동 알림');
            const games = await getGames(curr._id);
            var cnt = Math.min(gamecnt, games.length);
            var w = [ ], l = [ ];
            for (var i = 0; i < cnt; i++) {
                var won = {
                    user: games[i].endcontext[0].user.username.toUpperCase(),
                    wins: games[i].endcontext[0].wins
                };
                var lost = {
                    user: games[i].endcontext[1].user.username.toUpperCase(),
                    wins: games[i].endcontext[1].wins
                }
                if (won.user != item.id) {
                    l.push({
                        user: won.user,
                        score: `${lost.wins} : ${won.wins}`
                    });
                } else {
                    w.push({
                        user: lost.user,
                        score: `${won.wins} : ${lost.wins}`
                    });
                }
            }
            embed.setDescription('**' + makedescript(item.id, w, l) + '**');
            var newSumGlicko = sumGlicko - item.glicko + curr.glicko;
            var differences = [ ];
            for (const item2 of results) {
                var newGlicko = item2.glicko;
                var newGames = item2.games;
                if (item2.id == item.id) {
                    newGlicko = curr.glicko;
                    newGames = curr.games;
                }
                var newPrice = sumPrice / newSumGlicko * newGlicko;
                await setGlicko({
                    id: item2.id,
                    games: newGames,
                    glicko: newGlicko,
                    price: newPrice
                });
                differences.push({
                    id: item2.id,
                    difference: Math.abs(item2.price - newPrice),
                    _old: item2.price,
                    _new: newPrice
                });
            }
            differences.sort(function (a, b) {
                return b.difference - a.difference;
            });
            var printCnt = Math.min(5, differences.length);
            for (var i = 0; i < printCnt; i++) {
                var _old = differences[i]._old.toFixed(0);
                var _new = differences[i]._new.toFixed(0);
                var color = '⚫';
                if (_new > _old) color = '🔴';
                if (_new < _old) color = '🔵';
                embed.addFields({
                    name: differences[i].id,
                    value: `${_new} (${color} ${Math.abs(_new - _old)})`
                });
            }
            //🔵🔴⚫
            embedList = embed;
            sql.query('SELECT id FROM NOTIFY', async function (err, results, fiends) {
                if (err) {
                    console.log(err);
                    return;
                }
                for (var i = 0; i < results.length; i++) {
                    var chan = client.channels.cache.get(results[i].id);
                    await chan.send({ embeds: [ embedList ] });
                }
            });
            checkDiff();
        }
    });
}

const interv = 30;
setInterval(checkDiff, interv * 1000);