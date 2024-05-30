"use strict";

const express = require('express');
const { google } = require('googleapis');
const fetch = require('node-fetch');
const helper = require('./support');

const router = express.Router();
const { OAuth2Client } = require('google-auth-library');
const CLIENT_ID = process.env.CLIENT_ID;
const CLIENT_SECRET = process.env.CLIENT_SECRET;
const REDIRECT_URI = 'http://localhost:3000/auth/google/callback';
const client = new OAuth2Client(CLIENT_ID, CLIENT_SECRET, REDIRECT_URI);
const EMOJI_API_KEY = process.env.EMOJI_API_KEY;

//~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~
// API Routes
// ~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~

// Google OAuth route: redirect to Google OAuth consent screen
router.get('/auth/google/', (req, res) => {
	try {
		const url = client.generateAuthUrl({
			access_type: 'offline',
			scope: ['https://www.googleapis.com/auth/userinfo.email',
				'https://www.googleapis.com/auth/userinfo.profile'],
		});
		res.redirect(url);
	} catch (error) {
		console.error(error);
	}
});

// Handle Google OAuth response
router.get('/auth/google/callback', async (req, res) => {
	const { code } = req.query;
	const { tokens } = await client.getToken(code);
	client.setCredentials(tokens);
	const oauth2 = google.oauth2({
		auth: client,
		version: 'v2',
	});
	const userinfo = await oauth2.userinfo.get();

	// Check if user is registering or logging in
	if (req.session.registering) {
		req.session.registering = false;
		try {
			// Register user, if successful generate avatar
			if (helper.registerUser(req, res, userinfo)) {
				await helper.handleAvatar(req, res);
			}
		} catch (error) {
			console.error(error);
		}
	}
	else if (req.session.loggingIn) {
		req.session.loggingIn = false;
		try {
			// Login user
			helper.loginUser(req, res, userinfo)
		} catch (error) {
			console.error(error);
		}
	}
});

// Emoji route: return all emojis
router.get('/emoji', async (req, res) => {
	try {
		const url = `https://emoji-api.com/emojis?access_key=${EMOJI_API_KEY}`;
		const response = await fetch(url);
		const emojis = await response.json();

		res.send(emojis);
	} catch (error) {
		console.error(`Got error: ${error.message}`);
		res.sendStatus(500);
	}
});

module.exports = router;