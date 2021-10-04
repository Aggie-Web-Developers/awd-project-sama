const express = require('express');
const router = express.Router();
const flash = require('express-flash');
const sql = require('mssql');
const passport = require('passport');
const bcrypt = require('bcrypt');
const middleware = require('../../middleware');

router.get('/', middleware.checkAuthenticated, function (req, res) {
	new sql.Request()
		.query('SELECT id, email FROM tbl_user')
		.then((result) => {
			res.render('portal/logins/index', {
				logins: result.recordset,
			});
		})
		.catch((err) => {
			console.error(err);
			req.flash('error', 'Error loading user accounts.');
			res.render('portal/logins/index');
		});
});

router.get('/new', middleware.checkAuthenticated, function (req, res) {
	res.render('portal/logins/new');
});

router.post('/new', middleware.checkAuthenticated, async function (req, res) {
	try {
		const hashedPassword = await bcrypt.hash(req.body.txtPassword, process.env.SALT);

		var sqlReq = new sql.Request();

		sqlReq.input('email', sql.NVarChar, req.body.txtEmail);
		sqlReq.input('password_hash', sql.NVarChar, hashedPassword);

		var queryText =
			'IF NOT EXISTS (SELECT * FROM tbl_user WHERE email = @email) ' +
			'BEGIN ' +
			'INSERT INTO tbl_user (email, password_hash) ' +
			'values (@email, @password_hash) ' +
			'END';

		sqlReq
			.query(queryText)
			.then((result) => {
				if (result.rowsAffected == 0) {
					req.flash('error', 'Error creating account. Email address in use.');
					res.redirect('/portal/logins/new');
				} else {
					req.flash(
						'success',
						'Account created! The new login is able to access the portal.'
					);
					res.redirect('/portal/logins');
				}
			})
			.catch((err) => {
				console.error(err);

				req.flash('error', 'Error creating login.');
				res.redirect('/portal/logins/new');
			});
	} catch (err) {
		console.error(err);
		req.flash('error', 'Unable to create login.');
		res.redirect('/portal/logins/new');
	}
});

router.get('/delete/:id', middleware.checkAuthenticated, function (req, res) {
	if (req.params.id == null || req.params.id < 1) {
		req.flash('error', 'Unable to delete login.');
		res.redirect('/portal/logins');
	} else {
		try {
			new sql.Request()
				.input('id', sql.NVarChar, req.params.id)
				.query('DELETE FROM tbl_user WHERE id = @id')
				.then((result) => {
					// if user is logged in with the account being deleted, log them out to prevent deserialization error
					if (req.user.id == req.params.id) {
						req.logOut();
					}

					req.flash('success', 'Login successfully deleted.');
					res.redirect('/portal/logins');
				})
				.catch((err) => {
					console.error(err);
					req.flash('error', 'Unable to delete login.');
					res.redirect('/portal/logins');
				});
		} catch (err) {
			console.error(err);
			req.flash('error', 'Unable to delete login.');
			res.redirect('/portal/logins');
		}
	}
});

module.exports = router;
