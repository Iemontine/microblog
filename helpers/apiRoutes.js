"use strict";

const express = require('express');
const { google } = require('googleapis');
const fetch = require('node-fetch');
const helper = require('./support');
const crypto = require('crypto');

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
	try {
		const { code } = req.query;
		const { tokens } = await client.getToken(code);
		client.setCredentials(tokens);
		const oauth2 = google.oauth2({
			auth: client,
			version: 'v2',
		});
		const userinfo = await oauth2.userinfo.get();

		req.session.registeringUserinfo = userinfo;
		const hashedGoogleId = crypto.createHash('sha256').update(userinfo.data.id).digest('hex');
		let existingUser = await helper.findUserByGoogleId(hashedGoogleId);

		if (!existingUser) {
			res.redirect('/registerUsername');
		} else {
			req.session.registeringUserinfo = undefined;
			req.session.registeringUser = undefined;
			try {
				// Login user
				helper.loginUser(req, res, userinfo)
			} catch (error) {
				console.error(error);
			}
		}
	} catch (error) {
		console.error(error);
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