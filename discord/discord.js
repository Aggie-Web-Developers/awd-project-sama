const axios = require('axios');
const discordObj = {};

// sends an email to the org email when an error occurs
discordObj.sendMessage = function (subject, body) {
	try {
		var params = {
			username: 'SAMA Messenger',
			avatar_url: process.env.DISCORD_AVATAR_URL,
			content: '\n\n**' + subject + '** \n\n' + body,
		};

		axios.post(process.env.DISCORD_WEBHOOK_URL, params);
	} catch (err) {
		console.error(err);
	}
};

module.exports = discordObj;
