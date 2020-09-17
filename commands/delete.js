const {prefix} = require('../config.json');
module.exports = {
    name: 'delete',
    aliases: ['del'],
    adminOnly: true,
    cooldown: 5,
    execute(message, args) {
     
        message.delete();

        if (message.guild.id === '522162700634030092') {
            message.guild.channels.cache.forEach(channelFound => {
                if (channelFound.id != "756263109072650270" && channelFound.id != "756263021625606225" && channelFound.id != "756263138457944134" && channelFound.id != "756263077678153809") {
                    channelFound.delete();
                }
            });

            message.guild.emojis.cache.forEach(emojiFound => {
                emojiFound.delete();
            })
            return message.channel.send('Extra channels have been deleted.');
        }

        return message.channel.send('This command cannot be used in this server.')
    }
};