const md5 = require('md5');

var messageConditions = [ ];
var reactConditions = [ ];

function include(x, y) {
    if (x === undefined) return false;
    if (x === y) return true;
    if (Array.isArray(x) && x.includes(y)) return true;
    return false;
}

function normalize(x) {
    return x.replace(/[0-9\.,!~`@\\$%#^&*\(\)-\+=\[\]\{\}:;\'\"\<\>\?/\| ]/g, '').toLowerCase();
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

function getDailyRandom(content, date, user, len) {
    const script = content + date + user;
    const hashed = md5(script);
    var num = 0;
    for (var i = 0; i < hashed.length; i++) {
        num *= 16;
        const k = hashed[i].charCodeAt();
        if (k >= 48 && k <= 57) num += (k - 48);
        else num += (k - 97 + 10);
        num %= len;
    }
    console.log(script);
    console.log(hashed);
    console.log(num);
    return num % len;
}

// 가나다라힣햏
function proceed(message, chan, condition) {
    var msg = normalize(message.content);
    if (condition.send !== undefined) {
        if (Array.isArray(condition.send)) condition.send.forEach(item => chan.send(apply(msg, item, condition)));
        else chan.send(apply(msg, condition.send, condition));
    }
    if (condition.sendrandom !== undefined) chan.send(condition.sendrandom[Math.floor(Math.random() * condition.sendrandom.length)]);
    if (condition.sendrandomdaily !== undefined) chan.send(condition.sendrandomdaily[getDailyRandom(message.content, new Date().toLocaleDateString('en-US', { timeZone: 'Asia/Shanghai' }), message.author.id, condition.sendrandomdaily.length)]);
    if (condition.react !== undefined ) {
        if (Array.isArray(condition.react)) condition.react.forEach(item => message.react(item));
        else message.react(condition.react);
    }
}

function processMessage(message, chan, condition) {
    var msg = normalize(message.content);
    if (include(condition.except, message.guild.id)) return;
    if (condition.in !== undefined && !include(condition.in, message.guild.id)) return;
    var flag = false;
    if (include(condition.matchexact, msg)) flag = true;
    if (condition.match !== undefined) {
        var matchlist = [ ];
        if (Array.isArray(condition.match)) matchlist = condition.match;
        else matchlist = [ condition.match ];
        matchlist.forEach(item => flag |= new RegExp(item, 'g').test(msg));
    }
    if (condition.mention !== undefined) {
        var mentionlist = [ ];
        if (Array.isArray(condition.mention)) mentionlist = condition.mention;
        else mentionlist = [ conditoin.mention ];
        mentionlist.forEach(item => flag |= message.mentions.has(item));
    }
    if (condition.chance !== undefined) {
        var ch = parseFloat(condition.chance);
        var rand = Math.random() * 100;
        if (rand > ch) flag = false;
    }
    if (flag) proceed(message, chan, condition);
}

function processReact(react, chan, condition) {
    if (include(condition.except, react.message.guild.id)) return;
    if (condition.in !== undefined && !include(condition.in, react.message.guild.id)) return;
    var flag = false;
    if (include(condition.onreact, react._emoji.name)) flag = true;
    if (condition.chance !== undefined) {
        var ch = parseFloat(condition.chance);
        var rand = Math.random() * 100;
        if (rand > ch) flag = false;
    }
    if (flag) proceed(react.message, chan, condition);
}

module.exports = {
    processMessageAll: function (message, chan) {
        messageConditions.forEach(item => processMessage(message, chan, item));
    },
    processReactAll: function (reaction, chan) {
        reactConditions.forEach(item => processReact(reaction, chan, item));
    },
    loadConditions: async function (sql) {
        messageConditions = [ ];
        reactConditions = [ ];
        const [ results, fields ] = await sql.query(`SELECT server, content FROM COMMANDS;`);
        for (const item of results) {
            var curr = JSON.parse(item.content);
            curr.in = item.server;
            if (curr.match !== undefined || curr.matchexact !== undefined || curr.mention !== undefined) messageConditions.push(curr);
            if (curr.onreact !== undefined) reactConditions.push(curr);
        }
    },
}