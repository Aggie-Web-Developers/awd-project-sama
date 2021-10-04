const express = require('express');
const router = express.Router();
const sql = require('mssql');
const middleware = require('../../middleware');
const multer = require('multer');
const { nanoid } = require('nanoid');
const storage = multer.diskStorage({
	destination: function (req, file, cb) {
		cb(null, 'public/images/profiles');
	},
	filename: function (req, file, cb) {
		cb(null, file.originalname.replace(/ /g, '_') + nanoid(4));
	},
});

const upload = multer({ storage: storage });

function getOfficers(req, res) {
	new sql.Request()
		.query('SELECT * FROM tbl_officer')
		.then((result) => {
			res.render('officer-portal', { officers: result.recordset });
		})
		.catch((err) => {
			console.error(err);
			res.redirect('/portal/');
			req.flash('error', 'Error loading officers');
		});
}

router.get('/', middleware.checkAuthenticated, getOfficers);
router.get('/create', middleware.checkAuthenticated, getOfficers);

router.post(
	'/create',
	[middleware.checkAuthenticated, upload.single('newOfficerProfileImage')],
	function (req, res) {
		const name = req.body.officerName;
		const role = req.body.officerRole;
		const description = req.body.officerDescription;
		const profPic = req.file === undefined ? undefined : req.file.path;

		const sqlReq = new sql.Request();

		sqlReq.input('name', sql.NVarChar, name);
		sqlReq.input('role', sql.NVarChar, role);
		sqlReq.input('bio', sql.NVarChar, description);
		sqlReq.input('picture', sql.NVarChar, profPic);
		sqlReq.input('id', sql.Int, req.params.id);

		var sqlQuery = `INSERT INTO tbl_officer (name, officerRole, bio, profilePic)
					VALUES (@name, @role, @bio, @picture`;

		sqlReq
			.query(sqlQuery)
			.then((result) => {
				res.redirect('/portal/officers');
			})
			.catch((err) => {
				req.flash('error', 'Error creating officer');
				console.error(err);
				res.redirect('/portal/officers');
			});
	}
);

router.post(
	'/:id',
	[middleware.checkAuthenticated, upload.single('officerProfileImage')],
	function (req, res) {
		const name = req.body.officerName;
		const role = req.body.officerRole;
		const description = req.body.officerDescription;
		const profPic = req.file === undefined ? undefined : req.file.path;

		const sqlReq = new sql.Request();
		sqlReq.input('name', sql.NVarChar, name);
		sqlReq.input('role', sql.NVarChar, role);
		sqlReq.input('bio', sql.NVarChar, description);
		sqlReq.input('picture', sql.NVarChar, profPic);
		sqlReq.input('id', sql.Int, req.params.id);

		let sqlQuery;
		if (profPic)
			sqlQuery = `UPDATE tbl_officer SET name = @name, officerRole = @role, bio = @bio, profilePic = @picture WHERE id= @id`;
		else
			sqlQuery = `UPDATE tbl_officer SET name = @name, officerRole = @role, bio = @bio WHERE id= @id`;

		sqlReq
			.query(sqlQuery)
			.then((result) => {
				res.redirect('/portal/officers');
			})
			.catch((err) => {
				console.error(err);
				req.flash('error', 'Error loading officers');
				res.redirect('/portal/officers');
			});
	}
);

router.post('/delete/:id', middleware.checkAuthenticated, function (req, res) {
	const sqlReq = new sql.Request();
	sqlReq.input('id', sql.Int, req.params.id);

	const sqlQuery = `DELETE FROM tbl_officer WHERE id = @id`;

	sqlReq
		.query(sqlQuery)
		.then((result) => {
			res.redirect('/portal/officers');
		})
		.catch((err) => {
			console.error(err);
			req.flash('error', 'Error creating officer');
			res.redirect('/portal/officers');
		});
});

module.exports = router;
