const express = require('express');
const router = express.Router();
const flash = require('express-flash');
const sql = require('mssql');
const path = require('path');
const fetch = require('node-fetch');

// Setup multer with disk storage
const multer = require('multer');
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
router.get('/meetings', function (req, res) {
	res.render('meetings.ejs');
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

router.get('/officers', function (req, res) {

	var sqlQuery = 'SELECT name, officerRole, bio, profilePic FROM officers';

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

router.get('/weekly-meeting-page', async (req, res) => {
	try {
		var sqlQuery = `SELECT * FROM tbl_event`;

		var events, event_types, meeting;
		await new sql.Request().query(sqlQuery)
			.then((result) => {
				events = result.recordset;
			})
			.catch((err) => {
				req.flash('error', 'Error getting meetings and events')
			});

		sqlQuery = `SELECT * FROM tbl_event_type`;

		await new sql.Request().query(sqlQuery)
			.then((result) => {
				event_types = result.recordset;
			})
			.catch((err) => {
				req.flash('error', 'Error getting meetings and events')
			});

		sqlQuery = `SELECT * FROM tbl_meeting`;

		await new sql.Request().query(sqlQuery)
			.then((result) => {
				meetings = result.recordset;
			})
			.catch((err) => {
				req.flash('error', 'Error getting meetings and events')
			});

		var sortedEvents = [];
		event_types.forEach((type) => {
			var obj = {};
			obj['type'] = type;
			obj['events'] = [];
			events.forEach((event) => {
				if(event.event_type_id === type.id) 
					obj['events'].push(event);
			});
			sortedEvents.push(obj);
		});

		res.render('weekly-meeting-page', {event_map: sortedEvents, meetings: meetings});
	} catch(err) {
		console.log(err);
		res.render('index');
	}
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
