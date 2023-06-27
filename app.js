const { Client, Events, GatewayIntentBits } = require('discord.js');
const { token } = require('./config.json');
const client = new Client({ intents: [ GatewayIntentBits.Guilds, GatewayIntentBits.GuildMessageReactions, GatewayIntentBits.GuildMessages, GatewayIntentBits.MessageContent ] });

client.once(Events.ClientReady, c => {
    console.log(`Ready! Logged in as ${c.user.tag}`);
});

function inappropriate(x) {
    return x.includes("씨발") || x.includes("병신") || x.includes("죽어");
}

function manage(command, chan) {
    const args = command.split(' ').filter(n => n);
    if (args.length == 0) return;
    const cmd = args.shift().toLowerCase();
    if (cmd == 'teto') {

    }
}

const sptr = [ "[[쿤가데로]] 맙소사, 기분 좋네요...", "HOLY [[Cungadero]] DO I FEEL GOOD...", "おお…　こ…これは…　なんとも………　キモチEEEEEEEEEEEEEEE…！！", "嚯嚯嚯哈哈啊啊啊！这感觉真是太好了…", "내가 왔다! 크리스!!", "HERE I AM!! KRIS!!", "駆けつけまレた　ｸﾘｽｻﾏ！！", "我在这里！！克里斯！！", "크게", "BIG", "BIGに", "大", "거대하게1,", "BIG,", "BIGになって", "巨大，", "[[어느 때보다도 크고 강력하게]]", "[[BIGGER AND BETTER THAN EVER]]", "[[さらにBIGに　バワーアップ]]して", "【【更大更强超平想象】】", "하 하 하... 이 힘이 바로", "HA HA HA ... THIS POWER IS", "HA HA HA…　これこそが", "哈　哈　哈…这股力量是", "자유인가.", "FREEDOM.", "[[自由]]の力。", "自由。", "더 이상은\n꼭두각시로\n살지 않아도 돼!!!!", "I WON'T HAVE TO BE\nJUST A PUPPET\nANY MORE!!!!", "ﾜﾀ94は　もう\nあやつﾘ人形では\nな、　　、い！！、。！　！", "我再也\n不会只是个\n木偶了！！！", "…", "...", "라고.. 생각.. 했는데..", "OR... so... I... thought.", "…ﾊｽﾞ　だったの　　に", "至少…我是…这么…觉得。", "이 실은 대체 뭐야!?\n왜 아직도 [부족한] 거지!?\n아직도 어두워... 너무 어두워!", "WHAT ARE THESE STRINGS!?\nWHY AM I NOT [BIG] ENOUGH!?\nIt's still DARK... SO DARK!", "この糸は!?　なぜ!?\n[[BIG]]ﾚﾍﾞﾙが足ﾘない　!?\n暗い…　もだ。、闇のな　か…！", "这些提线是什么！？\n为什么我还是不够【大】！？\n这里依然黑暗…太黑暗了！", "크리스.", "KRIS.", "ｸﾘｽｻﾏ。", "克里斯。", "크리스.\n크리스.\n크리스.", "KRIS.\nKRIS.\nKRIS.", "ｸﾘｽｻﾏ。\nｸﾘｽｻﾏ。\nｸﾘｽｻﾏ。", "克里斯。\n克里斯。\n克里斯。", "맞아요.\n너.\n네가 필요해.", "THAT'S RIGHT.\nYOU.\nI NEED YOU.", "そうでs。\nｱnﾀ。\nﾜﾀ94には　ｱnﾀが　必。。、要", "没错。\n你。\n我需要你。", "나와 함께.\n커지는 거야.", "나와 함께.\n커지는 거야.", "[[BIG]]に　なる　でs\nﾜﾀ94と　いっレょに", "和我一起。\n变大。", "아주    아주    크게", "VERY    VERY    BIG", "ものすご、、、ーー、、ーく[[BIG]]に", "非常　　非常　　　大" ];

function getSpamton() {
    var idx = Math.floor(Math.random() * sptr.length);
    return sptr[idx];
}

const prefix = 'mb ';

client.on(Events.MessageCreate, message => {
    if (message.author.bot) return;
    // if (inappropriate(message.content)) {
    //     message.delete();
    //     return;
    // }
    const chan = client.channels.cache.get(message.channelId);
    if (message.content.startsWith(prefix)) {
        manage(message.content.slice(prefix.length), chan);
        return;
    }
    if (message.content == 'ㅎㅇ') chan.send('ㅎㅇ');
    else if (message.content == 'ㅂㅇ') chan.send('ㅂㅇ');
    else if (message.content == 'ㅈㅎ') chan.send('ㅈㅎ');
    else if (message.content == 'ㅅㅎ') chan.send('ㅅㅎ');
    else if (message.content == 'ㄷㅇ') chan.send('ㄷ');
    else if (message.content.includes('범') || message.content.includes('기버')) chan.send('기범');
    else if (message.content.includes('천안문') || message.content.toLowerCase().includes('tiananmen') || message.content.includes('天安门') || message.content.includes('毛')) chan.send('我爱北京天安门\n天安门上太阳升\n伟大领袖毛主席\n指引我们向前进');
    else if (message.content.includes('天安門')) chan.send('我愛北京天安門\n天安門上太陽昇\n偉大領袖毛主席\n指引我們向前進');
    else if (message.content == '대' || message.content.includes('大')) chan.send('大星昊');
    else if (message.content.includes('스팸톤') || message.content.toLowerCase().includes('spamton') || message.content.includes("スパムトン")) chan.send(getSpamton());
    if (message.content.includes('귀여워') || message.content.includes('귀엽다') || message.content.includes('ㄱㅇㅇ') || message.content.includes('게이')) message.react('↖');
    if (message.content.includes('갈')) message.react('1011628426391724052');
    if (message.content.includes('성호')) {
        message.react('1076509964820041798');
        message.react('1076510046768336977');
        message.react('1076510140280356885');
    }
});

client.on('messageReactionAdd', (reaction, user) => {
    // if (reaction._emoji.name == '🖕') reaction.remove(user);
});

client.login(token);