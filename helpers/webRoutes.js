"use strict";

const express = require('express');
const helper = require('./support');
const multer = require('multer');
const path = require('path');
const storage = multer.diskStorage({
	destination: function (req, file, cb) {
		cb(null, './public/uploads/'); // Destination folder for uploaded files
	},
	filename: function (req, file, cb) {
		cb(null, file.fieldname + '-' + Date.now() + path.extname(file.originalname));
	}
});
// TODO: Allow videos to be uploaded somehow
const upload = multer({ storage: storage });

const router = express.Router();

//~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~
// Routes
//~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~

// Home route: render home view with posts and user
router.get('/', async (req, res) => {
	// Pass the posts and user variables into the home template
	const sortBy = req.query.sortBy || 'timestamp';
	const order = req.query.order || 'DESC';
	const tag = req.query.tag || '';
	const posts = await helper.getPosts(sortBy, order, tag);
	const user = await helper.getCurrentUser(req) || {};
	let tags = ['Dad Joke', 'Dark Humor', 'Ironic', 'One-liner', 'Self-deprecating', 'Computer Science', 'Meta Humor'];
	res.render('home', { posts, user, sortBy, order, tag, tags });
});

// Register Username route where the user can enter a desired username.
router.get('/registerUsername', (req, res) => {
	res.render('registerUsername', { usernameError: req.query.error });
});

// Login route GET route is used for error response from login
router.get('/login', (req, res) => {
	res.render('loginRegister', { loginError: req.query.error });
});

router.get('/home', async (req, res) => {
	const posts = await helper.getPosts();
	const user = await helper.getCurrentUser(req) || {};
	res.render('home', { posts, user, titleError: req.query.error, content: req.query.content });
});

// Error route: render error page
router.get('/error', (req, res) => {
	res.render('error');
});

// Profile route: render user profile
router.get('/profile', helper.isAuthenticated, (req, res) => {
	helper.renderProfile(req, res);
});

// Avatar route: serve user avatar
router.get('/avatar/:username', (req, res) => {
	// unused
});

// Post route: add a new post
router.post('/posts', upload.single('file'), async (req, res) => {
	try {
		let title = req.body.title;
		let content = req.body.content;
		let file = req.file ? req.file.filename : '';	// If no file given, set to empty string
		let tag = req.body.tag;
		let user = await helper.findUserById(req.session.userId); 	// suspicious, may need to use googleid?
		if (title === '') {
			res.redirect(`/home?error=Title%20required&content=${content}`);
		}
		else if (file === '') {
			helper.addPost(title, content, user, tag);
			res.redirect('/');
		}
		else {
			helper.addPost(title, content, user, tag, file);
			res.redirect('/');
		}
	} catch (error) {
		console.error(error);
	}
});

// Like route: update post likes
router.post('/like/:id', async (req, res) => {
	try {
		await helper.updatePostLikes(req, res);
	} catch (error) {
		console.error(error);
		res.send(500);
	}
});

// Register route: get the registering user's desired username
router.post('/registerUsername', async (req, res) => {
	try {
		req.session.registeringUser = req.body.username;
		let userinfo = req.session.registeringUserinfo;
		try {
			// Register user, if successful generate avatar
			if (helper.registerUser(req, res, userinfo)) {
				await helper.handleAvatar(req, res);
			}
		} catch (error) {
			console.error(error);
		}
	} catch (error) {
		console.error(error);
	}
});


// Login route: login a user
router.post('/login', (req, res) => {
	try {
		req.session.loggingIn = true;
		res.redirect('/auth/google');
	} catch (error) {
		console.error(error);
	}
});

// Logout route: log out a user
router.get('/logout', (req, res) => {
	helper.logoutUser(req, res);
});

// Delete route: delete a post
router.post('/delete/:id', helper.isAuthenticated, (req, res) => {
	try {
		helper.deletePost(req, res);
	} catch (error) {
		console.log(error);
	}
});

module.exports = router;