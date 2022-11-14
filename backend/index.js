import express from 'express';
import cors from 'cors';
import path from 'path';
import mysql from 'mysql2/promise'
import bcrypt from 'bcrypt';
import session from 'express-session';
import MySQLStore from 'express-mysql-session';
import { fileURLToPath } from 'url';
import * as dotenv from 'dotenv';

// Setup dotenv (enviorement variables)
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
dotenv.config({ path: path.join(__dirname, `.env.${process.env.NODE_ENV}`) });

const app = express();

// Database setup

var databaseConnectionOptions = {
    host: process.env.MYSQL_HOSTNAME,
    port: process.env.MYSQL_PORT,
    user: process.env.MYSQL_USER,
    password: process.env.MYSQL_PASSWORD,
    database: process.env.MYSQL_DATABASE,
};

var dbConnection = await mysql.createConnection(databaseConnectionOptions);

// Session setup

var sessionStore = new (MySQLStore(session))({},dbConnection);

var sessionConfig = {
    key: 'login_session',
    secret: process.env.SESSION_SECRET,
    store: sessionStore,
    resave: false,
    saveUninitialized: false,
    cookie: {}
};

app.use(session(sessionConfig));

// Middlewares

app.use(cors({
    optionsSuccessStatus: 200,
    origin: process.env.FRONTEND_ADDRESS,
    credentials: true,
}));

app.use(express.json());


// Routes

app.post('/signup', async (req, res) => {
    let userInfo = req.body;

    Object.keys(userInfo).forEach(key => {
        if (userInfo[key].length == 0) userInfo[key] = null;
    });

    if ((Buffer.byteLength(userInfo.password, 'utf16')) > 72) {
        return res.status(400).json({ msg: "Password Too Long" });
    }

    switch (userInfo.type) {
        case "teacher":
            userInfo.type = 1;
            break;
        case "student":
            userInfo.type = 2;
            break;
        case "guardian":
            userInfo.type = 3;
            break;
        default:
            return res.status(400).json({ msg: "wrong user type" });
    }

    await bcrypt.hash(userInfo.password, 10).then(function (hash) {
        userInfo.password = hash;
    }).catch(function (err) {
        return res.status(400).json({ msg: "hashing error" });
    });

    try {
        const [row, fields] = await dbConnection.execute(
            'INSERT INTO user (user_type_id, name, surname, email, password, birth_date, school, grade_branch) VALUES (?,?,?,?,?,?,?,?)',
            [userInfo.type, userInfo.name, userInfo.surname, userInfo.email, userInfo.password, userInfo.birthDate, userInfo.school, userInfo.gradeBranch]
        );
    } catch (error) {
        return res.status(400).json({ msg: error.code });
    }

    res.status(200).json({ msg: "user is created" });
});

app.post('/login', async (req, res) => {

    // Checking credentials

    try {
        const [row, fields] = await dbConnection.execute(
            'SELECT password FROM user WHERE email = ?',
            [req.body.email]
        );

        if (row.length == 0) return res.status(400).json({ msg: "INVALID_CREDENTIALS" });

        const match = await bcrypt.compare(req.body.password, row[0].password);
        if (!match) {
            return res.status(400).json({ msg: "INVALID_CREDENTIALS" })
        }

    } catch (error) {
        return res.status(400).json({ msg: "INVALID_CREDENTIALS" });
    }

    // Setting cookie
    
    req.session.testSessionData = "My test session data";
    res.status(200).send(JSON.stringify({ msg: "" }));
});

app.get('/testFetch', async (req, res) => {
    console.log(req.session.testSessionData);
    return res.json({ data: 'data from backend' });
});

app.listen(process.env.PORT);