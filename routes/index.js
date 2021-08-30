const express = require('express');
const router = express.Router();
const flash = require('express-flash');
const sql = require('mssql');
const path = require('path');
const fetch = require('node-fetch');

// Setup multer with disk storage
const multer = require('multer');
const { assert } = require('console');
var storage = multer.diskStorage({
	destination: function (req, file, cb) {
		cb(null, './public/images/profiles');
	},
	filename: function (req, file, cb) {
		cb(null, file.originalname.replace(/ /g, '_'));
	},
});
var upload = multer({ storage: storage });

router.get('/', function (req, res) {
	res.render('index');
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
	var sqlQuery = 'SELECT name, officerRole, bio, profilePic FROM tbl_officer';

	var sqlReq = new sql.Request()
		.query(sqlQuery)
		.then((result) => {
			res.render('officers', { officers: result.recordset });
		})
		.catch((err) => {
			req.flash('error', 'Error loading officers');
		});
});

function getOfficers(req, res) {
	var sqlQuery = 'SELECT * FROM tbl_officer';

	var sqlReq = new sql.Request()
		.query(sqlQuery)
		.then((result) => {
			res.render('officer-portal', { officers: result.recordset });
		})
		.catch((err) => {
			res.render('index');
			req.flash('error', 'Error loading officers');
		});
}

router.get('/portal/officer/:id?', getOfficers);
router.get('/portal/officer/create', getOfficers);

router.post('/portal/officer/create', function (req, res) {
	console.log(req);
	const name = req.body.officerName;
	const role = req.body.officerRole;
	const description = req.body.officerDescription;

	var sqlQuery = `INSERT INTO tbl_officer (name, officerRole, bio, profilePic, id) 
					VALUES ('${name}', '${role}', '${description}', ' ', (SELECT MAX(id) FROM tbl_officer) + 1)`;

	var sqlReq = new sql.Request()
		.query(sqlQuery)
		.then((result) => {
			getOfficers(req, res);
		})
		.catch((err) => {
			req.flash('error', 'Error creating officer');
		});
});

router.post(
	'/portal/officer/:id',
	upload.single('officerProfileImage'),
	function (req, res) {
		const name = req.body.officerName;
		const role = req.body.officerRole;
		const description = req.body.officerDescription;
		const profPic = req.file === undefined ? undefined : req.file.path;

		var sqlQuery;
		if (profPic)
			sqlQuery = `UPDATE tbl_officer SET name = '${name}', officerRole = '${role}', bio = '${description}', profilePic = '${profPic}' 
					WHERE id=${req.params['id']}`;
		else
			sqlQuery = `UPDATE tbl_officer SET name = '${name}', officerRole = '${role}', bio = '${description}' 
					WHERE id=${req.params['id']}`;

		var sqlReq = new sql.Request()
			.query(sqlQuery)
			.then((result) => {
				getOfficers(req, res);
			})
			.catch((err) => {
				req.flash('error', 'Error loading officers');
			});
	}
);

router.post('/portal/officer/delete/:id', function (req, res) {
	// console.log(`DELETING ${req.params['id']}`);

	var sqlQuery = `DELETE FROM tbl_officer WHERE id=${req.params['id']};`;

	var sqlReq = new sql.Request()
		.query(sqlQuery)
		.then((result) => {
			getOfficers(req, res);
		})
		.catch((err) => {
			req.flash('error', 'Error creating officer');
		});
});

router.get('/newsletter', function (req, res) {
	res.render('newsletter');
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

router.get('/portal/meeting/update/:id', function(req, res) {
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

router.post('/portal/meeting/update/:id', function(req, res) {
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

router.get('/portal/meeting/delete/:id', function(req, res) {
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

router.get('/portal/eventType/update/:id', async function(req, res) {
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
	res.render('update-eventType', { id: `${req.params['id']}`, event_type: event_type[0], events: events });
});

async function updateEvent(name, id) {
	var sqlQuery = `UPDATE tbl_event SET name='${name}' WHERE id=${id};`;
	console.log(sqlQuery);

	return new Promise( function(resolve, reject) {
		new sql.Request().query(sqlQuery).then((result) => {
			resolve(result);
		}).catch(err => {
			reject(err);
		})
	}).catch(err => {
		console.log("SSQS");
	});
}

router.post('/portal/eventType/update/:id', async function(req, res) {
	console.log(req.body.events);

	var updateEvents = []
	req.body.events.forEach(event => {
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

router.post('/portal/event/create/:id', async function(req, res) {
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
			res.send(String(maxID+1));
		})
		.catch((err) => {
			res.status(400);
			res.send('Error!');
		});
});

router.post('/portal/event/delete/:id', function(req, res) {
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

router.get('/portal/eventType/delete/:id', function(req, res) {
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
			req.flash('error', `Error deleting event under type: ${req.params['id']}` );
		});
});

router.get('/contact-us', function (req, res) {
	res.render('contact-us');
});

router.get('/portal/contact', function (req, res) {
	var sqlQuery = 'SELECT * FROM contact_forms';

	var sqlReq = new sql.Request()
		.query(sqlQuery)
		.then((result) => {
			res.render('contact-us-back', { forms: result.recordset });
		})
		.catch((err) => {
			req.flash('error', 'Error loading contact forms');
		});
});

router.post('/contact-us-submission', function (req, res) {
	/* do something with the form req */

	res.render('contact-us-submission');
});

router.get('/newsletter', function (req, res) {
	var sqlQuery = 'SELECT * FROM newsletters';

	var sqlReq = new sql.Request()
		.query(sqlQuery)
		.then((result) => {
			res.render('newsletter', { newsletters: result.recordset });
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

module.exports = router;
