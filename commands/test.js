const {prefix, lfkey} = require('../config.json');
const Discord = require('discord.js');
const axios = require('axios');

module.exports = {
  name: 'test',
  description: 'Dev',
  adminOnly: true,
  async execute(message, args) {

    const embed = new Discord.MessageEmbed()
      .setTitle('Role Assign')
      .setDescription('**React with the corresponding emoji to assign yourself the role.**\n\n<:ahemoji:693204679915733043> : React to this if you would like to be notified anytime The Weeknd tweets.\n:question: : React to this if you would like to be notified for the question of the day.\n<a:impossibleradio:655976264406007810> : React to this if you would like to be notified anytime a new episode of Impossible Radio goes live.')
      .setColor('BLACK');

    message.channel.send(embed);

  },
};