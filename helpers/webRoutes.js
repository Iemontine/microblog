const express = require('express');
const helper = require('./support');

const multer = require('multer');
const storage = multer.diskStorage({
	destination: (req, file, cb) => {
		cb(null, './public/uploads/')
	},
	filename: (req, file, cb) => {
		cb(null, Date.now() + path.extname(file.originalname))
	}
});
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
	renderProfile(req, res);
});

// Avatar route: serve user avatar
router.get('/avatar/:username', (req, res) => {
	// unused
});

// Post route: add a new post
router.post('/posts', upload.single('image'), async (req, res) => {
	try {
		let title = req.body.title;
		let content = req.body.content;
		let image = req.file.filename || '';
		let user = findUserById(req.session.userId);
		if (content === '' && title === '') {
			res.redirect(`/home?error=Title%20and%20Content%20required`);
		}
		else if (content === '') {
			res.redirect(`/home?error=Content%20required&title=${title}`);
		}
		else if (title === '') {
			res.redirect(`/home?error=Title%20required&content=${content}`);
		}
		else {
			addPost(title, content, user, image);
			res.redirect('/');
		}
	} catch (error) {
		console.error(error);
	}
});

// Like route: update post likes
router.post('/like/:id', (req, res) => {
	try {
		updatePostLikes(req, res);
		res.sendStatus(200);
	} catch (error) {
		console.error(error);
		res.send(500);
	}
});

// Register route: register a new user
router.post('/register', (req, res) => {
	try {
		req.session.registeringUser = req.body.userName;
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
	logoutUser(req, res);
});

// Delete route: delete a post
router.post('/delete/:id', helper.isAuthenticated, (req, res) => {
	try {
		deletePost(req, res);
	} catch (error) {
		console.log(error);
	}
});

module.exports = router;