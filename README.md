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

Set environment variables in .env:
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
