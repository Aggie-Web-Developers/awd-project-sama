const express = require('express');
const router = express.Router();
const flash = require('express-flash');
const sql = require('mssql');
const passport = require('passport');
const bcrypt = require('bcrypt');
const middleware = require('../../middleware');

router.get('/', middleware.checkAuthenticated, function (req, res) {
	new sql.Request()
		.query('SELECT * FROM tbl_announcement')
		.then((result) => {
			res.render('portal/announcements/index', {
				announcements: result.recordset,
			});
		})
		.catch((err) => {
			console.error(err);
			req.flash('error', 'Error loading announcements.');
			res.render('portal/announcements/index');
		});
});

router.get('/new', middleware.checkAuthenticated, function (req, res) {
	res.render('portal/announcements/new');
});

router.post('/new', middleware.checkAuthenticated, async function (req, res) {
	try {
		var sqlReq = new sql.Request();

		sqlReq.input('subject', sql.NVarChar, req.body.txtSubject);
		sqlReq.input('body', sql.NVarChar, req.body.txtBody);

		sqlReq
			.query(
				'INSERT INTO tbl_announcement (subject, body) VALUES (@subject, @body)'
			)
			.then((result) => {
				req.flash(
					'success',
					'Announcement created! We also sent a Discord message.'
				);
				res.redirect('/portal/announcements');
			})
			.catch((err) => {
				console.error(err);

				req.flash('error', 'Error creating announcement.');
				res.redirect('/portal/announcements/new');
			});
	} catch (err) {
		console.error(err);
		req.flash('error', 'Unable to create announcement.');
		res.redirect('/portal/announcements/new');
	}
});

router.get('/delete/:id', middleware.checkAuthenticated, function (req, res) {
	if (req.params.id == null || req.params.id < 1) {
		req.flash('error', 'Unable to delete announcement.');
		res.redirect('/portal/announcements');
	} else {
		try {
			new sql.Request()
				.input('id', sql.NVarChar, req.params.id)
				.query('DELETE FROM tbl_announcement WHERE id = @id')
				.then((result) => {
					req.flash('success', 'Announcement deleted.');
					res.redirect('/portal/announcements');
				})
				.catch((err) => {
					console.error(err);
					req.flash('error', 'Unable to delete announcement.');
					res.redirect('/portal/announcements');
				});
		} catch (err) {
			console.error(err);
			req.flash('error', 'Unable to delete announcement.');
			res.redirect('/portal/announcements');
		}
	}
});

module.exports = router;
