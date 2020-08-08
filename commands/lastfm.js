const {prefix, lfkey} = require('../config.json');
const Discord = require('discord.js');
const axios = require('axios');
const {Sequelize, sequelize} = require('../dbConfig');

const LFUsers = require('../models/LFUsers')(sequelize, Sequelize.DataTypes);

module.exports = {
    name: 'lastfm',
    description: 'LastFM',
    aliases: ['lfm', 'fm'],
    usage: '[command name]',
    async execute(message, args) {

        var url = "https://ws.audioscrobbler.com/2.0/?method=";
        var api = "&api_key=797d187e4e5c9337ec445380edb414de&format=json";

        const user = message.mentions.users.first() || message.author;
        var userDB = await LFUsers.findOne({where: {user_id: user.id}});

        if (args[0] === 'set' && userDB) {
            await LFUsers.update({username: args[1]}, {where: {user_id: user.id}});
            return message.channel.send('Username updated.');
        }
        if (!userDB && args[0] !== 'set') return message.channel.send(`Please set your username using ${prefix}lastfm set [username]`);
        if (!userDB && args[0] === 'set' && args.length == 2) {
            await LFUsers.create({
                user_id: user.id,
                username: args[1]
            });
            return message.channel.send('Username set.');
        }

        if (args.length == 0) {

            var username = await userDB.get("username");
            var userURL = "&user=" + username;
            var finalURL = url + "user.getrecenttracks&limit=1" + api + userURL;

            axios(finalURL)
                .then(response => {
                    const info = response.data.recenttracks.track[0];
                    const mbid = info.mbid;

                    const embed = new Discord.MessageEmbed()
                        .addField('**Track**', info.name, true)
                        .addField('**Artist**', info.artist['#text'], true)
                        .setThumbnail(info.image[2]['#text'])
                        .setAuthor(`Last.fm: ${username}`, user.avatarURL());

                    var newURL = url + "user.getinfo" + userURL + api;

                    axios(newURL)
                        .then(newResponse => {
                            const moreInfo = newResponse.data;
                            var scrobbles = moreInfo.user.playcount;

                            var newestURL = url + "track.getInfo&mbid=" + mbid + api + userURL;

                            axios(newestURL)
                                .then(newestResponse => {
                                    const trackInfo = newestResponse.data;

                                    embed.setFooter(`Playcount: ${trackInfo} | Total Scrobbles: ${scrobbles} | Album: ${info.album['#text']}`);

                                    return message.channel.send(embed);
                                })
                        })
                })

        }
    },
};