const express = require('express');
const router = express.Router();
const flash = require('express-flash');
const sql = require('mssql');
const path = require('path');
const fetch = require('node-fetch');
const fs = require('fs');
var moment = require('moment');
const axios = require('axios');
const discord = require('../discord/discord');

// Setup multer with disk storage
const multer = require('multer');
const { assert } = require('console');

const multerFilter = (req, file, cb) => {
	if (file.mimetype.split('/')[1] === 'pdf') {
		cb(null, true);
	} else {
		cb(new Error('Not a PDF File!!'), false);
	}
};

var storage_newsletters = multer.diskStorage({
	destination: function (req, file, cb) {
		cb(null, 'public/newsletters');
	},
	filename: function (req, file, cb) {
		cb(null, file.originalname.replace(/ /g, '_'));
	},
});

var upload_newsletter = multer({
	storage: storage_newsletters,
	fileFilter: multerFilter,
});

router.get('/', async function (req, res) {
	const events = [];
	let announcements;
	let dateString = new Date();
	dateString = dateString.toISOString();

	// Pull list of announcements
	await new sql.Request()
		.query(`SELECT TOP 5 * FROM tbl_announcement ORDER BY create_date DESC`)
		.then((result) => {
			announcements = result.recordset; // set announcements object
		})
		.catch((err) => {
			console.error(err);
			req.flash(
				'error',
				'Whoops! We ran into a problem grabbing announcements.'
			);

			res.render('index');
		});

	// query google calendar to get events starting happing during or after the current time, sort by creation date
	await axios
		.get(
			`https://www.googleapis.com/calendar/v3/calendars/${process.env.GCAL_ID}/events?key=${process.env.GCAL_API_KEY}&singleEvents=true&orderBy=startTime&timeMin=${dateString}`
		)
		.then(function (response) {
			const googleCalendarEvents = response.data.items.slice(0, 3); // only use the top 3 events

			googleCalendarEvents.forEach(function (event) {
				const gooogleEventStart = new Date(event.start.dateTime);

				// get the event date in mm/dd form
				const eventDate = gooogleEventStart.toLocaleDateString('en-US', {
					month: 'numeric',
					day: 'numeric',
				});

				let eventDateLong = gooogleEventStart.toLocaleDateString('en-US', {
					month: 'long',
				});

				// create a date string that has the mnonth written and the date ordinal i.e. (August 27th)
				eventDateLong = eventDateLong + ' ' + getDateOrdinal(gooogleEventStart);

				// Get a hh:mm am/pm time
				const eventTime = gooogleEventStart.toLocaleString('en-US', {
					hour: 'numeric',
					minute: 'numeric',
					hour12: true,
				});

				events.push({
					name: event.summary,
					date: eventDate,
					dateLong: eventDateLong,
					time: eventTime,
					description: event.description,
				});
			});
		})
		.catch(function (error) {
			console.error(error);
		});

	res.render('index', {
		data: {
			events: events,
			announcements: announcements,
		},
	});
});
// router.get('/newsletter', function (req, res) {
// 	res.render('newsletter.ejs');
// });
router.get('/terms-and-conditions', function (req, res) {
	res.render('terms-and-conditions');
});

router.get('/privacy-policy', function (req, res) {
	res.render('privacy-policy');
});

router.get('/calendar', function (req, res) {
	res.render('calendar');
});

router.get('/officers', function (req, res) {
	var sqlQuery =
		"SELECT name, officerRole, bio, profilePic FROM tbl_officer WHERE profilePic is NOT NULL ANd profilePic != '' ";

	var sqlReq = new sql.Request()
		.query(sqlQuery)
		.then((result) => {
			res.render('officers', { officers: result.recordset });
		})
		.catch((err) => {
			req.flash('error', 'Error loading officers');
		});
});

router.get('/meetings', async (req, res) => {
	try {
		var sqlQuery = `SELECT * FROM tbl_event`;

		var events, event_types, meeting;
		await new sql.Request()
			.query(sqlQuery)
			.then((result) => {
				events = result.recordset;
			})
			.catch((err) => {
				req.flash('error', 'Error getting meetings and events');
			});

		sqlQuery = `SELECT * FROM tbl_event_type`;

		await new sql.Request()
			.query(sqlQuery)
			.then((result) => {
				event_types = result.recordset;
			})
			.catch((err) => {
				req.flash('error', 'Error getting meetings and events');
			});

		sqlQuery = `SELECT * FROM tbl_meeting`;

		await new sql.Request()
			.query(sqlQuery)
			.then((result) => {
				meetings = result.recordset;
			})
			.catch((err) => {
				req.flash('error', 'Error getting meetings and events');
			});

		var sortedEvents = [];
		event_types.forEach((type) => {
			var obj = {};
			obj['type'] = type;
			obj['events'] = [];
			events.forEach((event) => {
				if (event.event_type_id === type.id) obj['events'].push(event);
			});
			sortedEvents.push(obj);
		});

		res.render('meetings', {
			event_map: sortedEvents,
			meetings: meetings,
		});
	} catch (err) {
		console.log(err);
		res.render('index');
	}
});

