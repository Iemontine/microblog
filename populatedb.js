// populatedb.js

const sqlite = require('sqlite');
const sqlite3 = require('sqlite3');

// Placeholder for the database file name
const dbFileName = 'your_database_file.db';

async function initializeDB() {
    const db = await sqlite.open({ filename: dbFileName, driver: sqlite3.Database });

    await db.exec(`
        CREATE TABLE IF NOT EXISTS users (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            username TEXT NOT NULL UNIQUE,
            hashedGoogleId TEXT NOT NULL UNIQUE,
            avatar_url TEXT,
            memberSince DATETIME NOT NULL
        );

        CREATE TABLE IF NOT EXISTS posts (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            title TEXT NOT NULL,
            content TEXT NOT NULL,
            image_url TEXT,
            username TEXT NOT NULL,
            timestamp DATETIME NOT NULL,
            likes INTEGER NOT NULL
        );

        CREATE TABLE IF NOT EXISTS likes (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            user_id INTEGER NOT NULL,
            post_id INTEGER NOT NULL,
            timestamp DATETIME NOT NULL,
            FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE,
            FOREIGN KEY (post_id) REFERENCES posts(id) ON DELETE CASCADE
        );
    `);

    // Sample data - Replace these arrays with your own data
    const users = [
        { username: 'user1', hashedGoogleId: 'hashedGoogleId1', avatar_url: '', memberSince: '2024-01-01 12:00:00' },
        { username: 'user2', hashedGoogleId: 'hashedGoogleId2', avatar_url: '', memberSince: '2024-01-02 12:00:00' }
    ];

    const posts = [
        { title: 'First Post', content: 'This is the first post', image_url:'', username: 'user1', timestamp: '2024-01-01 12:30:00', likes: 0 },
        { title: 'Second Post', content: 'This is the second post', image_url: '', username: 'user2', timestamp: '2024-01-02 12:30:00', likes: 0 }
    ];

    // Insert sample data into the database
    await Promise.all(users.map(user => {
        return db.run(
            'INSERT INTO users (username, hashedGoogleId, avatar_url, memberSince) VALUES (?, ?, ?, ?)',
            [user.username, user.hashedGoogleId, user.avatar_url, user.memberSince]
        );
    }));

    await Promise.all(posts.map(post => {
        return db.run(
            'INSERT INTO posts (title, content, image_url, username, timestamp, likes) VALUES (?, ?, ?, ?, ?, ?)',
            [post.title, post.content, post.image_url, post.username, post.timestamp, post.likes]
        );
    }));

    console.log('Database populated with initial data.');
    await db.close();
}

initializeDB().catch(err => {
    console.error('Error initializing database:', err);
});