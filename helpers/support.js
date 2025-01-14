"use strict";

const cvs = require('canvas');
const dotenv = require('dotenv').config();
const fs = require('fs');
const sqlite = require('sqlite');
const sqlite3 = require('sqlite3');
const crypto = require('crypto');

//~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~
// Support Functions
//~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~

let db;
(async () => {
	try {
		db = await sqlite.open({ filename: 'your_database_file.db', driver: sqlite3.Database });
		console.log("Opening DB");
		await createUserAvatars();

	} catch (error) {
		console.log("Error starting server:", error);
	}
})();

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
	let user = await db.get('SELECT * FROM users WHERE id = ?', [userId]);
	if (user) {
		return user;
	}
	return null;
}

// Function to find a user by user ID
async function findUserByGoogleId(userId) {
	let user = await db.get('SELECT * FROM users WHERE hashedGoogleId = ?', [userId]);
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
	return null;
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
async function registerUser(req, res, userinfo) {
	// Set username to either the user's input name or their Google name
	let username = req.session.registeringUser;
	let usernameTaken = await findUserByUsername(username);
	if (username === '') {
		res.redirect('/registerUsername?error=Input%20required');
		return false;
	} else if (usernameTaken) {
		res.redirect('/registerUsername?error=Username%20taken');
		return false;
	} else {
		let userId = await addUser(username, userinfo);
		// req.session.user = user;
		req.session.userId = userId;
		req.session.loggedIn = true;
		req.session.registeringUser = undefined;
		req.session.registeringUserinfo
		req.session.save((err) => {
			if (err) {
				console.error('Error saving session:', err);
				res.status(500).send('Internal Server Error');
			} else {
				res.redirect('/');
			}
		});
		return true;
	}
}

// Function to add a new user
async function addUser(username, userinfo) {
	let timeStamp = getNewTimeStamp();
	let user = {
		username: username,
		hashedGoogleId: crypto.createHash('sha256').update(userinfo.data.id).digest('hex'),
		email: userinfo.data.email,
		avatar_url: undefined,
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
async function loginUser(req, res, userinfo) {
	let hashedGoogleId = crypto.createHash('sha256').update(userinfo.data.id).digest('hex')
	let user = await findUserByGoogleId(hashedGoogleId);
	if (user) {
		// req.session.user = user;
		if (!user.avatar_url) {
			const url = '/avatars/' + username + '.png';
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
		if (!post) return res.status(404).json({ error: 'Post not found' });
		let currentUserId = req.session.userId;
		if (!currentUserId) return res.status(401).json({ error: 'User not logged in' });
		let like = await db.get('SELECT * FROM likes WHERE user_id = ? AND post_id = ?', [currentUserId, postId]);
		if (like) {
			await db.run('DELETE FROM likes WHERE user_id = ? AND post_id = ?', [currentUserId, postId]);
			await db.run('UPDATE posts SET likes = ? WHERE id = ?', [post.likes - 1, postId]);
		} else {
			await db.run('INSERT INTO likes (user_id, post_id, timestamp) VALUES (?, ?, ?)', [currentUserId, postId, getNewTimeStamp()]);
			await db.run('UPDATE posts SET likes = ? WHERE id = ?', [post.likes + 1, postId]);
		}
		post = await findPostById(postId);
		return res.json(post);
	} catch (error) {
		console.error(error);
		return res.status(500).send('Error');
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
	const username = req.session.registeringUser;
	const user = findUserByUsername(username);
	req.session.registeringUser = undefined; // Clear the registering user, now unnecessary
	if (!user.avatar_url) {
		const url = './public/avatars/' + username + '.png';
		await db.run('UPDATE users SET avatar_url = ? WHERE username = ?', [url, username]);
		await generateAvatar(username, url);
	}
}

// Function to generate an image avatar
async function generateAvatar(username, url, width = 100, height = 100) {
	const firstLetter = username.charAt(0).toUpperCase();
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
	context.fillText(firstLetter, width / 2, height / 2);
	const stream = canvas.createPNGStream();

	const out = fs.createWriteStream(url);
	// Save the image
	if (stream) {
		stream.pipe(out);
		url = url.replace('./public', '');
		await db.run('UPDATE users SET avatar_url = ? WHERE username = ?', [url, username]);
	}
}

// Function to get all posts, sorted by latest first
async function getPosts(sortBy = "timestamp", order = "DESC", tag = '') {
	let query = 'SELECT * FROM posts';
	const params = [];
	
	// Sort by multiple tags?
	if (tag !== '') {
		query += ' WHERE tag = ?';
		params.push(tag);
	}

	// Perform the sorted query
	query += ' ORDER BY ' + sortBy + ' ' + order;
	let posts = await db.all(query, params);
	return posts;
}

// Function to add a new post
async function addPost(title, content, user, tag, image = '') {
	if (image === '') {
		await db.run('INSERT INTO posts (title, content, tag, image_url, username, timestamp, likes) VALUES (?, ?, ?, ?, ?, ?, ?)', [title, content, tag, '', user.username, getNewTimeStamp(), 0]);
	}
	else {
		await db.run('INSERT INTO posts (title, content, tag, image_url, username, timestamp, likes) VALUES (?, ?, ?, ?, ?, ?, ?)', [title, content, tag, '/uploads/' + image, user.username, getNewTimeStamp(), 0])
	}
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
	await Promise.all(users.map(async user => {
		if (!user.avatar_url) {
			const url = './public/avatars/' + user.username + '.png';
			await generateAvatar(user.username, url);
		}
	}))
}

module.exports = {
	findUserByUsername,
	findUserByGoogleId,
	findUserById,
	findPostById,
	getCurrentUser,
	isAuthenticated,
	registerUser,
	addUser,
	handleAvatar,
	loginUser,
	logoutUser,
	renderProfile,
	getUserPosts,
	updatePostLikes,
	deletePost,
	generateAvatar,
	getPosts,
	addPost,
	getNewTimeStamp,
	createUserAvatars
}

console.log("Support functions loaded");