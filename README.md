# Design Images

## Web Design inspired by the Steam UI
<img src="https://github.com/user-attachments/assets/28762201-7946-4e40-b15a-b412b48e0d08" alt="Web Design inspired by Steam" width="1000">

## Sorting posts
<img src="https://github.com/user-attachments/assets/7b97a46e-086a-424b-9d8d-f8d4c39235b8" alt="Sorting posts" width="500">

## Google OAuth for User Sign-in and Authentication, registering user and default profile picture
<img src="https://github.com/user-attachments/assets/a9297f99-b957-418e-9348-e021afd98a83" alt="Google OAuth for User Sign-in and Authentication" width="500">
<img src="https://github.com/user-attachments/assets/1a69cbc5-485a-4dd8-9a86-3999be71fd93" alt="Set name page" width="500">

## Post view, creating a post supporting images, post tags, emojis, and final post added to feed
<img src="https://github.com/user-attachments/assets/adc0eaec-672c-4b04-b16a-2f6c8518883b" alt="Logged in view" width="500">
<img src="https://github.com/user-attachments/assets/834e709d-6d26-4b1d-9d2c-5bab8f3bbf93" alt="Creating a post" width="500">
<img src="https://github.com/user-attachments/assets/7fdf51b3-c16a-4783-bbf7-9faaccf1f7ee" alt="image" width="500">

## Profile Page, supporting ability to change name and profile picture
<img src="https://github.com/user-attachments/assets/01081715-b3a2-442c-83b2-f9781e767026" alt="Profile page" width="500">

# Project Setup

Initialize a new Node.js project and install Express:
```
npm init -y
npm install express
npm install express-handlebars
npm install express-session
npm install canvas
npm install dotenv
npm install googleapis
npm install sqlite
npm install sqlite3
npm install multer
```

Set environment variables in ``.env``:
```
EMOJI_API_KEY=(emoji-api key)
CLIENT_SECRET=(Google OAuth Secret)
CLIENT_ID=(Google OAuth Client ID).apps.googleusercontent.com
DATABASE_PATH=your_database_file.db
```

Initialize database:
```
node populatedb.js
```

Start server:
```
node server.js
```
