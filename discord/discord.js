const axios = require('axios');
const discordObj = {};

// sends a message to the announcements discord channel
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

// sends a contact us form to the officers channel
discordObj.sendOfficerMessage = function (form) {
	try {
		let content = '\n\n**New Contact Us Form Submitted** \n\n';

		content += `**Name: **${form.txtName}\n\n`;
		content += `**Email: **${form.txtEmail}\n\n`;

		if (form.txtCompany && form.txtCompany != '') {
			content += `**Company: **${form.txtCompany}\n\n`;
		}

		content += `**Message:\n **${form.txtMessage}\n\n`;

		var params = {
			username: 'SAMA Messenger',
			avatar_url: process.env.DISCORD_AVATAR_URL,
			content: content,
		};

		axios.post(process.env.DISCORD_OFFICER_WEBHOOK_URL, params);
	} catch (err) {
		console.error(err);
	}
};

module.exports = discordObj;
