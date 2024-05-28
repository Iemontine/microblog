"use strict";

const express = require('express');
const expressHandlebars = require('express-handlebars');
const session = require('express-session');
const cvs = require('canvas');
const dotenv = require('dotenv').config();
const fs = require('fs');
const sqlite = require('sqlite');
const sqlite3 = require('sqlite3');
const { userInfo } = require('os');
//~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~
// Configuration and Setup
//~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~

const app = express();
const PORT = 3000;
let db;
(async () => {
	db = await sqlite.open({ filename: 'your_database_file.db', driver: sqlite3.Database });
	console.log("Opening DB");
	createUserAvatars();

})(); 
/*
~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~
	Handlebars Helpers

	Handlebars helpers are custom functions that can be used within the
	templates to perform specific tasks. They enhance the functionality of
	templates and help simplify data manipulation directly within the view files.

	In this project, two helpers are provided:
	
	1. toLowerCase:
	   - Converts a given string to lowercase.
	   - Usage example: {{toLowerCase 'SAMPLE STRING'}} -> 'sample string'

	2. ifCond:
		- Compares two values for equality and returns a block of content based on 
		 the comparison result.
		- Usage example: 
			{{#ifCond value1 value2}}
				<!-- Content if value1 equals value2 -->
			{{else}}
				<!-- Content if value1 does not equal value2 -->
			{{/ifCond}}
~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~
*/

