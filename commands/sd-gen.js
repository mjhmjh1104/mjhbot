const { Attachment, SlashCommandBuilder, EmbedBuilder, ActionRowBuilder, ButtonBuilder, ButtonStyle, ComponentType, TextInputStyle } = require('discord.js');
const request = require('request-promise');
const mysql = require('mysql2/promise');
const fs = require('fs').promises;

module.exports = {
    data: new SlashCommandBuilder ()
        .setName('생성')
        .setDescription('Stable Diffusion 그림을 생성합니다.')
        .addStringOption(option =>
            option.setName('프롬프트')
                .setDescription('프롬프트를 입력합니다.')
                .setRequired(true))
        .addIntegerOption(option =>
            option.setName('단계')
                .setDescription('단계 수를 1 이상 30 이하로 입력합니다.')
                .setMinValue(1)
                .setMaxValue(30)),
    async progress() {
        const url = "http://146.56.100.136:3001/sdapi/v1/progress";
        const options = {
            url: url,
            encoding: 'utf-8',
            method: 'GET',
            headers: { "Accept": "*/*" }
        };
        return JSON.parse(await request(options));
    },
    async execute(interaction, sql) {
        var steps = interaction.options.getInteger('단계');
        if (!steps) steps = 25;
        const result = await this.progress();
        const eta = parseFloat(result.eta_relative);
        const job = result.state.job;
        if (job) {
            interaction.reply(`Worker is busy; ${eta.toFixed()} seconds estimated`);
            return;
        }
        const url = "http://146.56.100.136:3001/sdapi/v1/txt2img"
        const options = {
            url: url,
            encoding: 'utf-8',
            method: 'POST',
            headers: { "Accept": "*/*" },
            json: {
                "prompt": `masterpiece, best quality, ${interaction.options.getString('프롬프트')}`,
                "negative_prompt": "lowres, bad anatomy, bad hands, text, error, missing fingers, extra digit, fewer digits, cropped, worst quality, low quality, normal quality, jpeg artifacts, signature, watermark, username, blurry, artist name",
                "seed": -1,
                "batch_size": 1,
                "n_iter": 1,
                "steps": steps,
                "cfg_scale": 7,
                "width": 512,
                "height": 512,
                "sampler_name": "Euler a",
                "send_images": "true"
            }
        }
        await interaction.reply('생성 중');
        const thisProgress = this.progress;
        var updating = true;
        const interval = setInterval(async function () {
            if (!updating) return;
            const result = await thisProgress();
            const progress = parseFloat(result.progress);
            const eta = parseFloat(result.eta_relative);
            const job = result.state.job;
            const sampling = parseInt(result.state.sampling_step);
            const total = parseInt(result.state.sampling_steps);
            const current_image = result.current_image;
            await interaction.editReply(`Worker in ${job}: ${eta.toFixed()} seconds estimated; ${(progress * 100).toFixed(2)}% done; ${sampling} of ${total}`)
            if (updating && current_image) {
                await fs.writeFile('tmp/SPOILER_out.png', current_image, 'base64');
                await interaction.editReply({ files: [ { attachment: 'tmp/SPOILER_out.png' } ] });
            }
        }, 5000);
        request(options).then(async function (result) {
            updating = false;
            clearInterval(interval);
            await interaction.editReply('처리 중');
            await fs.writeFile('tmp/SPOILER_out.png', result.images[0], 'base64');
            await interaction.editReply({ files: [ { attachment: 'tmp/SPOILER_out.png' } ] });
            await interaction.editReply('');
        }).catch(async function (e) {
            await interaction.editReply(e.toString());
        });
    },
};