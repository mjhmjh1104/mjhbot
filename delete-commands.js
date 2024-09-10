const { REST, Routes } = require('discord.js');
const { clientId, token } = require('./config.json');
const fs = require('node:fs');
const path = require('node:path');

const rest = new REST().setToken(token);

(async () => {
    try {
        const id = '1159494289659805777';
        const data = await rest.delete(Routes.applicationCommands(clientId) + '/' + id);
    } catch (error) {
        // And of course, make sure you catch and log any errors!
        console.error(error);
    }
})();
