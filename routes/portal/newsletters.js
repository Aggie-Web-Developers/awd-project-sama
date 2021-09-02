const express = require('express');
const router = express.Router();
const sql = require('mssql');
const middleware = require('../../middleware');
const moment = require('moment');
const multer = require('multer');

const multerFilter = (req, file, cb) => {
	if (file.mimetype.split('/')[1] === 'pdf') {
		cb(null, true);
	} else {
		cb(new Error('Not a PDF File!!'), false);
	}
};

const storage_newsletters = multer.diskStorage({
	destination: function (req, file, cb) {
		cb(null, 'public/newsletters');
	},
	filename: function (req, file, cb) {
		cb(null, file.originalname.replace(/ /g, '_'));
	},
});

const upload_newsletter = multer({
	storage: storage_newsletters,
	fileFilter: multerFilter,
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
			console.error(err);
			req.flash('error', 'Error loading newsletters');
			res.redirect('/portal/');
		});
}

router.get('/', middleware.checkAuthenticated, getNewsletters);
router.get('/create', middleware.checkAuthenticated, getNewsletters);

router.post(
	'/create',
	[middleware.checkAuthenticated, upload_newsletter.single('newsletter')],
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
				res.redirect('/portal/newsletters/');
			})
			.catch((err) => {
				console.error(err);
				req.flash('error', 'Error creating newsletter');
				res.redirect('/portal/newsletters');
			});
	}
);

router.delete('/delete/:id', middleware.checkAuthenticated, function (
	req,
	res
) {
	try {
		const sqlReq = new sql.Request();
		sqlReq.input('id', sql.Int, req.params.id);

		sqlReq
			.query(`SELECT link from tbl_newsletter WHERE id = @id`)
			.then((result) => {
				const link = result.recordset[0].link;

				const sqlReq2 = new sql.Request();
				sqlReq2.input('id', sql.Int, req.params.id);

				sqlReq2
					.query(`DELETE FROM tbl_newsletter WHERE id= @id`)
					.then((result) => {
						fs.unlinkSync(link);
						res.redirect('/portal/newsletters/');
					})
					.catch((err) => {
						console.error(err);
						req.flash('error', 'Error creating newsletter');
						res.redirect('/portal/newsletters');
					});
			})
			.catch((err) => {
				console.error(err);
				req.flash('error', 'Error getting newsletter link');
				res.redirect('/portal/newsletters');
			});
	} catch (error) {
		console.log(error);
		res.status(400).send();
	}
});

module.exports = router;
