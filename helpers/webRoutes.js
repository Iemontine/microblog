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
	const posts = await helper.getPosts();
	const user = await helper.getCurrentUser(req) || {};
	res.render('home', { posts, user });
});

// Register GET route is used for error response from registration
router.get('/register', (req, res) => {
	res.render('loginRegister', { regError: req.query.error });
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
		if (content === '' && title === '') {
			res.redirect(`/home?error=Title%20and%20Content%20required`);
		}
		else if (content === '') {
			res.redirect(`/home?error=Content%20required&title=${title}`);
		}
		else if (title === '') {
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

// Register route: register a new user
router.post('/register', (req, res) => {
	try {
		req.session.registeringUser = req.body.username;
		req.session.registering = true;
		res.redirect('/auth/google');
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