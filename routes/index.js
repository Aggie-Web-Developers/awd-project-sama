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
