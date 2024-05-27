const sqlite = require('sqlite');
const sqlite3 = require('sqlite3');
const dotenv = require('dotenv').config();

dbFileName = process.env.DATABASE_PATH;

async function getPosts() {
  const db = await sqlite.open({ filename: dbFileName, driver: sqlite3.Database });
	// return posts.slice().reverse();
	const postsTableExists = await db.get(`SELECT name FROM sqlite_master WHERE type='table' AND name='posts';`);
    if (postsTableExists) {
        console.log('Posts table exists.');
        const posts = await db.all('SELECT * FROM posts');
        return posts;
    } else {
        console.log('Posts table does not exist.');
    }
}

let posts = getPosts();

console.log(posts);

