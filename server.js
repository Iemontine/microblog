"use strict";

const express = require('express');
const expressHandlebars = require('express-handlebars');
const session = require('express-session');

const webRoutes = require('./helpers/webRoutes');
const apiRoutes = require('./helpers/apiRoutes');
const fs = require('fs');

// TODO: fix styling

//~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~
// Configuration and Setup, Server Activation
//~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~

const app = express();
const PORT = 3000;

// TODO: new lines don't look so good rn, need to somehow replace with <br>

// Set up Handlebars view engine with Handlebar helpers, custom functions that can be used wit6hin the templates to perform specific tasks.
// They enhance the functionality of templates and help simplify data manipulation directly within the view files.
app.engine('handlebars', expressHandlebars.engine({
		helpers: {
			toLowerCase: (str) => str.toLowerCase(),
			// Converts a given string to lowercase. Usage example: {{toLowerCase 'SAMPLE STRING'}} -> 'sample string'
			ifCond: function (v1, v2, options) {
				if (v1 === v2) {
					return options.fn(this);
				}
				return options.inverse(this);
			},
			// Compares two values for equality and returns a block of content based on the comparison result.
			exists: function (filePath) {
				try {
					fs.accessSync(filePath);
					return true;
				} catch (error) {
					return false;
				}
			},
			// Checks if a file exists at the given path.
		},
	})
);

app.set('view engine', 'handlebars');
app.set('views', './views');

//~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~
// Middleware
//~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~

app.use(
	session({
		secret: 'oneringtorulethemall',	// Secret key to sign the session ID cookie
		resave: false,					// Don't save session if unmodified
		saveUninitialized: false,		// Don't create session until something stored
		cookie: { secure: false },		// Set to false for development w/o https
	})
);

// Application Constants
app.use((req, res, next) => {
	res.locals.appName = 'Joke of the Year';
	res.locals.copyrightYear = 2024;
	res.locals.postNeoType = 'Joke';
	res.locals.loggedIn = req.session.loggedIn || false;
	res.locals.userId = req.session.userId || '';
	next();
});

app.use(express.static('public'));					// Serve static files locally
app.use(express.urlencoded({ extended: true }));	// Parse URL-encoded bodies (as sent by HTML forms) 
app.use(express.json());							// Parse JSON bodies (as sent by API clients)
app.use('/', webRoutes);							// Use webRoutes for web routes
app.use('/', apiRoutes);							// Use apiRoutes for API routes

// Server activation
app.listen(PORT, () => {
	console.log(`Server is running on http://localhost:${PORT}`);
});