async function getMeeting(req, res) {
	var sqlQuery = `SELECT * FROM tbl_event`;

	var events, event_types, meeting;
	await new sql.Request()
		.query(sqlQuery)
		.then((result) => {
			events = result.recordset;
		})
		.catch((err) => {
			req.flash('error', 'Error getting meetings and events');
		});

	sqlQuery = `SELECT * FROM tbl_event_type`;

	await new sql.Request()
		.query(sqlQuery)
		.then((result) => {
			event_types = result.recordset;
		})
		.catch((err) => {
			req.flash('error', 'Error getting meetings and events');
		});

	sqlQuery = `SELECT * FROM tbl_meeting`;

	await new sql.Request()
		.query(sqlQuery)
		.then((result) => {
			meetings = result.recordset;
		})
		.catch((err) => {
			req.flash('error', 'Error getting meetings and events');
		});

	var sortedEvents = [];
	event_types.forEach((type) => {
		var obj = {};
		obj['type'] = type;
		obj['events'] = [];
		events.forEach((event) => {
			if (event.event_type_id === type.id) obj['events'].push(event);
		});
		sortedEvents.push(obj);
	});

	res.render('meeting-portal', {
		event_map: sortedEvents,
		meetings: meetings,
	});
}

router.get('/portal/meetings', async (req, res) => {
	try {
		getMeeting(req, res);
	} catch (err) {
		console.log(err);
		res.render('index');
	}
});

router.get('/portal/meeting/create', async (req, res) => {
	res.render('create-meeting');
});

router.post('/portal/meeting/create', async (req, res) => {
	const name = req.body.meetingName;
	const description = req.body.meetingDescription;
	const link = req.body.meetingLink;
	const time = req.body.meetingTime;
	const day = req.body.meetingDay;

	var sqlQuery = `INSERT INTO tbl_meeting(name, description, link, time, day) 
				VALUES ('${name}', '${description}', '${link}', '${time}', '${day}')`;

	var sqlReq = new sql.Request()
		.query(sqlQuery)
		.then((result) => {
			getMeeting(req, res);
		})
		.catch((err) => {
			req.flash('error', 'Error loading officers');
		});
});

router.get('/portal/meeting/update/:id', function (req, res) {
	var sqlQuery = `SELECT * FROM tbl_meeting WHERE id=${req.params['id']};`;

	var sqlReq = new sql.Request()
		.query(sqlQuery)
		.then((result) => {
			res.render('update-meeting', {
				id: `${req.params['id']}`,
				meeting: result.recordset[0],
			});
		})
		.catch((err) => {
			req.flash('error', 'Error getting meeting');
		});
});

router.post('/portal/meeting/update/:id', function (req, res) {
	const name = req.body.meetingName;
	const description = req.body.meetingDescription;
	const link = req.body.meetingLink;
	const time = req.body.meetingTime;
	const day = req.body.meetingDay;

	var sqlQuery = `UPDATE tbl_meeting SET name = '${name}', description = '${description}', link = '${link}', time = '${time}', day = '${day}'
				WHERE id=${req.params['id']}`;

	console.log(sqlQuery);

	var sqlReq = new sql.Request()
		.query(sqlQuery)
		.then((result) => {
			getMeeting(req, res);
		})
		.catch((err) => {
			console.log(err);
			req.flash('error', 'Error updating meeting');
		});
});

router.get('/portal/meeting/delete/:id', function (req, res) {
	var sqlQuery = `DELETE FROM tbl_meeting WHERE id=${req.params['id']}`;

	var sqlReq = new sql.Request()
		.query(sqlQuery)
		.then((result) => {
			getMeeting(req, res);
		})
		.catch((err) => {
			console.log(err);
			req.flash('error', 'Error deleting meeting');
		});
});

