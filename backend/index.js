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

var sessionStore = new (MySQLStore(session))({}, dbConnection);

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

// Functions

function setReqCookie(req, user_id, user_type) {
    req.session.user_id = user_id;
    req.session.user_type = user_type;
}

// Database Functions

async function getUserByEmail(email) {
    const [row, fields] = await dbConnection.execute(
        'SELECT user.user_id, user.password, user_type.name FROM user INNER JOIN user_type ON user.user_type_id=user_type.user_type_id WHERE email = ?',
        [email]
    );

    return row;
}

async function dismissNotification(user_id, notification_id) {
    try {
        const [row, fields] = await dbConnection.execute(
            'DELETE FROM notification WHERE user_id = ? AND notification_id = ?',
            [user_id, notification_id]);

        return true;

    } catch (error) {
        return false;
    }
}


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
        const [row_0, fields_0] = await dbConnection.execute(
            'INSERT INTO user (user_type_id, name, surname, email, password, birth_date, school, grade_branch) VALUES (?,?,?,?,?,?,?,?)',
            [userInfo.type, userInfo.name, userInfo.surname, userInfo.email, userInfo.password, userInfo.birthDate, userInfo.school, userInfo.gradeBranch]
        );

        let row = await getUserByEmail(userInfo.email);

        // Setting cookie
        setReqCookie(req, row[0].user_id, row[0].name);
        res.status(200).send(JSON.stringify({ msg: req.session.user_type }));

    } catch (error) {
        return res.status(400).json({ msg: error.code });
    }
});

app.post('/login', async (req, res) => {

    // Checking credentials

    try {
        let row = await getUserByEmail(req.body.email);

        if (row.length == 0) return res.status(400).json({ msg: "INVALID_CREDENTIALS" });

        const match = await bcrypt.compare(req.body.password, row[0].password);
        if (!match) {
            return res.status(400).json({ msg: "INVALID_CREDENTIALS" })
        }

        // Setting cookie
        setReqCookie(req, row[0].user_id, row[0].name);
        res.status(200).send(JSON.stringify({ msg: req.session.user_type }));

    } catch (error) {
        return res.status(400).json({ msg: "INVALID_CREDENTIALS" });
    }
});

app.get('/getUserInfo', async (req, res) => {
    try {

        let userInfo = {};

        const [row, fields] = await dbConnection.execute(
            'SELECT user.user_id, user.name, user.surname, user_type.name as user_type FROM user INNER JOIN user_type ON user.user_type_id=user_type.user_type_id WHERE user_id = ?',
            [req.session.user_id]);


        userInfo.user_id = row[0].user_id;
        userInfo.name = row[0].name;
        userInfo.surname = row[0].surname;
        userInfo.user_type = row[0].user_type;

        const [notifications_sql] = await dbConnection.execute(
            'SELECT * FROM notification WHERE user_id = ? ORDER BY dismissable ASC',
            [req.session.user_id]);

        let notifications = notifications_sql.filter((elem) => {
            delete elem.user_id;
            return true;
        });

        userInfo.notifications = notifications;

        return res.status(200).send(JSON.stringify(userInfo));


    } catch (error) {
        return res.status(400).json({ msg: "NOT_LOGGED_IN" });
    }

});

app.get('/signout', async (req, res) => {
    req.session.destroy();
    res.status(200).send();
});

app.post('/dismissNotification', async (req, res) => {
    if (await dismissNotification(req.session.user_id, req.body.notification_id)) return res.status(200).send();
    else return res.status(400).json({ msg: "NOT_LOGGED_IN" });
});

app.get('/getUserById', async (req, res) => {
    try {
        const [user] = await dbConnection.execute(
            'SELECT User.user_id, User.name, User.surname, User.birth_date, User.school, User.grade_branch, User_Type.name as user_type FROM User INNER JOIN User_Type ON user.user_type_id = user_type.user_type_id WHERE user_id = ?',
            [req.query.id]);

        if (user.length == 0) return res.status(404).send();
        return res.status(200).send(user[0]);

    } catch (error) {
        return res.status(400).send();
    }
});

app.post('/createRelationRequest', async (req, res) => {
    try {
        const [result] = await dbConnection.execute(
            'INSERT INTO Relation_Request (from_user_id, to_user_id) VALUES (?,?)',
            [req.session.user_id, req.body.user_id]);

        res.status(200).send();

    } catch (error) {
        res.status(400).send();
    }
});

app.listen(process.env.PORT);