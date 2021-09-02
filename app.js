require('dotenv').config();
const express = require('express');
const session = require('express-session');
const app = express();
const bodyParser = require('body-parser');
const methodOverride = require('method-override');
const sql = require('mssql');
const bcrypt = require('bcrypt');
const initPassport = require('./passport-config');
const passport = require('passport');
const flash = require('express-flash');
const baseRoutes = require('./routes');
const portalRoutes = require('./routes/portal/index');
const loginsRoutes = require('./routes/portal/logins');
const announcementRoutes = require('./routes/portal/announcements');
const officerRoutes = require('./routes/portal/officers');
const newsletterRoutes = require('./routes/portal/newsletters');
const cookie = require('express-session/session/cookie');

initPassport(passport);

app.use(bodyParser.urlencoded({ extended: true }));
app.use(flash());
app.set('view engine', 'ejs');
app.use(express.static(__dirname + '/public'));
app.use(methodOverride('_method'));
app.use(
	session({
		secret: process.env.SESSION_SECRET || 'hunter2',
		resave: false,
		saveUninitialized: false,
	})
);

app.use(passport.initialize());
app.use(passport.session());

const config = {
	server: process.env.DB_SERVER || '',
	port: 1433,
	user: process.env.DB_USER || '',
	password: process.env.DB_PASSWORD || '',
	database: process.env.DB_PROD || '',
	options: {
		enableArithAbort: true,
		encrypt: false,
		useUTC: true,
	},
	pool: {
		max: 20,
		min: 0,
		idleTimeoutMillis: 15000,
	},
};

sql
	.connect(config)
	.then((pool) => {
		if (pool.connected) {
			console.log('Connecting to database: [OK]');
		}

		return pool;
	})
	.catch(function (err) {
		console.log('Connecting to database: [FAILED]');
		console.log(err);
	});

app.use(function (req, res, next) {
	// store current user
	res.locals.user = req.user;
	next();
});

app.use(baseRoutes);
app.use('/portal', portalRoutes);
app.use('/portal/logins', loginsRoutes);
app.use('/portal/announcements', announcementRoutes);
app.use('/portal/officers', officerRoutes);
app.use('/portal/newsletters', newsletterRoutes);

app.get('/*', function (req, res) {
	res.render('404');
});

const PORT = process.env.PORT || 8000;

app.listen(PORT, () =>
	console.log(`Server successfully started on port ${PORT}`)
);
