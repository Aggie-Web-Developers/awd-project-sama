const express = require('express');
const router = express.Router();
const sql = require('mssql');
const middleware = require('../../middleware');

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

router.get('/meetings', middleware.checkAuthenticated, async (req, res) => {
	try {
		getMeeting(req, res);
	} catch (err) {
		console.error(err);
		res.render('index');
	}
});

router.get(
	'/meeting/create',
	middleware.checkAuthenticated,
	async (req, res) => {
		res.render('create-meeting');
	}
);

router.post(
	'/meeting/create',
	middleware.checkAuthenticated,
	async (req, res) => {
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
	}
);

router.get('/meeting/update/:id', middleware.checkAuthenticated, function (
	req,
	res
) {
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

router.post('/meeting/update/:id', middleware.checkAuthenticated, function (
	req,
	res
) {
	const name = req.body.meetingName;
	const description = req.body.meetingDescription;
	const link = req.body.meetingLink;
	const time = req.body.meetingTime;
	const day = req.body.meetingDay;

	var sqlQuery = `UPDATE tbl_meeting SET name = '${name}', description = '${description}', link = '${link}', time = '${time}', day = '${day}'
				WHERE id=${req.params['id']}`;

	var sqlReq = new sql.Request()
		.query(sqlQuery)
		.then((result) => {
			getMeeting(req, res);
		})
		.catch((err) => {
			console.error(err);
			req.flash('error', 'Error updating meeting');
		});
});

router.get('/meeting/delete/:id', middleware.checkAuthenticated, function (
	req,
	res
) {
	var sqlQuery = `DELETE FROM tbl_meeting WHERE id=${req.params['id']}`;

	var sqlReq = new sql.Request()
		.query(sqlQuery)
		.then((result) => {
			getMeeting(req, res);
		})
		.catch((err) => {
			console.error(err);
			req.flash('error', 'Error deleting meeting');
		});
});

router.get(
	'/eventType/update/:id',
	middleware.checkAuthenticated,
	async function (req, res) {
		var sqlQuery = `SELECT * FROM tbl_event_type WHERE id=${req.params['id']}`;
		var event_type, events;

		await new sql.Request()
			.query(sqlQuery)
			.then((result) => {
				event_type = result.recordset;
			})
			.catch((err) => {
				console.error(err);
				req.flash('error', 'Error getting event type');
			});

		sqlQuery = `SELECT * FROM tbl_event WHERE event_type_id=${req.params['id']}`;

		await new sql.Request()
			.query(sqlQuery)
			.then((result) => {
				events = result.recordset;
			})
			.catch((err) => {
				console.error(err);
				req.flash('error', 'Error getting events');
			});

		res.render('update-eventType', {
			id: `${req.params['id']}`,
			event_type: event_type[0],
			events: events,
		});
	}
);

async function updateEvent(name, id) {
	var sqlQuery = `UPDATE tbl_event SET name='${name}' WHERE id=${id};`;

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
		console.error(error);
	});
}

router.post(
	'/eventType/update/:id',
	middleware.checkAuthenticated,
	async function (req, res) {
		var updateEvents = [];
		req.body.events.forEach((event) => {
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
				console.error(err);
				req.flash('error', 'Error updating event type');
			});
	}
);

router.post('/event/create/:id', middleware.checkAuthenticated, async function (
	req,
	res
) {
	var sqlQuery = 'SELECT MAX(id) FROM tbl_event';
	var maxID = 0;
	await new sql.Request()
		.query(sqlQuery)
		.then((result) => {
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

router.post('/event/delete/:id', middleware.checkAuthenticated, function (
	req,
	res
) {
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

router.get('/eventType/delete/:id', middleware.checkAuthenticated, function (
	req,
	res
) {
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
					console.error(err);
					req.flash('error', 'Error deleting event type');
				});
		})
		.catch((err) => {
			console.error(err);
			req.flash(
				'error',
				`Error deleting event under type: ${req.params['id']}`
			);
		});
});

module.exports = router;
