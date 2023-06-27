const { Client, Collection, Events, GatewayIntentBits } = require('discord.js');
const { clientId, token } = require('./config.json');
const client = new Client ({ intents: [ GatewayIntentBits.Guilds, GatewayIntentBits.GuildMessageReactions, GatewayIntentBits.GuildMessages, GatewayIntentBits.MessageContent ] });
const request = require('request');
const fs = require('fs');
const path = require('path');
const CharacterAI = require('node_characterai');
const characterAI = new CharacterAI();

const characterId = "0PvjXF5wB6TrNOlbtvWZ48gRgeYR_58vCHnQRxFcNao";
var char;

client.commands = new Collection ();

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

client.once(Events.ClientReady, async c => {
    await characterAI.authenticateAsGuest();
    chat = await characterAI.createOrContinueChat(characterId);
    console.log(`Ready! Logged in as ${c.user.tag}`);
});

function inappropriate(x) {
    return x.includes("씨발") || x.includes("병신") || x.includes("죽어");
}

async function manage(command, message) {
    const args = command.split(' ').filter(n => n);
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
        var script = '(Saihara Shuichi appears.) Hey, Kokichi Ouma!';
        if (args.length > 0 && args[0] == '$reset$') {
            chat = await characterAI.createOrContinueChat(characterId);
            message.reply('초기화 완료');
            return;
        }
        if (args.length > 0) script = args.join(' ');
        const response = await chat.sendAndAwaitResponse(script, true)
        message.reply(response.text);
        return;
    }
}

const sptr = [ "[[쿤가데로]] 맙소사, 기분 좋네요...", "HOLY [[Cungadero]] DO I FEEL GOOD...", "おお…　こ…これは…　なんとも………　キモチEEEEEEEEEEEEEEE…！！", "嚯嚯嚯哈哈啊啊啊！这感觉真是太好了…", "내가 왔다! 크리스!!", "HERE I AM!! KRIS!!", "駆けつけまレた　ｸﾘｽｻﾏ！！", "我在这里！！克里斯！！", "크게", "BIG", "BIGに", "大", "거대하게1,", "BIG,", "BIGになって", "巨大，", "[[어느 때보다도 크고 강력하게]]", "[[BIGGER AND BETTER THAN EVER]]", "[[さらにBIGに　バワーアップ]]して", "【【更大更强超平想象】】", "하 하 하... 이 힘이 바로", "HA HA HA ... THIS POWER IS", "HA HA HA…　これこそが", "哈　哈　哈…这股力量是", "자유인가.", "FREEDOM.", "[[自由]]の力。", "自由。", "더 이상은\n꼭두각시로\n살지 않아도 돼!!!!", "I WON'T HAVE TO BE\nJUST A PUPPET\nANY MORE!!!!", "ﾜﾀ94は　もう\nあやつﾘ人形では\nな、　　、い！！、。！　！", "我再也\n不会只是个\n木偶了！！！", "…", "...", "라고.. 생각.. 했는데..", "OR... so... I... thought.", "…ﾊｽﾞ　だったの　　に", "至少…我是…这么…觉得。", "이 실은 대체 뭐야!?\n왜 아직도 [부족한] 거지!?\n아직도 어두워... 너무 어두워!", "WHAT ARE THESE STRINGS!?\nWHY AM I NOT [BIG] ENOUGH!?\nIt's still DARK... SO DARK!", "この糸は!?　なぜ!?\n[[BIG]]ﾚﾍﾞﾙが足ﾘない　!?\n暗い…　もだ。、闇のな　か…！", "这些提线是什么！？\n为什么我还是不够【大】！？\n这里依然黑暗…太黑暗了！", "크리스.", "KRIS.", "ｸﾘｽｻﾏ。", "克里斯。", "크리스.\n크리스.\n크리스.", "KRIS.\nKRIS.\nKRIS.", "ｸﾘｽｻﾏ。\nｸﾘｽｻﾏ。\nｸﾘｽｻﾏ。", "克里斯。\n克里斯。\n克里斯。", "맞아요.\n너.\n네가 필요해.", "THAT'S RIGHT.\nYOU.\nI NEED YOU.", "そうでs。\nｱnﾀ。\nﾜﾀ94には　ｱnﾀが　必。。、要", "没错。\n你。\n我需要你。", "나와 함께.\n커지는 거야.", "나와 함께.\n커지는 거야.", "[[BIG]]に　なる　でs\nﾜﾀ94と　いっレょに", "和我一起。\n变大。", "아주    아주    크게", "VERY    VERY    BIG", "ものすご、、、ーー、、ーく[[BIG]]に", "非常　　非常　　　大" ];