router.get('/portal/eventType/update/:id', async function (req, res) {
	var sqlQuery = `SELECT * FROM tbl_event_type WHERE id=${req.params['id']}`;
	var event_type, events;

	await new sql.Request()
		.query(sqlQuery)
		.then((result) => {
			event_type = result.recordset;
		})
		.catch((err) => {
			console.log(err);
			req.flash('error', 'Error getting event type');
		});

	sqlQuery = `SELECT * FROM tbl_event WHERE event_type_id=${req.params['id']}`;

	await new sql.Request()
		.query(sqlQuery)
		.then((result) => {
			events = result.recordset;
		})
		.catch((err) => {
			console.log(err);
			req.flash('error', 'Error getting events');
		});

	console.log(event_type);
	console.log(events);
	res.render('update-eventType', {
		id: `${req.params['id']}`,
		event_type: event_type[0],
		events: events,
	});
});

async function updateEvent(name, id) {
	var sqlQuery = `UPDATE tbl_event SET name='${name}' WHERE id=${id};`;
	console.log(sqlQuery);

	return new Promise(function (resolve, reject) {
		new sql.Request()
			.query(sqlQuery)
			.then((result) => {
				resolve(result);
			})
			.catch((err) => {
				reject(err);
			});
	}).catch((err) => {
		console.log('SSQS');
	});
}

router.post('/portal/eventType/update/:id', async function (req, res) {
	console.log(req.body.events);

	var updateEvents = [];
	req.body.events.forEach((event) => {
		console.log(event);
		updateEvents.push(updateEvent(event.name, event.id));
	});
	await Promise.all(updateEvents);

	var sqlQuery = `UPDATE tbl_event_type SET name='${req.body.eventTypeName}' WHERE id=${req.params['id']}`;
	await new sql.Request()
		.query(sqlQuery)
		.then((result) => {
			getMeeting(req, res);
		})
		.catch((err) => {
			console.log(err);
			req.flash('error', 'Error updating event type');
		});
});

router.post('/portal/event/create/:id', async function (req, res) {
	var sqlQuery = 'SELECT MAX(id) FROM tbl_event';
	var maxID = 0;
	await new sql.Request()
		.query(sqlQuery)
		.then((result) => {
			console.log(result.recordset[0]['']);
			maxID = result.recordset[0][''];
		})
		.catch((err) => {
			res.status(400);
			res.send('Error!');
		});

	sqlQuery = `INSERT INTO tbl_event(name, event_type_id) VALUES ('New Event', ${req.params['id']})`;

	new sql.Request()
		.query(sqlQuery)
		.then((result) => {
			res.status(200);
			res.send(String(maxID + 1));
		})
		.catch((err) => {
			res.status(400);
			res.send('Error!');
		});
});

router.post('/portal/event/delete/:id', function (req, res) {
	var sqlQuery = `DELETE FROM tbl_event WHERE id=${req.params['id']}`;

	var sqlReq = new sql.Request()
		.query(sqlQuery)
		.then((result) => {
			res.status(200);
			res.send('Deleted!');
		})
		.catch((err) => {
			res.status(400);
			res.send('Failed to delete');
		});
});

router.get('/portal/eventType/delete/:id', function (req, res) {
	var sqlQuery = `DELETE FROM tbl_event WHERE event_type_id=${req.params['id']}`;

	var sqlReq = new sql.Request()
		.query(sqlQuery)
		.then((result) => {
			sqlQuery = `DELETE FROM tbl_event_type WHERE id=${req.params['id']}`;
			sqlReq = new sql.Request()
				.query(sqlQuery)
				.then((result) => {
					getMeeting(req, res);
				})
				.catch((err) => {
					console.log(err);
					req.flash('error', 'Error deleting event type');
				});
		})
		.catch((err) => {
			console.log(err);
			req.flash(
				'error',
				`Error deleting event under type: ${req.params['id']}`
			);
		});
});

router.get('/contact-us', function (req, res) {
	res.render('contact-us');
});

router.get('/portal/contact', function (req, res) {
	var sqlQuery = 'SELECT * FROM tbl_contact_form ORDER BY date_sent DESC';

	new sql.Request()
		.query(sqlQuery)
		.then((result) => {
			res.render('contact-us-back', { forms: result.recordset });
		})
		.catch((err) => {
			console.error(err);
			req.flash('error', 'Error loading contact forms');
			res.redirect('/portal');
		});
});

router.get('/portal/contact/view-form/:id', function (req, res) {
	var sqlQuery = `SELECT name, email, company, message FROM tbl_contact_form WHERE id = ${req.params.id}`;

	var sqlReq = new sql.Request()
		.query(sqlQuery)
		.then((result) => {
			res.status(200).json({
				status: 'success',
				data: result.recordset,
			});
		})
		.catch((err) => {
			console.log('query failed');
			req.flash('error', 'Error loading contact forms');
		});
});

