require('dotenv').config();
const { Client, GatewayIntentBits, EmbedBuilder, ActionRowBuilder, ButtonBuilder, ButtonStyle, AttachmentBuilder } = require('discord.js');
const tf = require('@tensorflow/tfjs');
const nsfwjs = require('nsfwjs');
const axios = require('axios');
const jimp = require('jimp');

let nsfwModel = null;
nsfwjs.load().then(model => {
    nsfwModel = model;
    console.log('[AI] NSFW AI Model loaded and ready!');
}).catch(err => console.error('Failed to load NSFW model:', err));

async function checkImageNSFW(url) {
    if (!nsfwModel) return false;
    try {
        const response = await axios.get(url, { responseType: 'arraybuffer' });
        const image = await jimp.read(Buffer.from(response.data));
        
        const numPixels = image.bitmap.width * image.bitmap.height;
        const values = new Int32Array(numPixels * 3);
        
        let i = 0;
        image.scan(0, 0, image.bitmap.width, image.bitmap.height, function (x, y, idx) {
            values[i * 3 + 0] = this.bitmap.data[idx + 0]; // R
            values[i * 3 + 1] = this.bitmap.data[idx + 1]; // G
            values[i * 3 + 2] = this.bitmap.data[idx + 2]; // B
            i++;
        });

        const tensor = tf.tensor3d(values, [image.bitmap.height, image.bitmap.width, 3], 'int32');
        const predictions = await nsfwModel.classify(tensor);
        tensor.dispose();

        for (const pred of predictions) {
            if ((pred.className === 'Porn' || pred.className === 'Hentai' || pred.className === 'Sexy') && pred.probability > 0.60) {
                return true; 
            }
        }
        return false;
    } catch (e) {
        return false;
    }
}

const client = new Client({
    intents: [
        GatewayIntentBits.Guilds,
        GatewayIntentBits.GuildMessages,
        GatewayIntentBits.MessageContent,
        GatewayIntentBits.GuildMembers
    ]
});

client.once('ready', () => {
    console.log(`[READY] Logged in as ${client.user.tag}`);
    console.log('Bot is ready!');
});

