const express = require('express');
const router = express.Router();
const flash = require('express-flash');
const sql = require('mssql');
const path = require('path');
const fetch = require('node-fetch');

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
    var sqlQuery = "SELECT name, officerRole, bio, profilePic FROM officers";

    var sqlReq = new sql.Request().query(sqlQuery).then((result) => {
        res.render('officers', {officers: result.recordset});
    }).catch((err) => {
        req.flash('error', 'Error loading officers');
    });
});

router.get('/portal/officer', function (req, res) {
	res.render('meetings');
});

router.get('/newsletter', function (req, res) {
	res.render('newsletter')
})


router.get('/weekly-meeting-page', function (req, res) {
	res.render('weekly-meeting-page');
});

router.get('/contact-us',  function (req, res) {
	res.render('contact-us');

});
router.get('/portal/contact', function (req, res) {
	var sqlQuery = "SELECT * FROM tbl_contact_form";

	var sqlReq = new sql.Request().query(sqlQuery).then((result) => {
		res.render('contact-us-back', {forms: result.recordset});
	}).catch((err) => {
		req.flash('error', 'Error loading contact forms');
	});

});

router.get('/portal/contact/view-form/:id', function (req, res) {
	console.log(req.params.id);
	var sqlQuery = `SELECT name, email, company, message FROM tbl_contact_form WHERE id = ${req.params.id}`;

	var sqlReq = new sql.Request().query(sqlQuery).then((result) => {
		console.log('query successful');
		res.status(200).json({
			status: 'success',
			data: result.recordset
		});
	}).catch((err) => {
		console.log('query failed');
		req.flash('error', 'Error loading contact forms');
	});

});

router.post('/contact-us/submit', function (req, res) {
	/* do something with the form req */
	console.log('submit');

	const name = req.body.name;
	const email = req.body.email;
	const company = req.body.company;
	const message = req.body.message;

	var sqlQuery = `INSERT INTO tbl_contact_form (name, email, company, message) 
					VALUES ('${name}', '${email}', '${company}', '${message}')`;

	var sqlReq = new sql.Request().query(sqlQuery).then((result) => {
		console.log('query successful');
		// thank you page
		res.status(200).json({
			status: 'success',
			data: result.recordset
		});
	}).catch((err) => {
		console.log('query failed');
		console.log(err)
		req.flash('error', 'Error uploading contact form');
	});

	// res.render('contact-us');
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
            res.render('index', { newsletters: []});
        });
})

// router.get('/sitemap.xml', function (req, res) {
// 	res.sendFile(path.join(__dirname, '../sitemap.xml'));
// });

// router.get('/robots.txt', function (req, res) {
// 	res.sendFile(path.join(__dirname, '../robots.txt'));
// });

module.exports = router;