// Set up Handlebars view engine with custom helpers
app.engine(
	'handlebars',
	expressHandlebars.engine({
		helpers: {
			toLowerCase: function (str) {
				return str.toLowerCase();
			},
			ifCond: function (v1, v2, options) {
				if (v1 === v2) {
					return options.fn(this);
				}
				return options.inverse(this);
			},
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

// Serve static files locally
app.use(express.static('public'));
// Parse URL-encoded bodies (as sent by HTML forms) 
app.use(express.urlencoded({ extended: true }));
// Parse JSON bodies (as sent by API clients)
app.use(express.json());

//~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~
// Routes
//~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~

// Home route: render home view with posts and user
app.get('/', async (req, res) => {
	// Pass the posts and user variables into the home template
	const posts = await getPosts();
	const user = await getCurrentUser(req) || {};
	res.render('home', { posts, user });
});


		
// Register GET route is used for error response from registration
app.get('/register', (req, res) => {
	res.render('loginRegister', { regError: req.query.error });
});

// Login route GET route is used for error response from login
app.get('/login', (req, res) => {
	res.render('loginRegister', { loginError: req.query.error });
});

app.get('/home', async (req, res) => {
	const posts = await getPosts();
	const user = await getCurrentUser(req) || {};
	res.render('home', { posts, user, titleError: req.query.error, content: req.query.content });
});

// Error route: render error page
app.get('/error', (req, res) => {
	res.render('error');
});

// Profile route: render user profile
app.get('/profile', isAuthenticated, (req, res) => {
	renderProfile(req, res);
});

// Avatar route: serve user avatar
app.get('/avatar/:username', (req, res) => {
	// unused
});

// Post route: add a new post
app.post('/posts', async (req, res) => {
	try {
		let title = req.body.title;
		let content = req.body.content;
		let user = await findUserById(req.session.userId);
		if (title === '') {
			res.redirect(`/home?error=Title%20required&content=${content}`);
		} else {
			await addPost(title, content, user);
			res.redirect('/');
		}
	} catch (error) {
		console.error(error);
	}
});

// Like route: update post likes
app.post('/like/:id', (req, res) => {
	try {
		updatePostLikes(req, res);
		res.sendStatus(200);
	} catch (error) {
		console.error(error);
		res.send(500);
	}
});

// Register route: register a new user
app.post('/register', (req, res) => {
	try {
		registerUser(req, res);
	} catch (error) {
		console.error(error);
	}
});

// Login route: login a user
app.post('/login', (req, res) => {
	try {
		loginUser(req, res);
			
	} catch (error) {
		console.error(error);
	}
});

// Logout route: log out a user
app.get('/logout', (req, res) => {
	logoutUser(req, res);
});

// Delete route: delete a post
app.post('/delete/:id', isAuthenticated, (req, res) => {
	try {
		deletePost(req, res);
	} catch (error) {
		console.log(error);
	}
});

// Emoji route: return all emojis
app.get('/emoji', async (req, res) => {
	try {
		const apiKey = process.env.EMOJI_API_KEY;
		const url = `https://emoji-api.com/emojis?access_key=${apiKey}`;

		const response = await fetch(url);
		const emojis = await response.json();

		res.send(emojis);
	} catch (error) {
		console.error(`Got error: ${error.message}`);
		res.sendStatus(500);
	}
});

//~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~
// Server Activation
//~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~

app.listen(PORT, () => {
	console.log(`Server is running on http://localhost:${PORT}`);
});

//~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~
// Support Functions and Variables
//~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~

// Emulate pre-existing data
// TODO: new lines don't look so good rn, need to somehow replace with <br>
// let posts = [];
// let users = [
// 	{ id: 1, username: 'Ellen958', avatar_url: generateAvatar('E', './public/images/Ellen958.png'), memberSince: '1958-01-26 12:00' },
// 	{ id: 2, username: 'CourseAssist.ai', avatar_url: generateAvatar('C', './public/images/CourseAssist.ai.png'), memberSince: '2024-05-20 13:37' },
// ];
// addPost('Why did the scarecrow get a promotion?', 'Because it was outstanding in its field!!!!', findUserById(1))
// addPost('Why do APIs always carry umbrellas?', 'Because they can’t handle a downpour of requests!', findUserById(2))


// Function to find a user by username
async function findUserByUsername(username) {
	let user = db.get('SELECT * FROM users WHERE username = ?', [username]);
	if (user) {
		return user;
	}
	return null;
}

// Function to find a user by user ID
async function findUserById(userId) {
	let user = db.get('SELECT * FROM users WHERE id = ?', [userId]);
	if (user) {
		return user;
	}
	return null;
}

// Function to find a post by post ID
async function findPostById(postId) {
	let post = db.get('SELECT * FROM posts WHERE id = ?', [postId]);
	if (post) {
		return post;
	}
	return undefined;
}

// Function to get the current user from session
async function getCurrentUser(req) {
	let user = await findUserById(req.session.userId);
	if (user) {
		return user;
	}
	return null;
}


// Middleware to check if user is authenticated
function isAuthenticated(req, res, next) {
	console.log(req.session.userId);
	if (req.session.userId) {
		next();
	} else {
		res.redirect('/login');
	}
}

// Function to register a user
async function registerUser(req, res) {
	let username = req.body.username;
	
	let existingUser = await findUserByUsername(username);
	if (username === '') {
		res.redirect('/register?error=Input%20required');
	} else if (existingUser) {
		res.redirect('/register?error=User%20already%20exists');
	} else {
		let userId = await addUser(username);
		// req.session.user = user;
		const url = './public/images/' + username + '.png';
		await generateAvatar(username, url);
		req.session.userId = userId;
		req.session.loggedIn = true;
		req.session.save((err) => {
			if (err) {
				console.error('Error saving session:', err);
				res.status(500).send('Internal Server Error');
			} else {
				res.redirect('/');
			}
		});
	}
}

// Function to add a new user
async function addUser(username) {
	// TODO: Create a new user object and add to users array
	let timeStamp = getNewTimeStamp();
	let user = {
		username: username,
		hashedGoogleId: "BLAH",
		memberSince: timeStamp,
	}
	await db.run(
		'INSERT INTO users (username, hashedGoogleId, avatar_url, memberSince) VALUES (?, ?, ?, ?)',
		[user.username, user.hashedGoogleId, '', user.memberSince], (err) => {
			if (err) {
				console.error(err.message);
			} else {
				console.log("User added!");
			}
		});
	let id = await db.get('SELECT id FROM users WHERE username = ?', [username], (error) => {
		if (error) {
			console.error(error);
		} else {
			console.log("Got ID!");
		}
	});
	return id.id;
}

// Function to login a user
async function loginUser(req, res) {
	let username = req.body.username;
	let user = await findUserByUsername(username);
	console.log(user);
	if (username === '') {
		res.redirect('/login?error=Input%20required');
	} else if (user) {
		// req.session.user = user;
		if (!user.avatar_url) {
			const url = './public/images/' + username + '.png';
			await generateAvatar(username, url);
		}	
		req.session.userId = user.id;
		req.session.loggedIn = true;
		req.session.save((err) => {
			if (err) {
				console.error('Error saving session:', err);
				res.status(500).send('Internal Server Error');
			} else {
				res.redirect('/');
			}
		})
		return true;
	} else {
		res.redirect('/login?error=User%20not%20found');
		return false;
	}
}

// Function to logout a user
function logoutUser(req, res) {
	req.session.destroy();
	res.redirect('/');
}

// Function to render the profile page
async function renderProfile(req, res) {
	let userId = req.session.userId;
	const user = await findUserById(userId);
	let posts = await getUserPosts(user);
	res.render('profile', {user, posts});
}

async function getUserPosts(user) {
	let posts = await db.all('SELECT * FROM posts WHERE username = ?', [user.username]);
	return posts;
}

// Function to update post likes
async function updatePostLikes(req, res) {
	try {
		const postId = parseInt(req.params.id);
		let post = await findPostById(postId);
		let currentUserId = req.session.userId;
		let like = await db.get('SELECT * FROM likes WHERE user_id = ? AND post_id = ?', [currentUserId, postId]);
		if (like) {
			await db.run('DELETE FROM likes WHERE user_id = ? AND post_id = ?', 
			[currentUserId, postId]);
			await db.run('UPDATE posts SET likes = ? WHERE id = ?',[post.likes - 1, postId]);
		} else {
			await db.run('INSERT INTO likes (user_id, post_id, timestamp) VALUES (?, ?, ?)', 
			[currentUserId, postId, getNewTimeStamp()]);
			await db.run('UPDATE posts SET likes = ? WHERE id = ?',[post.likes + 1, postId]);
		}
	} catch (error) {
		console.error(error);
	}
}

// Function to delete post
async function deletePost(req, res) {
	try {
		const postId = parseInt(req.params.id);
		await db.run('DELETE FROM posts WHERE id = ?', [postId]);
		res.sendStatus(200);
	} catch (error) {
		console.error(error);
	}
}

// Function to handle avatar generation and serving
async function handleAvatar(req, res) {
	const username = req.body.username;
	const user = await findUserByUsername(username);
	if (!user.avatar_url) {
		const url = './public/images/' + username + '.png';
		generateAvatar(username, url);
		url = '/images/' + username + '.png';
		await db.run('UPDATE users SET avatar_url = ? WHERE username = ?', [url, username]);
	}
}

// Function to generate an image avatar
async function generateAvatar(username, url, width = 100, height = 100) {
	const letter = username.charAt(0).toUpperCase();

	const canvas = cvs.createCanvas(width, height);
	const context = canvas.getContext('2d');

	// Fill background with random color
	context.fillStyle = '#' + Math.floor(Math.random() * 16777215).toString(16);
	context.fillRect(0, 0, width, height);

	// Draw the letter
	context.fillStyle = '#FFFFFF'; // White color for text
	context.font = '70px Arial';
	context.textAlign = 'center';
	context.textBaseline = 'middle';

	// Draw the letter
	context.fillText(letter, width / 2, height / 2);	
	const stream = canvas.createPNGStream();
	
	const out = fs.createWriteStream(url);
	// Save the image
	if (stream) {
		stream.pipe(out);
		url = '/images/' + username + '.png';
		await db.run('UPDATE users SET avatar_url = ? WHERE username = ?', [url, username]);

		return url.replace('./public', '');
	}
	return undefined;
}

// Function to get all posts, sorted by latest first
async function getPosts() {
	let posts = await db.all('SELECT * FROM posts');
	return posts;
}

// Function to add a new post
async function addPost(title, content, user) {
	await db.run('INSERT INTO posts (title, content, username, timestamp, likes) VALUES (?, ?, ?, ?, ?)', [title, content, user.username, getNewTimeStamp(), 0])
}

// Creates new time in the format provided
function getNewTimeStamp() {
	let date = new Date();
	const year = date.getFullYear();
	const month = date.getMonth();
	const day = date.getDay();
	const hour = date.getHours();
	const minute = date.getMinutes();
	let timeStamp = year + '-' + month + '-' + day + ' ' + hour + ':' + minute;
	return timeStamp;
}

async function createUserAvatars() {
	const users = await db.all('SELECT * FROM users');
	await Promise.all(users.map(user => {
		if (!user.avatar_url) {
			const url = './public/images/' + user.username + '.png';
			generateAvatar(user.username, url);
		}
	}))
}