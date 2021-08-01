const express = require('express');
const router = express.Router();
const flash = require('express-flash');
const sql = require('mssql');
const path = require('path');
const fetch = require('node-fetch');
const fs = require('fs');
var moment = require('moment');

// Setup multer with disk storage
const multer = require('multer');
var storage = multer.diskStorage({
	destination: function (req, file, cb) {
		cb(null, './public/images/profiles')
	},
	filename: function (req, file, cb) {
		cb(null, file.originalname.replace(/ /g, '_'))
	}
})

const multerFilter = (req, file, cb) => {
	if (file.mimetype.split("/")[1] === "pdf") {
		cb(null, true);
	} else {
		cb(new Error("Not a PDF File!!"), false);
	}
};

var storage_newsletters = multer.diskStorage({
	destination: function (req, file, cb) {
		cb(null, './public/newsletters')
	},
	filename: function (req, file, cb) {
		cb(null, file.originalname.replace(/ /g, '_'))
	}
})

var upload = multer({ storage: storage });
var upload_newsletter = multer({
	storage: storage_newsletters,
	fileFilter: multerFilter
});

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
		res.render('officers', { officers: result.recordset });
	}).catch((err) => {
		req.flash('error', 'Error loading officers');
	});
});

function getOfficers(req, res) {
	var sqlQuery = "SELECT * FROM tbl_officer";

	var sqlReq = new sql.Request().query(sqlQuery).then((result) => {
		res.render('officer-portal', { officers: result.recordset });
	}).catch((err) => {
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

	var sqlReq = new sql.Request().query(sqlQuery).then((result) => {
		getOfficers(req, res);
	}).catch((err) => {
		req.flash('error', 'Error creating officer');
	});
});

router.post('/portal/officer/:id', upload.single('officerProfileImage'), function (req, res) {
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

	var sqlReq = new sql.Request().query(sqlQuery).then((result) => {
		getOfficers(req, res);
	}).catch((err) => {
		req.flash('error', 'Error loading officers');
	});
});

router.post('/portal/officer/delete/:id', function (req, res) {
	// console.log(`DELETING ${req.params['id']}`);
	var sqlQuery = `DELETE FROM tbl_officer WHERE id=${req.params['id']};`;

	var sqlReq = new sql.Request().query(sqlQuery).then((result) => {
		getOfficers(req, res);
	}).catch((err) => {
		req.flash('error', 'Error creating officer');
	});
});

router.get('/newsletter', function (req, res) {
	res.render('newsletter')
})

router.get('/weekly-meeting-page', function (req, res) {
	res.render('weekly-meeting-page');
});

router.get('/contact-us', function (req, res) {
	res.render('contact-us');

});

router.get('/portal/contact', function (req, res) {
	var sqlQuery = "SELECT * FROM contact_forms";

	var sqlReq = new sql.Request().query(sqlQuery).then((result) => {
		res.render('contact-us-back', { forms: result.recordset });
	}).catch((err) => {
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
})

router.get('/portal/newsletter', function (req, res) {
	getNewsletters(req, res);
});

function getNewsletters(req, res) {
	var sqlQuery = "SELECT * FROM tbl_newsletter";
	var sqlReq = new sql.Request().query(sqlQuery).then((result) => {
		res.render('newsletter-portal', { newsletters: result.recordset, moment: moment});
	}).catch((err) => {
		res.render('index');
		req.flash('error', 'Error loading newsletters');
	});
}

router.get('/portal/newsletter/:id?', getNewsletters);
router.get('/portal/newsletter/create', getNewsletters);

router.post('/portal/newsletter/create', upload_newsletter.single('newsletter'), function (req, res) {
	const name = req.body.newsletterName;
	const link = req.file === undefined ? undefined : req.file.path;
	// sqlReq.input("name", sql.NVarChar, req.body.newsletterName);

	console.log(link);
	var sqlQuery = `INSERT INTO tbl_newsletter (name, link) 
					VALUES ('${name}', '${link}')`;

	// var sqlQuery = `INSERT INTO tbl_newsletter (name, link) 
	// VALUES (@name, @link)`;

	var sqlReq = new sql.Request().query(sqlQuery).then((result) => {
		res.redirect('/portal/newsletter/')
	}).catch((err) => {
		req.flash('error', 'Error creating newsletter');
	});
});

router.delete('/portal/newsletter/delete/:id', function (req, res) {
	try {
		//get the link from db
		var selectQuery = `SELECT link from tbl_newsletter WHERE id=${req.params['id']}`;
		let link = null;
		var sqlReq = new sql.Request().query(selectQuery).then((result) => {
			link = result.recordset[0].link;
			var sqlQuery = `DELETE FROM tbl_newsletter WHERE id=${req.params['id']};`;
			console.log(sqlQuery);
			var sqlReq = new sql.Request().query(sqlQuery).then((result) => {
				console.log(link)
				fs.unlinkSync(link)
				res.redirect('/portal/newsletter/');
			}).catch((err) => {
				req.flash('error', 'Error creating newsletter');
			});
		}).catch((err) => {
			req.flash('error', 'Error getting newsletter link');
		});

	} catch (error) {
		console.log(error);
		res.status(400).send();
	}
});

// router.post('/portal/newsletter/:id', upload.single('newsletter'), async (req, res) => {
// 	try {
// 		const newFile = await File.create({
// 			name: req.file.filename
// 		})
// 		res.status(200).json({
// 			status: 'success',
// 			message: 'File created successfully!!'
// 		});
// 	} catch (error) {
// 		res.json({
// 			error
// 		});
// 	}
// });

// router.get('/sitemap.xml', function (req, res) {
// 	res.sendFile(path.join(__dirname, '../sitemap.xml'));
// });

// router.get('/robots.txt', function (req, res) {
// 	res.sendFile(path.join(__dirname, '../robots.txt'));
// });

module.exports = router;