const express = require('express');
const expressHandlebars = require('express-handlebars');
const session = require('express-session');
const cvs = require('canvas');
const emoji = require('emoji.json');
const fs = require('fs');
//~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~
// Configuration and Setup
//~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~

const app = express();
const PORT = 3000;

/*
~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~
	Handlebars Helpers

	Handlebars helpers are custom functions that can be used within the templates 
	to perform specific tasks. They enhance the functionality of templates and 
	help simplify data manipulation directly within the view files.

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
~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~
*/

// Set up Handlebars view engine with custom helpers
//
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

//~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~
// Middleware
//~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~

app.use(
	session({
		secret: 'oneringtorulethemall',     // Secret key to sign the session ID cookie
		resave: false,                      // Don't save session if unmodified
		saveUninitialized: false,           // Don't create session until something stored
		cookie: { secure: false },          // True if using https. Set to false for development without https
	})
);

// Replace any of these variables below with constants for your application. These variables
// should be used in your template files. 
// 
app.use((req, res, next) => {
	res.locals.appName = 'MicroBlog';
	res.locals.copyrightYear = 2024;
	res.locals.postNeoType = 'Post';
	res.locals.loggedIn = req.session.loggedIn || false;
	res.locals.userId = req.session.userId || '';
	next();
});

app.use(express.static('public'));                  // Serve static files
app.use(express.urlencoded({ extended: true }));    // Parse URL-encoded bodies (as sent by HTML forms)
app.use(express.json());                            // Parse JSON bodies (as sent by API clients)

//~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~
// Routes
//~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~

// Home route: render home view with posts and user
// We pass the posts and user variables into the home
// template
//
app.get('/', (req, res) => {
	const posts = getPosts();
	const user = getCurrentUser(req) || {};
	res.render('home', { posts, user});
});

// Register GET route is used for error response from registration
//
app.get('/register', (req, res) => {
	res.render('loginRegister', { regError: req.query.error });
});

// Login route GET route is used for error response from login
//
app.get('/login', (req, res) => {
	res.render('loginRegister', { loginError: req.query.error });
});

// Error route: render error page
//
app.get('/error', (req, res) => {
	res.render('error');
});

// Additional routes that you must implement


app.get('/post/:id', (req, res) => {
	// TODO: Render post detail page
});
app.post('/posts', (req, res) => {
	// TODO: Add a new post and redirect to home
	try {
		let title = req.body.title;
		let content = req.body.content;
		let user = users.find(u => u.id === req.session.userId);
		addPost(title, content, user);
		res.redirect('/');
	} catch (error) {
		console.error(error);
	}
});
app.post('/like/:id', (req, res) => {
	// TODO: Update post likes
	try {
		updatePostLikes(req,res);
		res.sendStatus(200);
	} catch (error) {
		console.error(error);
		res.send(500);
	}
	
});
app.get('/profile', isAuthenticated, (req, res) => {
	// TODO: Render profile page
	renderProfile(req, res);
});
app.get('/avatar/:username', (req, res) => {
	// TODO: Serve the avatar image for the user
	handleAvatar(req, res);
});
app.post('/register', (req, res) => {
	// TODO: Register a new user
	try {
		registerUser(req, res);
		handleAvatar(req, res);
	} catch (error) {
		console.error(error);
	}
});
app.post('/login', (req, res) => {
	// TODO: Login a user
	try {
		loginUser(req, res);
		handleAvatar(req,res);
	} catch (error) {
		console.error(error);
	}
});
app.get('/logout', (req, res) => {
	// TODO: Logout the user
	logoutUser(req, res);
});
app.post('/delete/:id', isAuthenticated, (req, res) => {
	// TODO: Delete a post if the current user is the owner
	try {
		deletePost(req, res);
	} catch (error) {
		console.log(error);
	}
});
app.get('/emoji', (req, res) => {
	res.json(emoji);
});
//~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~
// Server Activation
//~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~

app.listen(PORT, () => {
	console.log(`Server is running on http://localhost:${PORT}`);
});

//~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~
// Support Functions and Variables
//~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~

// Example data for posts and users
let posts = [];

let users = [
	{ id: 1, username: 'SampleUser', avatar_url: undefined, memberSince: '2024-01-01 08:00' },
	{ id: 2, username: 'AnotherUser', avatar_url: undefined, memberSince: '2024-01-02 09:00' },
];

// Function to find a user by username
function findUserByUsername(username) {
	// TODO: Return user object if found, otherwise return undefined
	let user = users.find(user => user.username === username);
	if (user) {
		return user;
	}
	return null;
}

// Function to find a user by user ID
function findUserById(userId) {
	// TODO: Return user object if found, otherwise return undefined
	let user = users.find(user => user.id === userId);
	if (user) {
		return user;
	}
	return null;
}

