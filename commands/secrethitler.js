const Discord = require('discord.js');
const Canvas = require('canvas');
const {Sequelize, sequelize} = require('../dbConfig');

// const Players = require('../models/Players')(sequelize, Sequelize.DataTypes);
// const Leaderboard = require('../models/Leaderboard')(sequelize, Sequelize.DataTypes);

module.exports = {
    name: 'secrethitler',
    description: 'Start a game of Secret Hitler',
    aliases: ['sh'],
    guildOnly: true,
    async execute(message, args) {

        message.delete();

        function Player(user) {
            this.user = user;
            this.secretRole;
            this.publicRole;
            this.channel;
            this.emoji;
            this.lastChancellor = false;
            this.lastPres = false;
            this.alive = true;
            this.voted = false;
            this.investigated = false;
        }

        var host = message.author;
        var players = [new Player(host)];
        var waiting = `${host}`;

        const embed = new Discord.MessageEmbed()
            .setColor('RED')
            .setTitle('Secret Hitler')
            .setDescription(`React with a 👍 to join the game!\n\nIf you are the one who started this game, you may react with a ✅ to start the game (need at least 5 players) or a ❌ to cancel.`)
            .addField('Players Waiting', waiting)
            .addField(`Don't know how to play?`, `Read the rules [here](https://secrethitler.com/assets/Secret_Hitler_Rules.pdf) or watch [this](https://www.youtube.com/watch?v=APiugylcAJw) short video.`)
            .setURL('https://secrethitler.com/')
            .setThumbnail('https://cdn.roosterteeth.com/image/upload/t_l/f_auto/3/7038c6fb-7982-4d2f-b5b5-50694ca27464.png/original/hitler.png')
            .setFooter('Developed by AstralSky');
        
        const gameStart = await message.channel.send(embed);

        await gameStart.react('👍');
        await gameStart.react('❌');
        var start = false;
        var cancel = false;
        var numPlayers = 1;

        const filter = (reaction, user) => {
            if (user == host && reaction.emoji.name === '✅' && numPlayers >= 5) {
                start = true;
                return true;
            } else if (user == host && reaction.emoji.name === '❌') {
                cancel = true;
                return true;
            } else if (reaction.emoji.name === '👍' && user != host) {
                var found = players.map(element => element.user).indexOf(user);
                if (found == -1) {
                    waiting += `\n${user}`;
                    const updateEmbed = new Discord.MessageEmbed()
                        .setColor('RED')
                        .setTitle('Secret Hitler')
                        .setDescription(`React with a 👍 to join the game!\n\nIf you are the one who started this game, you may react with a ✅ to start the game (need at least 5 players) or a ❌ to cancel.`)
                        .addField('Players Waiting', waiting)
                        .addField(`Don't know how to play?`, `Read the rules [here](https://secrethitler.com/assets/Secret_Hitler_Rules.pdf) or watch [this](https://www.youtube.com/watch?v=APiugylcAJw) short video.`)
                        .setURL('https://secrethitler.com/')
                        .setThumbnail('https://cdn.roosterteeth.com/image/upload/t_l/f_auto/3/7038c6fb-7982-4d2f-b5b5-50694ca27464.png/original/hitler.png')
                        .setFooter('Developed by AstralSky');
                    gameStart.edit(updateEmbed);
                    players.push(new Player(user));
                    numPlayers++;
                    return true;
                }
                return false;
            }
            return false;
        }

        const collector = await gameStart.createReactionCollector(filter, {time: 1500000});

        await collector.on('collect', async (reaction, reactionCollector) => {
            if (numPlayers >= 5) await gameStart.react('✅');
            if (numPlayers == 10 || start || cancel) collector.stop();
        });

        collector.on('end', async collected => {

            gameStart.delete();

            if (cancel) {
                const noStart = new Discord.MessageEmbed()
                    .setColor('RED')
                    .setTitle('Failed to start game')
                    .setDescription('The host ended the game early.')
                return message.channel.send(noStart);
            } else if (numPlayers < 5) {
                const noStart = new Discord.MessageEmbed()
                    .setColor('RED')
                    .setTitle('Failed to start game')
                    .setDescription('Not enough players joined the game.')
                return message.channel.send(noStart);
            }

            var numFascists;
            var boardNumber = './images/fascistBoard';
            if (numPlayers <= 6) {
                numFascists = 2;
                boardNumber += '5.png';
            } else if (numPlayers <= 8) {
                numFascists = 3;
                boardNumber += '7.png';
            } else {
                numFascists = 4;
                boardNumber += '9.png';
            }

            var randomArr = new Array(numPlayers);
            for (var i = 0; i < numPlayers; i++) {
                randomArr[i] = i + 1;
            }
            for (var i = 0; i< numPlayers; i++) {
                var swapIndex = i + Math.floor(Math.random() * (numPlayers - i));
                var tmp = randomArr[i];
                randomArr[i] = randomArr[swapIndex];
                randomArr[swapIndex] = tmp;
            }
            console.log(randomArr);

            var fascArr = [];
            var hitlerPos;

            for (var i = 0; i < numPlayers; i++) {

                players[i].channel = await message.guild.channels.create('secret-role', {
                    type: 'text',
                    permissionOverwrites: [
                        {
                            id: message.guild.id,
                            deny: ['VIEW_CHANNEL'],
                        },
                        {
                            id: players[i].user.id,
                            allow: ['VIEW_CHANNEL'],
                            deny: ['SEND_MESSAGES'],
                        },
                    ],
                });

                const roleEmbed = new Discord.MessageEmbed()
                    .setTitle('Secret Role')
                    .setColor('RED')
                    .setFooter(`Don't show or tell anyone your secret role or party membership!`);

                if (randomArr[i] == 1) {
                    hitlerPos = i;
                    players[i].secretRole = 'Hitler';
                    players[i].publicRole = 'Fascist';
                    await roleEmbed.addField('Secret Role', 'You are Hitler!', true)
                        .addField('Party Membership', 'You are a fascist.', true)
                        .attachFiles(['./images/hitlerSR.png'])
                        .setImage('attachment://hitlerSR.png');
                } else if (randomArr[i] <= numFascists) {
                    fascArr.push(i);
                    players[i].secretRole = 'Fascist';
                    players[i].publicRole = 'Fascist';
                    await roleEmbed.addField('Secret Role', 'You are a fascist!', true)
                        .addField('Party Membership', 'You are a fascist.', true)
                        .attachFiles(['./images/fascistSR.png'])
                        .setImage('attachment://fascistSR.png');
                } else {
                    players[i].secretRole = 'Liberal';
                    players[i].publicRole = 'Liberal';
                    await roleEmbed.addField('Secret Role', 'You are a liberal!', true)
                        .addField('Party Membership', 'You are a liberal.', true)
                        .attachFiles(['./images/liberalSR.png'])
                        .setImage('attachment://liberalSR.png');
                }
                await players[i].channel.send(players[i].user, roleEmbed);
            }

            if (numFascists == 2) players[hitlerPos].channel.send(`${players[fascArr[0]].user} is a fascist!`);

            for (var i = 0; i < fascArr.length; i++) {
                players[fascArr[i]].channel.send(`${players[hitlerPos].user} is Hitler!`);
                for (var j = 0; j < fascArr.length; j++) {
                    if (i != j) players[fascArr[i]].channel.send(`${players[fascArr[j]].user} is a fascist!`);
                }
            }

            const voiceChannel = await message.guild.channels.create('Secret Hitler', {type: 'voice'});
            const textChannel = await message.guild.channels.create('Secret Hitler', {type: 'text'});

            var voicePerms = [
                {
                    id: message.guild.roles.everyone,
                    deny: ['CONNECT']
                }
            ];

            var textPerms = [
                {
                    id: message.guild.roles.everyone,
                    deny: ['VIEW_CHANNEL']
                }
            ];

            for (var i = 0; i < numPlayers; i++) {

                voicePerms.push({id: players[i].user.id, allow: ['CONNECT']});
                textPerms.push({id: players[i].user.id, allow: ['VIEW_CHANNEL'], deny: ['SEND_MESSAGES']});

                var username = players[i].user.username;
                if (username.length < 2) username += '1';

                players[i].emoji = await message.guild.emojis.create(players[i].user.displayAvatarURL({format: 'png', dynamic: false, size: 128}), username);
                randomArr[i] = i;
            }

            await voiceChannel.overwritePermissions(voicePerms);
            await textChannel.overwritePermissions(textPerms);

            for (var i = 0; i< numPlayers; i++) {
                var swapIndex = i + Math.floor(Math.random() * (numPlayers - i));
                var tmp = randomArr[i];
                randomArr[i] = randomArr[swapIndex];
                randomArr[swapIndex] = tmp;
            }

            var order = 'Your turns will be in the following order:\n';
            for (var i = 0; i < numPlayers; i++) {
                order += `\n**${i + 1}.** ${players[randomArr[i]].user}`;
            }

            const orderEmbed = new Discord.MessageEmbed()
                .setTitle('Turn Order')
                .setColor('RED')
                .setDescription(order);
            await textChannel.send(orderEmbed);

            const canvas = Canvas.createCanvas(2658, 1010);
            const ctx = canvas.getContext('2d');

            const libBoard = await Canvas.loadImage('./images/liberalBoard.png');
            const fascBoard = await Canvas.loadImage(boardNumber);
            const libPolicy = await Canvas.loadImage('./images/policyL.png');
            const fascPolicy = await Canvas.loadImage('./images/policyF.png');

            var gameEnd = false;
            var numPlayersAlive = numPlayers;
            var numPolL = 0;
            var numPolF = 0;
            var numFailedGov = 0;

            var policyDeck = [];
            var discardPile = [];
            for (var i = 0; i < 6; i++) policyDeck.push('Liberal');
            for (var i = 0; i < 11; i++) policyDeck.push('Fascist');

            var currentIndex = policyDeck.length;
            var temporaryValue, randomIndex;

            // While there remain elements to shuffle...
            while (0 !== currentIndex) {
                // Pick a remaining element...
                randomIndex = Math.floor(Math.random() * currentIndex);
                currentIndex -= 1;

                // And swap it with the current element.
                temporaryValue = policyDeck[currentIndex];
                policyDeck[currentIndex] = policyDeck[randomIndex];
                policyDeck[randomIndex] = temporaryValue;
            }

            var dist = 360;
            var libFirstCardx = 468;
            var libFirstCardy = 282;
            var fascFirstCardx = 280;
            var fascFirstCardy = 290;
            var cardSizex = 290;
            var cardSizey = 430;

            var chosenPresidentBool = false;
            var chosenPresident;

            var winCon;

            for (var turn = 0; !gameEnd; turn++) {

                ctx.drawImage(fascBoard, 0, 0, canvas.width, canvas.height);

                for (var i = 0; i < numPolF; i++) {
                    ctx.drawImage(fascPolicy, i * dist + fascFirstCardx, fascFirstCardy, cardSizex, cardSizey);
                }

                const imageFasc = new Discord.MessageAttachment(canvas.toBuffer(), 'fascist-board.png');
                const sentFasc = await textChannel.send(imageFasc);

                ctx.drawImage(libBoard, 0, 0, canvas.width, canvas.height);

                for (var i = 0; i < numPolL; i++) {
                    ctx.drawImage(libPolicy, i * dist + libFirstCardx, libFirstCardy, cardSizex, cardSizey);
                }

                ctx.beginPath();
                ctx.arc(950 + 245 * numFailedGov, 819, 29, 0, Math.PI * 2, true);
                ctx.fillStyle='#2205fa';
                ctx.fill();

                const imageLib = new Discord.MessageAttachment(canvas.toBuffer(), 'liberal-board.png');
                const sentLib = await textChannel.send(imageLib);

                var president;
                var chancellor;

                do {
                    if (chosenPresidentBool) {
                        president = chosenPresident;
                        chosenPresidentBool = false;
                        turn--;
                    } else {
                        president = players[randomArr[turn % numPlayers]];
                    }
                } while (!president.alive)

                const instruction = `${president.user.username} is now the President. ${president.user}, please choose a Chancellor.`;
                const chooseChancellor = await new Discord.MessageEmbed()
                    .setTitle(`${president.user.username} is choosing a Chancellor`)
                    .setColor('RED')
                    .setFooter('React with the players avatar to choose them.');
                
                var choices = `${president.user} may choose any player who wasn't a member of government last turn.\n\n`;
                if (numPlayersAlive <= 5) choices = `${president.user} may choose any player except the President from last turn.\n\n`;
                var counter = 1;
                if (numPlayersAlive <= 5) {
                    for (var i = 0; i < numPlayers; i++) {
                        if (players[randomArr[i]].user != president.user && !players[randomArr[i]].lastPres && players[randomArr[i]].alive) {
                            choices += `**${counter}.** ${players[randomArr[i]].user}\n`;
                            counter++;
                        }
                    }
                } else {
                    for (var i = 0; i < numPlayers; i++) {
                        if (players[randomArr[i]].user != president.user && !players[randomArr[i]].lastPres && !players[randomArr[i]].lastChancellor && players[randomArr[i]].alive) {
                            choices += `**${counter}.** ${players[randomArr[i]].user}\n`;
                            counter++;
                        }
                    }
                }

                await chooseChancellor.setDescription(choices);
                const select = await textChannel.send(instruction, chooseChancellor);

                if (numPlayersAlive <= 5) {
                    for (var i = 0; i < numPlayers; i++) {
                        players[i].voted = false;
                        if (players[randomArr[i]].user != president.user && !players[randomArr[i]].lastPres && players[randomArr[i]].alive) await select.react(players[randomArr[i]].emoji);
                    }
                } else {
                    for (var i = 0; i < numPlayers; i++) {
                        players[i].voted = false;
                        if (players[randomArr[i]].user != president.user && !players[randomArr[i]].lastPres && !players[randomArr[i]].lastChancellor && players[randomArr[i]].alive) await select.react(players[randomArr[i]].emoji);
                    }
                }

                const filterPresident = (reaction, user) => {
                    for (var i = 0; i < numPlayers; i++) {
                        if (reaction.emoji == players[i].emoji) {
                            if (numPlayersAlive <= 5) {
                                if (!players[i].lastChancellor && players[i].alive) return user.id === president.user.id
                            } else {
                                if (!players[i].lastPres && !players[i].lastChancellor && players[i].alive) return user.id === president.user.id;
                            }
                        }
                    }
                    return false;
                }

                const collected = await select.awaitReactions(filterPresident, {max: 1});

                chancellor = players[players.map(val => val.emoji).indexOf(collected.first().emoji)];
                
                await select.delete();

                const voting = new Discord.MessageEmbed()
                    .setTitle('Vote for the new government.')
                    .setColor('RED')
                    .setDescription(`${president.user} nominated ${chancellor.user} as their chancellor.\n\nEveryone (including president and chancellor) must now vote on the government.\n**Be careful because only your first vote will be counted!**`)
                    .setFooter('Please react with a ✅ or a ❌ to cast your vote');

                const votingMessage = await textChannel.send('@everyone', voting);
                await votingMessage.react('✅');
                await votingMessage.react('❌');

                var yes = 0;

                const filterVote = (reaction, player) => {
                    var found = players[players.map(element => element.user).indexOf(player)];
                    if (players.map(element => element.user).indexOf(player) == -1) return false;
                    if (!found.voted && found.alive) {
                        if (reaction.emoji.name === '✅') {
                            yes++;
                            found.voted = true;
                            return true;
                        } else if (reaction.emoji.name === '❌') {
                            found.voted = true;
                            return true;
                        }
                    }
                    return false;
                }

                await votingMessage.awaitReactions(filterVote, {maxUsers: numPlayersAlive});
                await votingMessage.delete();

                if (yes > (numPlayersAlive / 2) + 1) {

                    numFailedGov = 0;

                    if (players.map(element => element.lastChancellor).indexOf(true) != -1) players[players.map(element => element.lastChancellor).indexOf(true)].lastChancellor = false;
                    if (players.map(element => element.lastPres).indexOf(true) != -1) players[players.map(element => element.lastPres).indexOf(true)].lastPres = false;

                    chancellor.lastChancellor = true;
                    president.lastPres = true;

                    if (chancellor.secretRole == 'Hitler' && numPolF >= 3) {
                        gameEnd = true;
                        winCon = 'CHANCELLOR';
                        break;
                    }

                    const publicPolicy = new Discord.MessageEmbed()
                        .setTitle('The president and chancellor are now deliberating')
                        .setColor('RED')
                        .setDescription(`President ${president.user.username} is choosing one policy to discard and passing the other two to Chancellor ${chancellor.user.username}`);

                    const policyMessage = await textChannel.send(publicPolicy);

                    if (policyDeck.length < 3) {

                        while (discardPile.length != 0) policyDeck.push(discardPile.pop());
                        
                        var currentIndex = policyDeck.length;
                        var temporaryValue, randomIndex;

                        // While there remain elements to shuffle...
                        while (0 !== currentIndex) {
                            // Pick a remaining element...
                            randomIndex = Math.floor(Math.random() * currentIndex);
                            currentIndex -= 1;

                            // And swap it with the current element.
                            temporaryValue = policyDeck[currentIndex];
                            policyDeck[currentIndex] = policyDeck[randomIndex];
                            policyDeck[randomIndex] = temporaryValue;
                        }
                    }

                    var polCanvas = Canvas.createCanvas(cardSizex * 3, cardSizey);
                    var polCtx = polCanvas.getContext('2d');
                    
                    var hand = [];
                    const policies = new Discord.MessageEmbed()
                        .setTitle('Pick one policy to discard')
                        .setColor('RED')
                        .setFooter('React with the number corresponding to the policy you would like to discard.');

                    var polStr = `Pick one policy to discard, the other two will be given to the Chancellor.\n`;
                    for (var i = 0; i < 3; i++) {
                        var policy = policyDeck.pop();
                        hand.push(policy);
                        polStr += `\n**${i + 1}.** ${policy}`;

                        if (policy == 'Liberal') {
                            polCtx.drawImage(libPolicy, i * cardSizex, 0, cardSizex, cardSizey);
                        } else if (policy == 'Fascist') {
                            polCtx.drawImage(fascPolicy, i * cardSizex, 0, cardSizex, cardSizey);
                        }
                    }

                    const polImage = new Discord.MessageAttachment(polCanvas.toBuffer(), 'policy-choices.png');

                    policies.setDescription(polStr);

                    const polMessage = await president.channel.send(president.user, policies);
                    const polImageSent = await president.channel.send(polImage);

                    await polImageSent.react('1️⃣');
                    await polImageSent.react('2️⃣');
                    await polImageSent.react('3️⃣');

                    var polNum;

                    const filterPolicy = (reaction, user) => {
                        if (user.id == president.user.id) {
                            if (reaction.emoji.name === '1️⃣') {
                                polNum = 0;
                                return true;
                            } else if (reaction.emoji.name === '2️⃣') {
                                polNum = 1;
                                return true;
                            } else if (reaction.emoji.name === '3️⃣') {
                                polNum = 2;
                                return true;
                            }
                        }
                        return false;
                    }

                    await polImageSent.awaitReactions(filterPolicy, {max: 1});
                    await polMessage.delete();
                    await polImageSent.delete();

                    discardPile.push(hand[polNum]);
                    hand.splice(polNum, 1);

                    polCanvas = Canvas.createCanvas(cardSizex * 2, cardSizey);
                    polCtx = polCanvas.getContext('2d');

                    const chancellorPol = new Discord.MessageEmbed()
                        .setTitle('Pick a policy to play')
                        .setColor('RED')
                        .setFooter('React with the number corresponding to the policy you would like to play.');

                    polStr = `Pick the policy that you would like to play onto the board. The other policy will be discarded.\n`;
                    if (numPolF == 5) polStr += `If you would like to discard both policies you may use your veto power by pressing ❌. (Note that the president must agree to the veto)\n`;

                    for (var i = 0; i < 2; i++) {
                        polStr += `\n**${i + 1}.** ${hand[i]}`;

                        if (hand[i] == 'Liberal') {
                            polCtx.drawImage(libPolicy, i * cardSizex, 0, cardSizex, cardSizey);
                        } else if (hand[i] == 'Fascist') {
                            polCtx.drawImage(fascPolicy, i * cardSizex, 0, cardSizex, cardSizey);
                        }
                    }
                    
                    const chancellorPolImage = new Discord.MessageAttachment(polCanvas.toBuffer(), 'policy-choices.png');

                    chancellorPol.setDescription(polStr);

                    const chancellorPolMessage = await chancellor.channel.send(chancellor.user, chancellorPol);
                    const chancellorPolImageSent = await chancellor.channel.send(chancellorPolImage);

                    await chancellorPolImageSent.react('1️⃣');
                    await chancellorPolImageSent.react('2️⃣');
                    if (numPolF == 5) await chancellorPolImageSent.react('❌');

                    const filterPolicyChancellor = (reaction, user) => {
                        if (user.id == chancellor.user.id) {
                            if (reaction.emoji.name === '1️⃣') {
                                polNum = 0;
                                return true;
                            } else if (reaction.emoji.name === '2️⃣') {
                                polNum = 1;
                                return true;
                            } else if (reaction.emoji.name === '❌' && numPolF == 5) {
                                polNum = -1;
                                return true;
                            }
                        }
                        return false;
                    }

                    await chancellorPolImageSent.awaitReactions(filterPolicyChancellor, {max: 1});
                    await chancellorPolMessage.delete();
                    await chancellorPolImageSent.delete();
                    await policyMessage.delete();

                    if (polNum == -1) {

                        const vetoEmbed = new Discord.MessageEmbed()
                            .setTitle('The chancellor would like to veto this agenda.')
                            .setDescription('The chancellor would like to veto this agenda and discard both policies they were given. If you agree to the veto, react with a ✅, and a ❌ if you would like to force the chancellor to choose a policy.')
                            .setColor('RED');

                        const vetoMessage = await president.channel.send(vetoEmbed);

                        await vetoMessage.react('✅');
                        await vetoMessage.react('❌');
                        var veto;

                        const filterVeto = (reaction, user) => {
                            if (user.id == president.user.id) {
                                if (reaction.emoji.name === '✅') {
                                    veto = true;
                                    return true;
                                } else if (reaction.emoji.name === '❌') {
                                    veto = false;
                                    return true;
                                }
                            }
                            return false;
                        }
    
                        await vetoMessage.awaitReactions(filterVeto, {max: 1});
                        await vetoMessage.delete();

                        if (veto == true) {
                            numFailedGov++
                            sentFasc.delete();
                            sentLib.delete();
                            break;
                        } else {

                            const chancellorPolMessageResend = await chancellor.channel.send(chancellor.user, chancellorPol);
                            const chancellorPolImageResent = await chancellor.channel.send(chancellorPolImage);

                            await chancellorPolImageResent.react('1️⃣');
                            await chancellorPolImageResent.react('2️⃣');

                            const filterPolicyChancellorResend = (reaction, user) => {
                                if (user.id == chancellor.user.id) {
                                    if (reaction.emoji.name === '1️⃣') {
                                        polNum = 0;
                                        return true;
                                    } else if (reaction.emoji.name === '2️⃣') {
                                        polNum = 1;
                                        return true;
                                    }
                                }
                                return false;
                            }

                            await chancellorPolImageResent.awaitReactions(filterPolicyChancellorResend, {max: 1});
                            await chancellorPolMessageResend.delete();
                            await chancellorPolImageResent.delete();
                        }
                    }

                    if (hand[polNum] == 'Liberal') numPolL++;
                    else {
                        switch (++numPolF) {
                            case 1: if (numFascists == 2 || numFascists == 3) break;
                            case 2: if (numFascists == 2) break;

                                const publicInvestigation = new Discord.MessageEmbed()
                                    .setTitle('The president is choosing someone to investigate')
                                    .setDescription('The president is currently choosing one player to investigate. You may use this time to discuss and persuade the president in their choice.')
                                    .setColor('RED')
                                    .setFooter('The president will only be able to see the players party membership (not their secret role).');
                                
                                const publicInvestigationMessage = await textChannel.send(publicInvestigation);

                                const investigateEmbed = new Discord.MessageEmbed()
                                    .setTitle('Choose a player to investigate')
                                    .setColor('RED')
                                    .setFooter('React with the players avatar to choose them.');
                                
                                var investigateString = 'Choose one player that you would like to investigate. You will be able to see their party membership card (not their secret role)\n';

                                for (var i = 0; i < numPlayers; i++) {
                                    if (players[randomArr[i]].user != president.user && players[randomArr[i]].alive && !players[randomArr[i]].investigated) investigateString += `\n**${i + 1}** ${players[randomArr[i]].user}`;
                                }

                                investigateEmbed.setDescription(investigateString);

                                const investigateMessage = await president.channel.send(president.user, investigateEmbed);

                                for (var i = 0; i < numPlayers; i++) {
                                    if (players[randomArr[i]].user != president.user && players[randomArr[i]].alive && !players[randomArr[i]].investigated) await investigateMessage.react(players[randomArr[i]].emoji);
                                }

                                const filterInvestigation = (reaction, user) => {
                                    for (var i = 0; i < numPlayers; i++) {
                                        if (reaction.emoji == players[i].emoji && !players[i].investigated) {
                                            return user.id === president.user.id;
                                        }
                                    }
                                    return false;
                                }

                                const reacted = await investigateMessage.awaitReactions(filterInvestigation, {max: 1});

                                const investigatedPlayer = players[players.map(val => val.emoji).indexOf(reacted.first().emoji)];
                                investigatedPlayer.investigated = true;

                                await investigateMessage.delete();
                                await publicInvestigationMessage.delete();

                                const partyMem = new Discord.MessageEmbed()
                                    .setTitle(`Investigating Party Membership`)
                                    .setColor('RED')
                                    .setDescription(`${investigatedPlayer.user}'s party membership is ${investigatedPlayer.publicRole}.`);
                                
                                if (investigatedPlayer.publicRole == 'Liberal') {
                                    partyMem.attachFiles(['./images/liberalPM.png'])
                                        .setImage('attachment://liberalPM.png');
                                } else {
                                    partyMem.attachFiles(['./images/fascistPM.png'])
                                    .setImage('attachment://fascistPM.png');
                                }

                                await president.channel.send(partyMem);

                                const investigationAnnouncement = new Discord.MessageEmbed()
                                    .setTitle('The president has investigated a player!')
                                    .setDescription(`The president decidede to investigate ${investigatedPlayer.user}. The president may now choose to share this information, withhold it, or lie about it.`)
                                    .setColor('RED');

                                await textChannel.send(investigationAnnouncement);
                                
                                break;

                            case 3: if (numFascists == 2) {
                                    if (policyDeck.length < 3) {

                                        while (discardPile.length != 0) policyDeck.push(discardPile.pop());
                                        
                                        var currentIndex = policyDeck.length;
                                        var temporaryValue, randomIndex;
                
                                        // While there remain elements to shuffle...
                                        while (0 !== currentIndex) {
                                            // Pick a remaining element...
                                            randomIndex = Math.floor(Math.random() * currentIndex);
                                            currentIndex -= 1;
                
                                            // And swap it with the current element.
                                            temporaryValue = policyDeck[currentIndex];
                                            policyDeck[currentIndex] = policyDeck[randomIndex];
                                            policyDeck[randomIndex] = temporaryValue;
                                        }
                                    }

                                    polCanvas = Canvas.createCanvas(cardSizex * 3, cardSizey);
                                    polCtx = polCanvas.getContext('2d');

                                    const peekEmbed = new Discord.MessageEmbed()
                                        .setTitle('The top 3 cards in the deck')
                                        .setColor('RED')
                                        .setFooter('React with a ✅ when you are ready to continue.');
                                    var embedStr = 'The following are the top 3 cards in the policy deck:\n';

                                    for (var i = 0; i < 3; i++) {
                                        embedStr += `\n**${i + 1}.** ${policyDeck[policyDeck.length - 1 - i]}`;

                                        if (policy == 'Liberal') {
                                            polCtx.drawImage(libPolicy, i * cardSizex, 0, cardSizex, cardSizey);
                                        } else if (policy == 'Fascist') {
                                            polCtx.drawImage(fascPolicy, i * cardSizex, 0, cardSizex, cardSizey);
                                        }
                                    }

                                    const peekImage = new Discord.MessageAttachment(polCanvas.toBuffer(), 'policy-peek.png');

                                    peekEmbed.setDescription(embedStr);
                                    const sentPeek = await president.channel.send(peekEmbed);
                                    const sentPeekImage = await president.channel.send(peekImage);

                                    sentPeek.react('✅');

                                    const filterReaction = (reaction, user) => {
                                        if (reaction.emoji.name === '✅' && user.id == president.user.id) {
                                            return true;
                                        }
                                    }

                                    await sentPeek.awaitReactions(filterReaction, {max: 1});
                                    await sentPeek.delete();
                                    await sentPeekImage.delete();
                                } else {

                                    const publicChoose = new Discord.MessageEmbed()
                                        .setTitle('The current president is nominating the next president.')
                                        .setDescription('The president is currently choosing one player to nominate as the next president. You may use this time to discuss and persuade the president in their choice.')
                                        .setColor('RED')
                                        .setFooter('After next round, the next president will return to whoever should have been president next round.');

                                    const publicMessage = await textChannel.send(publicChoose);
                                    
                                    const choosePresEmbed = new Discord.MessageEmbed()
                                        .setTitle('Please nominate the next president.')
                                        .setColor('RED')
                                        .setFooter('React with the players avatar to choose them.');

                                    var presString = 'Please choose one of these players to become the next rounds president:\n';
                                    
                                    for (var i = 0; i < numPlayers; i++) {
                                        if (players[randomArr[i]].user != president.user && players[randomArr[i]].alive) presString += `\n**${i + 1}.** ${players[randomArr[i]].user}`;
                                    }

                                    choosePresEmbed.setDescription(presString);

                                    const chooseMessage = await president.channel.send(choosePresEmbed);

                                    for (var i = 0; i < numPlayers; i++) {
                                        if (players[randomArr[i]].user != president.user && players[randomArr[i]].alive) await chooseMessage.react(players[randomArr[i]].emoji);
                                    }

                                    const filterPresident = (reaction, user) => {
                                        for (var i = 0; i < numPlayers; i++) {
                                            if (reaction.emoji == players[i].emoji && players[i].alive) {
                                                return user.id === president.user.id;
                                            }
                                        }
                                        return false;
                                    }
    
                                    const reacted = await chooseMessage.awaitReactions(filterPresident, {max: 1});
    
                                    chosenPresident = players[players.map(val => val.emoji).indexOf(reacted.first().emoji)];
                                    chosenPresidentBool = true;

                                    await chooseMessage.delete();
                                    await publicMessage.delete();

                                    const presidentAnnouncement = new Discord.MessageEmbed()
                                        .setTitle('The president has chosen who to nominate.')
                                        .setDescription(`The current president has nominated ${chosenPresident.user} as the next president.`)
                                        .setColor('RED');

                                    await textChannel.send(presidentAnnouncement);

                                }

                                break;

                            case 4:
                            case 5: 

                                const publicKill = new Discord.MessageEmbed()
                                    .setTitle('The president is choosing a player to kill')
                                    .setDescription('The president is currently choosing one player to kill. You may use this time to discuss and persuade the president in their choice.')
                                    .setColor('RED');

                                const publicMessage = await textChannel.send(publicKill);

                                const killEmbed = new Discord.MessageEmbed()
                                    .setTitle('Choose a player to kill')
                                    .setColor('RED')
                                    .setFooter('React with the players avatar to choose them.');
                                
                                var killString = 'Please choose one of these players to kill:\n';

                                for (var i = 0; i < numPlayers; i++) {
                                    if (players[randomArr[i]].user != president.user && players[randomArr[i]].alive) killString += `\n**${i + 1}.** ${players[randomArr[i]].user}`;
                                }

                                killEmbed.setDescription(killString);

                                const killMessage = await president.channel.send(killEmbed);

                                for (var i = 0; i < numPlayers; i++) {
                                    if (players[randomArr[i]].user != president.user && players[randomArr[i]].alive) await killMessage.react(players[randomArr[i]].emoji);
                                }

                                const filterPlayers = (reaction, user) => {
                                    for (var i = 0; i < numPlayers; i++) {
                                        if (reaction.emoji == players[i].emoji && players[i].alive) {
                                            return user.id === president.user.id;
                                        }
                                    }
                                    return false;
                                }

                                const killReact = await killMessage.awaitReactions(filterPlayers, {max: 1});

                                const killed = players[players.map(val => val.emoji).indexOf(killReact.first().emoji)];
                                killed.alive = false;

                                await killMessage.delete();
                                await publicMessage.delete();

                                const killAnnouncement = new Discord.MessageEmbed()
                                    .setTitle('The president has chosen!')
                                    .setDescription(`The president has chosen to kill ${killed.user}.`)
                                    .setColor('RED');

                                numPlayersAlive--;             
                                
                                if (killed.secretRole == 'Hitler') {
                                    gameEnd = true;
                                    winCon = 'HITLERDEATH';
                                }

                                await textChannel.send(killAnnouncement);
                                break;
                        }
                    }

                    hand = [];

                    if (numPolL == 5) { 
                        gameEnd = true;
                        winCon = '5LIB';
                    } else if (numPolF == 6) {
                        gameEnd = true;
                        winCon = '6FASC';
                    }

                } else {
                    numFailedGov++;
                    if (numFailedGov == 3) {
                        numFailedGov = 0;
                        var policy = policyDeck.pop()
                        discardPile.push(policy);

                        if (policy == 'Liberal') numPolL++;
                        else numPolF++;
                    }

                    if (numPolL == 5) { 
                        gameEnd = true;
                        winCon = '5LIB';
                    } else if (numPolF == 6) {
                        gameEnd = true;
                        winCon = '6FASC';
                    }

                    if (players.map(element => element.lastChancellor).indexOf(true) != -1) players[players.map(element => element.lastChancellor).indexOf(true)].lastChancellor = false;
                    if (players.map(element => element.lastPres).indexOf(true) != -1) players[players.map(element => element.lastPres).indexOf(true)].lastPres = false;
                }


                sentFasc.delete();
                sentLib.delete();
            }

            for (var i = 0; i < numPlayers; i++) {
                players[i].channel.delete();
                message.guild.emojis.resolve(players[i].emoji).delete();
            }

            textChannel.delete();
            voiceChannel.delete();

            var libs = '';
            var fasc = '';
            var hit = '';

            for (var i = 0; i < numPlayers; i++) {
                if (players[i].publicRole == 'Liberal') {
                    libs += `${players[i].user}\n`;
                } else if (players[i].secretRole == 'Hitler') {
                    hit = players[i].user;
                } else {
                    fasc += `${players[i].user}\n`;
                }
            }

            const winEmbed = new Discord.MessageEmbed()
                .addField('Hitler', hit, false)
                .addField('Liberals', libs, true)
                .addField('Fascists', fasc, true);

            switch (winCon) {
                case '5LIB':
                    winEmbed.setTitle('The Liberals have won!')
                        .setColor('BLUE')
                        .setDescription('The Liberals placed 5 liberal policies and won the game!');
                    break;
                case '6FASC':
                    winEmbed.setTitle('The Fascists have won!')
                        .setColor('RED')
                        .setDescription('The Fascists placed 6 fascists policies and won the game!');
                    break;
                case 'HITLERDEATH':
                    winEmbed.setTitle('The Liberals have won!')
                        .setColor('BLUE')
                        .setDescription('The Liberals killed Hitler and won the game!');
                    break;
                case 'CHANCELLOR':
                    winEmbed.setTitle('The Fascists have won!')
                        .setColor('RED')
                        .setDescription('Hitler was voted in as chancellor after 3 or more fascist policies had been placed, so Fascists won the game!');
                    break;
            }

            message.channel.send(winEmbed);

            ctx.drawImage(fascBoard, 0, 0, canvas.width, canvas.height);

            for (var i = 0; i < numPolF; i++) {
                ctx.drawImage(fascPolicy, i * dist + fascFirstCardx, fascFirstCardy, cardSizex, cardSizey);
            }

            const imageFasc = new Discord.MessageAttachment(canvas.toBuffer(), 'fascist-board-final.png');
            await message.channel.send(imageFasc);

            ctx.drawImage(libBoard, 0, 0, canvas.width, canvas.height);

            for (var i = 0; i < numPolL; i++) {
                ctx.drawImage(libPolicy, i * dist + libFirstCardx, libFirstCardy, cardSizex, cardSizey);
            }

            ctx.beginPath();
            ctx.arc(950 + 245 * numFailedGov, 819, 29, 0, Math.PI * 2, true);
            ctx.fillStyle='#2205fa';
            ctx.fill();

            const imageLib = new Discord.MessageAttachment(canvas.toBuffer(), 'liberal-board-final.png');
            await message.channel.send(imageLib);

        });
    },
};