client.on('messageCreate', async message => {
    if (message.author.bot) return;

    // ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
    // 🤖 AI IMAGE NSFW DETECTOR
    // ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
    if (message.attachments.size > 0 && nsfwModel) {
        const attachment = message.attachments.first();
        if (attachment.contentType && attachment.contentType.startsWith('image/')) {
            const isNsfw = await checkImageNSFW(attachment.url);
            if (isNsfw) {
                await message.delete().catch(() => {});
                const aiWarnEmbed = new EmbedBuilder()
                    .setColor('#FF0000')
                    .setTitle('🤖 AI SECURE: NSFW IMAGE DETECTED')
                    .setDescription(`${message.author}, **L'AI dyalna l9a tswira +18 w tms7at f l'blassa.**\n\n☠️ Hada l'inidar l'lowel. Rak ghadi tkhwa mn l'serveur la 3awdti tlo7 hadchi!`)
                    .setFooter({ text: 'GOATED AI Security System', iconURL: message.guild ? message.guild.iconURL() : undefined })
                    .setTimestamp();
                await message.channel.send({ embeds: [aiWarnEmbed] });
                return;
            }
        }
    }

    // ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
    // 🔒 ANTI INVITE LINK FILTER
    // ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
    const inviteRegex = /(discord\.(gg|io|me|li)|discordapp\.com\/invite|discord\.com\/invite)\/[a-zA-Z0-9-]+/gi;
    const foundInvites = message.content.match(inviteRegex);

    if (foundInvites) {
        let isExternalInvite = false;
        for (const inviteLink of foundInvites) {
            const code = inviteLink.split('/').pop();
            try {
                const invite = await client.fetchInvite(code);
                if (!invite.guild || invite.guild.id !== message.guild.id) {
                    isExternalInvite = true;
                    break;
                }
            } catch {
                isExternalInvite = true;
                break;
            }
        }

        if (isExternalInvite) {
            await message.delete().catch(() => {});
            const warnEmbed = new EmbedBuilder()
                .setColor('#FF0000')
                .setTitle('🚫 INVITE LINK BLOCKED')
                .setDescription(`${message.author}, **posting other server invites is NOT allowed here.**\n\n☠️ Next time = **MUTE**. After that = **BAN**.\n\nBehave. Vibe. Or vanish. 😈`)
                .setFooter({ text: 'GOATED Server Security', iconURL: message.guild.iconURL() })
                .setTimestamp();
            await message.channel.send({ embeds: [warnEmbed] });
            return;
        }
    }

    // ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
    // 🔞 ANTI NSFW LINKS / WORDS FILTER
    // ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
    const nsfwKeywords = ['pornhub', 'xvideos', 'onlyfans', 'xnxx', 'spankbang', 'xhamster', 'rule34', 'nhentai'];
    const msgContent = message.content.toLowerCase();
    
    const hasNsfw = nsfwKeywords.some(keyword => msgContent.includes(keyword));

    if (hasNsfw) {
        await message.delete().catch(() => {});
        const nsfwEmbed = new EmbedBuilder()
            .setColor('#FF0000')
            .setTitle('🔞 NSFW CONTENT BLOCKED')
            .setDescription(`${message.author}, **laisser les liens ou les sujets +18 est formellement INTERDIT ici.**\n\n☠️ Hada l'inidar l'lowel. Rak ghadi tkhwa mn l'serveur la 3awdtiha!`)
            .setFooter({ text: 'GOATED Server Security', iconURL: message.guild ? message.guild.iconURL() : undefined })
            .setTimestamp();
        
        await message.channel.send({ embeds: [nsfwEmbed] });
        return;
    }

    // ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
    // 📋 !emojis — List emoji IDs
    // ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
    if (message.content === '!emojis') {
        const emojis = message.guild.emojis.cache;
        const list = emojis.map(e => `**${e.name}** — ID: \`${e.id}\``).join('\n');
        await message.channel.send(`📋 **Server Emojis:**\n${list}`);
        return;
    }

    // ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
    // 📜 !rules — Post server rules embed
    // ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
    if (message.content === '!rules') {
        const rulesEmbed = new EmbedBuilder()
            .setColor('#2F3136')
            .setTitle('☠️ WELCOME TO THE SERVER ☠️')
            .setDescription('You made it.\nAct right so you can stay.\n\n**🧠 1. Think Before You Type (Challenge Level: HARD)**\nIf your message starts with:\n"Bro relax", "It\'s just a joke", or "Why did I get muted?"\n— congrats, you already failed.\n\n**🤡 2. Main Character Syndrome Is Disabled Here**\nYou are not the main character.\nYou are DLC at best.\nRacism, hate, harassment = uninstall.\n\n**🗑️ 3. Zero Tolerance for Clowns**\nEdgy ≠ funny\nLoud ≠ interesting\nToxic ≠ powerful\nTake that energy back to Twitter/X.\n\n**📢 4. No Spam. No Ads. No Self-Promo.**\nThis is not Shark Tank.\nNo one is investing in your YouTube channel.\n\n**🔞 5. Read Channel Names (YES, AGAIN)**\nPosting NSFW in general = speedrun ban.\nPosting cringe anywhere = emotional damage.\n\n**🛡️ 6. Mods Are Not Your Friends**\nThey are friendly.\nBut once you cross the line, they become patch notes.\n\nArguing = double punishment.\nCrying in DMs = triple.\n\n**🧃 7. Touch Grass Immediately**\nIf you\'re online all day causing problems, please reboot your life.\n\n**📜 8. Discord TOS > Your Feelings**\n"I didn\'t know" is not a defense.\nIgnorance is still bannable.\n\n**🎭 9. This Is Not a Courtroom**\nNo debates.\nNo speeches.\nNo "free speech" essays.\n\n**☠️ Punishment System:**\nMute → Kick → Ban → Screenshot → Server Myth → Cautionary Tale\n\n**💀 FINAL WARNING:**\nIf the rules exist because of someone…\nit was someone like you.\n\n**Behave. Vibe. Or vanish.**\n\nWelcome 😈🔥')
            .setFooter({ text: 'Ignorance is not an excuse. Read the rules.', iconURL: message.guild.iconURL() })
            .setTimestamp();

        try {
            await message.channel.send({ embeds: [rulesEmbed] });
            await message.delete().catch(() => {});
        } catch (error) {
            console.error('Error sending rules embed:', error);
        }
    }

    // ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
    // 🟢 !live — Announce Kick stream
    // ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
    if (message.content === '!live') {
        const liveEmbed = new EmbedBuilder()
            .setColor('#53FC18')
            .setTitle('🟢 GOATEDNOOBIE IS LIVE ON KICK!')
            .setURL('https://kick.com/goatednoobie')
            .setDescription('**Yalah a lkhout koulchi idkhl f l\'live! L\'bchra ghadi tbda db!!**\n\n📺 **[Tferrej fih hna: kick.com/goatednoobie](https://kick.com/goatednoobie)**')
            .setFooter({ text: 'Kick Stream', iconURL: 'https://i.imgur.com/39wH8c1.png' })
            .setTimestamp();

        try {
            await message.channel.send({ content: '@everyone L\'bchra mbdya! Dkhlou f l\'live! 🔥', embeds: [liveEmbed] });
            await message.delete().catch(() => {});
        } catch (error) {
            console.error('Error sending live embed:', error);
        }
    }

    // ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
    // 🌐 !socials — Social media panel
    // ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
    if (message.content === '!socials') {
        const file = new AttachmentBuilder('c:\\work sp\\GOATED BOT\\node_modules\\Futuristic_Discord_Goat_Card.png');

        const socialsEmbed = new EmbedBuilder()
            .setColor('#53FC18')
            .setAuthor({ name: '🐐 GOATEDNOOBIE — Official Socials', iconURL: 'https://static-cdn.jtvnw.net/jtv_user_pictures/goatednoobie-profile_image-70x70.png' })
            .setTitle('FOLLOW THE GOAT — STAY IN THE LOOP 🔥')
            .setDescription('**Welcome to the GOAT Family!**\nSupport the stream by following on all platforms. Every click counts. 💪')
            .addFields(
                { name: '\u200b', value: '🟢 **[KICK — Watch Live NOW](https://kick.com/goatednoobie)**\n`Live streams · Clips · Raw content`', inline: true },
                { name: '\u200b', value: '<:youtubelogopngphoto0:1489655079274414160> **[YOUTUBE — Videos](https://www.youtube.com/@GOATEDNOOBIE/videos)**\n`VODs · Highlights · Edits`', inline: true },
                { name: '\u200b', value: '\u200b', inline: true },
                { name: '\u200b', value: '<:1715965947instagramlogopng1:1489654979005513829> **[INSTAGRAM — Updates](https://www.instagram.com/goatednoobie/)**\n`Stories · Behind the scenes`', inline: true },
                { name: '\u200b', value: '<:discordlogo11:1489655034353553508> **[DISCORD — Join the HUB](https://discord.gg/goatednoobie)**\n`Chat · Events · Giveaways`', inline: true },
                { name: '\u200b', value: '\u200b', inline: true }
            )
            .setImage('attachment://Futuristic_Discord_Goat_Card.png')
            .setFooter({ text: '👇 Use the buttons below to visit each platform instantly', iconURL: message.guild ? message.guild.iconURL() : undefined })
            .setTimestamp();

        const row = new ActionRowBuilder()
            .addComponents(
                new ButtonBuilder()
                    .setLabel('WATCH KICK')
                    .setEmoji('🟢')
                    .setURL('https://kick.com/goatednoobie')
                    .setStyle(ButtonStyle.Link),
                new ButtonBuilder()
                    .setLabel('YOUTUBE')
                    .setEmoji({ id: '1489655079274414160', name: 'youtubelogopngphoto0' })
                    .setURL('https://www.youtube.com/@GOATEDNOOBIE/videos')
                    .setStyle(ButtonStyle.Link),
                new ButtonBuilder()
                    .setLabel('INSTAGRAM')
                    .setEmoji({ id: '1489654979005513829', name: 'instagramlogopng1' })
                    .setURL('https://www.instagram.com/goatednoobie/')
                    .setStyle(ButtonStyle.Link),
                new ButtonBuilder()
                    .setLabel('GOAT HUB')
                    .setEmoji({ id: '1489655034353553508', name: 'discordlogo11' })
                    .setURL('https://discord.gg/goatednoobie')
                    .setStyle(ButtonStyle.Link)
            );

        try {
            await message.channel.send({ embeds: [socialsEmbed], components: [row], files: [file] });
            await message.delete().catch(() => {});
        } catch (error) {
            console.error('Error sending socials embed:', error);
        }
    }

    // ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
    // 🎨 !draw — Generate AI Image
    // ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
    if (message.content.startsWith('!draw ')) {
        const prompt = message.content.slice(6).trim();
        if (!prompt) return;

        const waitMessage = await message.reply('⏳ **Generating image with AI... Please wait a moment.**');

        try {
            // First translate the prompt from Darija/Arabic to English
            let englishPrompt = prompt;
            try {
                const translationPrompt = `Translate the following Moroccan Darija/Arabic phrase into a precise, descriptive image generation prompt in English. Ensure "dari" or "derri" is translated as "boy" and NOT as "house". Only return the English text: "${prompt}"`;
                const transRes = await axios.get(`https://text.pollinations.ai/prompt/${encodeURIComponent(translationPrompt)}`, {
                    headers: { 'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36' },
                    timeout: 10000
                });
                if (transRes.data && transRes.data.length < 1000) {
                    englishPrompt = transRes.data.trim();
                    console.log(`[AI] Translated: "${prompt}" -> "${englishPrompt}"`);
                }
            } catch (e) {
                console.error("Translation failed:", e.message);
                // Fallback to original prompt if translation fails
            }

            // Using the new more stable pollinations endpoint with Flux model for better results
            const seed = Math.floor(Math.random() * 1000000);
            const imageUrl = `https://pollinations.ai/p/${encodeURIComponent(englishPrompt)}?width=1024&height=1024&seed=${seed}&model=flux&nologo=true`;
            
            console.log(`[AI] Generating: ${imageUrl}`);

            let imageRes;
            try {
                imageRes = await axios.get(imageUrl, { 
                    responseType: 'arraybuffer',
                    headers: { 'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36' },
                    timeout: 60000 // 60 seconds timeout for image gen
                });
            } catch (imgError) {
                console.error("Image gen error:", imgError.message);
                if (imgError.response && imgError.response.status === 429) {
                    await waitMessage.edit({ content: '❌ **AI Server is busy (Queue Full). Please try again in 30 seconds.**' }).catch(()=>{});
                } else if (imgError.code === 'ECONNABORTED') {
                    await waitMessage.edit({ content: '❌ **The AI took too long to respond. Please try again with a simpler prompt.**' }).catch(()=>{});
                } else {
                    await waitMessage.edit({ content: '❌ **Error connecting to AI service. Please try again later.**' }).catch(()=>{});
                }
                return;
            }

            // Verify if we actually got an image
            const contentType = imageRes.headers['content-type'];
            if (!contentType || !contentType.startsWith('image/')) {
                console.error("[AI] Invalid content type received:", contentType);
                await waitMessage.edit({ content: '❌ **The AI service returned an invalid response. Please try again with a different prompt.**' }).catch(()=>{});
                return;
            }

            const attachment = new AttachmentBuilder(Buffer.from(imageRes.data), { name: 'image.png' });

            // Truncate URL for button if it's too long (Discord limit is 512)
            let buttonUrl = imageUrl;
            if (buttonUrl.length > 510) {
                buttonUrl = `https://pollinations.ai/p/${encodeURIComponent(englishPrompt.substring(0, 200))}`;
            }

            const imagineEmbed = new EmbedBuilder()
                .setColor('#CEFF00') 
                .setAuthor({ name: 'BlueWillow', iconURL: 'https://i.imgur.com/K1R9JvB.png' })
                .setTitle(`"${prompt.length > 250 ? prompt.substring(0, 247) + '...' : prompt}"`)
                .setDescription('Get your result in GOATED AI Studio for free')
                .setImage('attachment://image.png')
                .setFooter({ text: `Requested by ${message.author.username}`, iconURL: message.author.displayAvatarURL() })
                .setTimestamp();

            const imagineRow = new ActionRowBuilder()
                .addComponents(
                    new ButtonBuilder()
                        .setLabel('VIEW RESULT IN GOATED AI STUDIO')
                        .setStyle(ButtonStyle.Link)
                        .setURL(buttonUrl)
                );

            await waitMessage.delete().catch(() => {});
            await message.channel.send({ content: `**Here is your result, ${message.author}:**`, embeds: [imagineEmbed], components: [imagineRow], files: [attachment] });
        } catch (error) {
            console.error('Error sending imagine message:', error.message);
            if (error.message.includes("Must be 512 or fewer")) {
                await message.channel.send({ content: '❌ **The description is too long, please try a shorter one.**' }).catch(()=>{});
            } else {
                await message.channel.send({ content: '❌ **An unexpected Discord error occurred, please try again later.**' }).catch(()=>{});
            }
        }
    }

    // ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
    // ❓ !help — Show all commands
    // ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
    if (message.content === '!help') {
        const helpEmbed = new EmbedBuilder()
            .setColor('#53FC18')
            .setTitle('📋 GOATED BOT — Command List')
            .setDescription('Here is everything I can do for you in this server:')
            .addFields(
                { name: '🎨 !draw [Prompt]', value: 'Generate amazing AI images (Supports Darija/Arabic).', inline: false },
                { name: '🌐 !socials', value: 'Show social media links for GOATEDNOOBIE.', inline: false },
                { name: '🟢 !live', value: 'Announce the current Kick live stream.', inline: false },
                { name: '📜 !rules', value: 'Show the server rules.', inline: false },
                { name: '📋 !emojis', value: 'List all custom server emojis and their IDs.', inline: false },
                { name: '🛡️ Security', value: 'Automatically protects the server from links, NSFW, and spam.', inline: false }
            )
            .setFooter({ text: 'Behave. Vibe. Or vanish.', iconURL: client.user.displayAvatarURL() })
            .setTimestamp();

        await message.reply({ embeds: [helpEmbed] });
    }
});

client.login(process.env.DISCORD_TOKEN);