router.post('/contact-us', function (req, res) {
	try {
		var sqlReq = new sql.Request();

		sqlReq.input('name', sql.NVarChar, req.body.txtName);
		sqlReq.input('email', sql.NVarChar, req.body.txtEmail);
		sqlReq.input('company', sql.NVarChar, req.body.txtCompany);
		sqlReq.input('message', sql.NVarChar, req.body.txtMessage);

		sqlReq
			.query(
				'INSERT INTO tbl_contact_form (name, email, company, message) VALUES (@name, @email, @company, @message)'
			)
			.then(async (result) => {
				await discord.sendOfficerMessage(req.body);

				req.flash('success', "Message sent, we'll be in touch soon.");

				res.redirect('/contact-us');
			})
			.catch((err) => {
				console.error(err);

				req.flash('error', "Whoops, we we're unable send your message.");
				res.redirect('/contact-us');
			});
	} catch (err) {
		console.error(err);

		req.flash('error', "Whoops, we we're unable send your message.");
		res.redirect('/contact-us');
	}
});

router.get('/newsletter', function (req, res) {
	var sqlQuery = 'SELECT * FROM tbl_newsletter';
	var sqlReq = new sql.Request()
		.query(sqlQuery)
		.then((result) => {
			res.render('newsletter', {
				newsletters: result.recordset,
				moment: moment,
				hostname: req.hostname,
			});
		})
		.catch((err) => {
			req.flash('error', 'Error loading newsletter.');
			res.render('index', { newsletters: [] });
		});
});

router.get('/portal/newsletter', function (req, res) {
	getNewsletters(req, res);
});

function getNewsletters(req, res) {
	var sqlQuery = 'SELECT * FROM tbl_newsletter';
	var sqlReq = new sql.Request()
		.query(sqlQuery)
		.then((result) => {
			res.render('newsletter-portal', {
				newsletters: result.recordset,
				moment: moment,
				hostname: req.hostname,
			});
		})
		.catch((err) => {
			res.render('index');
			req.flash('error', 'Error loading newsletters');
		});
}

router.get('/portal/newsletter/:id?', getNewsletters);
router.get('/portal/newsletter/create', getNewsletters);

router.post(
	'/portal/newsletter/create',
	upload_newsletter.single('newsletter'),
	function (req, res) {
		const name = req.body.newsletterName;
		let link =
			req.file === undefined ? undefined : req.file.path.replace(/\\/g, '/');
		var sqlReq = new sql.Request();
		link = link.substr(7);
		sqlReq.input('name', sql.NVarChar, name);
		sqlReq.input('link', sql.NVarChar, link);

		var queryText = `INSERT INTO tbl_newsletter (name, link) VALUES (@name, @link)`;

		sqlReq
			.query(queryText)
			.then((result) => {
				res.redirect('/portal/newsletter/');
			})
			.catch((err) => {
				req.flash('error', 'Error creating newsletter');
			});
	}
);

router.delete('/portal/newsletter/delete/:id', function (req, res) {
	try {
		// get the link from db
		var selectQuery = `SELECT link from tbl_newsletter WHERE id=${req.params['id']}`;
		let link = null;
		var sqlReq = new sql.Request()
			.query(selectQuery)
			.then((result) => {
				link = result.recordset[0].link;
				var sqlQuery = `DELETE FROM tbl_newsletter WHERE id=${req.params['id']};`;
				var sqlReq = new sql.Request()
					.query(sqlQuery)
					.then((result) => {
						fs.unlinkSync(link);
						res.redirect('/portal/newsletter/');
					})
					.catch((err) => {
						req.flash('error', 'Error creating newsletter');
					});
			})
			.catch((err) => {
				req.flash('error', 'Error getting newsletter link');
			});
	} catch (error) {
		console.log(error);
		res.status(400).send();
	}
});

// router.get('/sitemap.xml', function (req, res) {
// 	res.sendFile(path.join(__dirname, '../sitemap.xml'));
// });

// router.get('/robots.txt', function (req, res) {
// 	res.sendFile(path.join(__dirname, '../robots.txt'));
// });

function getDateOrdinal(dt) {
	return (
		dt.getDate() +
		(dt.getDate() % 10 == 1 && dt.getDate() != 11
			? 'st'
			: dt.getDate() % 10 == 2 && dt.getDate() != 12
			? 'nd'
			: dt.getDate() % 10 == 3 && dt.getDate() != 13
			? 'rd'
			: 'th')
	);
}

module.exports = router;
