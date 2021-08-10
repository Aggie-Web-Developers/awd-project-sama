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
