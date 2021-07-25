const express = require('express');
const router = express.Router();
const flash = require('express-flash');
const sql = require('mssql');
const path = require('path');
const fetch = require('node-fetch');
const fs = require('fs');

// Setup multer with disk storage
const multer = require('multer');
const { nextTick } = require('process');
var storage = multer.diskStorage({
	destination: function (req, file, cb) {
		cb(null, './public/images/profiles');
	},
	filename: function (req, file, cb) {
		var fname = file.originalname.slice(file.originalname.lastIndexOf('/') + 1);
		cb(null, fname.replace(/ /g, '_'));
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
			console.log('Ran SQL Request!');
			res.render('officer-portal', { officers: result.recordset });
		})
		.catch((err) => {
			res.render('index');
			req.flash('error', 'Error loading officers');
		});
	console.log('Done with SQL Request!');
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
		const picName = profPic ? profPic.slice(profPic.lastIndexOf('/') + 1) : '';

		var sqlQuery;
		// Query for old profile picture
		sqlQuery = `SELECT profilePic FROM tbl_officer WHERE id=${req.params['id']}`;
		new sql.Request()
			.query(sqlQuery)
			.then((result) => {
				var oldProfPic = result.recordset[0]['profilePic'];
				// Delete old profile picture if exists
				if (oldProfPic != ' ') {
					var oldPicPath = './public/images/profiles/' + oldProfPic;
					fs.unlinkSync(oldPicPath);
				}

				if (profPic)
					sqlQuery = `UPDATE tbl_officer SET name = '${name}', officerRole = '${role}', bio = '${description}', profilePic = '${picName}' 
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
			})
			.catch((err) => {
				req.flash(
					'error',
					`Error loading finding officer with id: ${req.params['id']}`
				);
			});
	}
);

router.delete('/portal/officer/delete/:id', function (req, res) {
	console.log(`DELETING ${req.params['id']}`);

	var sqlQuery = `DELETE FROM tbl_officer WHERE id=${req.params['id']};`;

	var sqlReq = new sql.Request()
		.query(sqlQuery)
		.then((result) => {
			res.status(200).send('SUCCESS!');
		})
		.catch((err) => {
			// console.log(err);
			req.flash('error', 'Error creating officer');
			res.status(400).send();
		});
});

router.get('/newsletter', function (req, res) {
	res.render('newsletter');
});

router.get('/weekly-meeting-page', function (req, res) {
	res.render('weekly-meeting-page');
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
