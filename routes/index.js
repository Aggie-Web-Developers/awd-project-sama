const express = require('express');
const router = express.Router();
const flash = require('express-flash');
const sql = require('mssql');
const path = require('path');
const fetch = require('node-fetch');
const fs = require('fs');
const moment = require('moment');
const axios = require('axios');
const discord = require('../discord/discord');

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
			`https://www.googleapis.com/calendar/v3/calendars/${process.env.GCAL_ID}/events?key=${process.env.GCAL_API_KEY}&singleEvents=true&orderBy=startTime&timeMin=${dateString}&timeZone=UTC`
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
	var sqlReq = new sql.Request();
	sqlReq.input('id', sql.Int, id);

	var sqlQuery = `SELECT name, email, company, message FROM tbl_contact_form WHERE id = @id`;

	sqlReq
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