// Function to add a new user
function addUser(username) {
	// TODO: Create a new user object and add to users array
	let timeStamp = getNewTimeStamp();
	let user = {
		id: users.length + 1,
		username: username,
		avatar_url: undefined,
		memberSince: timeStamp,
	}
	users.push(user);
	return user;
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
function registerUser(req, res) {
	// TODO: Register a new user and redirect appropriately
	let userName = req.body.userName;
	let user = addUser(userName);	
	// req.session.user = user;
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
}

// Function to login a user
function loginUser(req, res) {
	// TODO: Login a user and redirect appropriately
	let userName = req.body.userName;
		let user = findUserByUsername(userName);
		if (user) {
			// req.session.user = user;
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
		} else {
			res.send('Could not find user');
		}
}

// Function to logout a user
function logoutUser(req, res) {
	// TODO: Destroy session and redirect appropriately
	req.session.destroy();
	res.redirect('/');
}

// Function to render the profile page
function renderProfile(req, res) {
	// TODO: Fetch user posts and render the profile page
	let userId = req.session.userId;
	const user = users.find(user => user.id === userId);

	res.render('profile', {user});
}

// Function to update post likes
function updatePostLikes(req, res) {
	// TODO: Increment post likes if conditions are met
	try {
		const postId = parseInt(req.params.id);
		let post = posts.find(post => post.id === postId);
		let userId = req.session.userId;
		let currentUser = users.find(user => user.id === userId);
		if (!('postsLikedId' in currentUser)) {
			currentUser.postsLikedId = [];
		}
		let index = currentUser.postsLikedId.indexOf(postId);
		if (index !== -1) {
			currentUser.postsLikedId.splice(index, 1);
			post.likes--;
		} else {
			currentUser.postsLikedId.push(postId);
			post.likes++;
		}
	} catch (error) {
		console.error(error);
	}
}

// Function to delete post
function deletePost(req, res) {
	try {
		const postId = parseInt(req.params.id);
		let post = posts.find(post => post.id === postId);
		let userId = req.session.userId;
		let user = users.find(user => user.id === userId);
		let userIndex = user.posts.indexOf(post);
		let postsIndex = posts.indexOf(post);
		if (postsIndex !== -1 && userIndex !== -1) {	// TODO: CONTINUE HERE
			posts.splice(postsIndex, 1);
			user.posts.splice(userIndex, 1);
			res.sendStatus(200);
		} else {
			throw new Error("post does not exist");
		}
	} catch (error) {
		console.error(error);
	}
}

function randomColor() {
  return '#' + Math.floor(Math.random()*16777215).toString(16);
}

// Function to handle avatar generation and serving
function handleAvatar(req, res) {
	// TODO: Generate and serve the user's avatar image
	const username = req.body.userName;
	const user = users.find(user => user.username === username);
	if (!user.avatar_url) {
		const width = 100;
		const height = 100;
	
		const canvas = cvs.createCanvas(width, height);
		const context = canvas.getContext('2d');
	
		// Draw a red rectangle
		context.fillStyle = randomColor();
		context.fillRect(0, 0, 100, 100);
	
		context.fillStyle = '#FFFFFF'; // White color for text
    context.font = '70px Arial';
    context.textAlign = 'center';
    context.textBaseline = 'middle';

    // Get the first letter of the username
    const firstLetter = username.charAt(0).toUpperCase();

    // Draw the letter
    context.fillText(firstLetter, width / 2, height / 2);
		// Save the canvas as an image
		const url = './public/images/' + username + '.png';
		const out = fs.createWriteStream(url);
		const stream = canvas.createPNGStream();
		stream.pipe(out);
		out.on('finish', () => console.log('The image was created.'));
		user.avatar_url = 'images/' + username + '.png';
	}
}

// Function to get the current user from session
function getCurrentUser(req) {
	// TODO: Return the user object if the session user ID matches
	let user = users.find(user => user.id === req.session.userId);
	if (user) {
		return user;
	} 
	return null;
}

// Function to get all posts, sorted by latest first
function getPosts() {
	return posts.slice().reverse();
}

// Function to add a new post
function addPost(title, content, user) {
	// TODO: Create a new post object and add to posts array
	let post = {
		id: posts.length,
		title: title,
		content: content,
		username: user.username,
		timestamp: getNewTimeStamp(),
		likes: 0,
		avatar_url: user.avatar_url,
	}
	if (!('posts' in user)) {
		user.posts = [];
	}
	user.posts.push(post);
	posts.push(post);
}

// Function to generate an image avatar
function generateAvatar(letter, width = 100, height = 100) {
	// TODO: Generate an avatar image with a letter
	// Steps:
	// 1. Choose a color scheme based on the letter
	// 2. Create a canvas with the specified width and height
	// 3. Draw the background color
	// 4. Draw the letter in the center
	// 5. Return the avatar as a PNG buffer
}

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