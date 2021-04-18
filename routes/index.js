const express = require('express');
const router = express.Router();
const flash = require('express-flash');
const sql = require('mssql');
const path = require('path');
const fetch = require('node-fetch');

router.get('/', function (req, res) {
	res.render('index');
});

router.get('/terms-and-conditions', function (req, res) {
	res.render('terms-and-conditions');
});

router.get('/privacy-policy', function (req, res) {
	res.render('privacy-policy');
});

// router.get('/officers-test', function (req, res) {
// 	res.render('officers-test');
// });

router.get('/officers-test', function (req, res) {
	var sqlQuery = 'SELECT * FROM officers';
	console.log("sending query...");
	var sqlReq = new sql.Request().query(sqlQuery).then((result) => {
		res.render('officers-test', {officers: result.recordset});
		console.log("a");
	}).catch((err) => {
		req.flash("error", "Error loading officers");
		console.log("b");
	});
	console.log("end of the route");
});

router.get('/weekly-meeting-page', function (req, res) {
	res.render('weekly-meeting-page');
});

// router.get('/sitemap.xml', function (req, res) {
// 	res.sendFile(path.join(__dirname, '../sitemap.xml'));
// });

// router.get('/robots.txt', function (req, res) {
// 	res.sendFile(path.join(__dirname, '../robots.txt'));
// });

module.exports = router;
