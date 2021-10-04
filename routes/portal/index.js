const express = require('express');
const router = express.Router();
const flash = require('express-flash');
const sql = require('mssql');
const passport = require('passport');
const bcrypt = require('bcrypt');
const middleware = require('../../middleware');

router.get('/', middleware.checkAuthenticated, function (req, res) {
	res.render('portal/index');
});

router.get('/login', middleware.checkNotAuthenticated, function (req, res) {
	res.render('portal/login');
});

// Login in post route handled by authentication logic in passport-config.js
router.post(
	'/login',
	middleware.checkNotAuthenticated,
	passport.authenticate('local', {
		successRedirect: '/portal/',
		failureRedirect: '/portal/login',
		failureFlash: true,
	})
);

// Register page restricted to officers, soley to add new logins
router.get('/register', middleware.checkAuthenticated, function (req, res) {
	res.render('portal/register');
});

router.post('/register', middleware.checkAuthenticated, async function (
	req,
	res
) {
	try {
		const hashedPassword = await bcrypt.hash(req.body.txtPassword, process.env.SALT);

		var sqlReq = new sql.Request();

		sqlReq.input('email', sql.NVarChar, req.body.txtEmailAddress);
		sqlReq.input('password_hash', sql.NVarChar, hashedPassword);
		sqlReq.input('receiveNewsletter', sql.Bit, req.body.chkNews === 'on');

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
					req.flash(
						'error',
						'Error creating account. Your email address in use.'
					);
					res.redirect('/portal/register');
				} else {
					email.sendValidationEmail(
						req.body.txtFirstName,
						req.body.txtEmailAddress,
						link
					);

					req.flash(
						'success',
						'Account created! The new login is able to access the portal.'
					);
					res.redirect('/portal/login');
				}
			})
			.catch((err) => {
				console.error(err);

				req.flash('error', 'Error creating login.');
				res.redirect('/portal/register');
			});
	} catch {
		req.flash('error', 'Error creating login.');
		res.redirect('/portal/register');
	}
});

router.get('/logout', middleware.checkAuthenticated, (req, res) => {
	req.logOut();
	res.redirect('/portal/login');
});

module.exports = router;