function getSpamton() {
    var idx = Math.floor(Math.random() * sptr.length);
    return sptr[idx];
}

const prefix = 'mb ', prefix_hanguel = 'ㅡㅠ ';

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
    else if (message.content == 'ㅈㅎ') chan.send('ㅈㅎ');
    else if (message.content == 'ㅅㅎ') chan.send('ㅅㅎ');
    else if (message.content == 'ㄷㅇ') chan.send('ㄷ');
    else if (message.content.includes('범') || message.content.includes('기버')) chan.send('기범');
    else if (message.content.includes('천안문') || message.content.toLowerCase().includes('tiananmen') || message.content.includes('天安门') || message.content.includes('毛')) chan.send('我爱北京天安门\n天安门上太阳升\n伟大领袖毛主席\n指引我们向前进');
    else if (message.content.includes('天安門')) chan.send('我愛北京天安門\n天安門上太陽昇\n偉大領袖毛主席\n指引我們向前進');
    else if (message.content == '대' || message.content.includes('大') || message.content.includes('대성호')) chan.send('<:da:1076509964820041798><:xing:1076510046768336977><:hao:1076510140280356885>');
    else if (message.content.includes('스팸톤') || message.content.toLowerCase().includes('spamton') || message.content.includes("スパムトン")) chan.send(getSpamton());
    if (message.content.includes('귀여워') || message.content.includes('귀엽다') || message.content.includes('ㄱㅇㅇ') || message.content.includes('게이') || message.content.toLowerCase().includes('cute') || message.content.toLowerCase().includes('gay') || message.content.includes('카와이') || message.content.includes('可愛') || message.content.includes('かわい')) message.react('↖️');
    if (message.content.includes('갈') || message.content.includes('갉') || message.content.includes('갊') || message.content.includes('갋') || message.content.includes('갌') || message.content.includes('갍') || message.content.includes('갎') || message.content.includes('갏') || message.content.toLowerCase().includes('gal') || message.content.includes('ㄱㅏㄹ') || message.content.includes('ガル')) message.react('1011628426391724052');
    if (message.content.includes('성호') || message.content.toLowerCase().includes('xing') || message.content.includes('星')) {
        message.react('1076509964820041798');
        message.react('1076510046768336977');
        message.react('1076510140280356885');
    }
});

client.on(Events.MessageReactionAdd, (reaction, user) => {
    // if (reaction._emoji.name == '🖕') reaction.remove(user);
    if (reaction._emoji.name == '↖️') reaction.message.react('↖️');
    if (reaction._emoji.name == 'gal') reaction.message.react('1011628426391724052');
});

client.on(Events.InteractionCreate, async interaction => {
    if (interaction.isChatInputCommand()) {
        const command = client.commands.get(interaction.commandName);
        if (!command) return;
        try {
            await command.execute(interaction);
        } catch (error) {
            console.error(error);
            if (interaction.replied || interaction.deferred) {
                await interaction.followUp({ content: 'Error while executing command', ephemeral: true });
            } else {
                await interaction.reply({ content: 'Error while executing command', ephemeral: true });
            }
        }
    } else if (interaction.isButton()) {
        interaction.reply('Wow');
        /*const command = client.commands.get(interaction.commandName);
        if (!command) return;
        try {
            await command.buttonPress(interaction);
        } catch (error) {
            console.error(error);
            if (interaction.replied || interaction.deferred) {
                await interaction.followUp({ content: 'Error while executing command', ephemeral: true });
            } else {
                await interaction.reply({ content: 'Error while executing command', ephemeral: true });
            }
        }*/
    }
});

client.login(token);