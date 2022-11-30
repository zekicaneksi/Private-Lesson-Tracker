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
        userInfo.notifications = [];


        // --- Setting notifications

        // Notificaiton Table
        const [notifications_sql] = await dbConnection.execute(
            'SELECT * FROM notification WHERE user_id = ?',
            [req.session.user_id]);

        notifications_sql.forEach(elem => {
            delete elem.user_id;
            elem.dismissable = true;
            userInfo.notifications.push(elem);
        });

        // Relation Requests

        const [relationRequests_sql] = await dbConnection.execute(
            'SELECT * FROM Relation_Request WHERE to_user_id = ?',
            [req.session.user_id]);

        if (relationRequests_sql.length > 0) {
            let relationRequestNotification = {
                dismissable: false,
                content: relationRequests_sql.length + " ilişki isteğiniz var"
            };
            userInfo.notifications.push(relationRequestNotification);
        }

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
            'INSERT INTO Relation_Request (from_user_id, to_user_id, nickname, personal_note) VALUES (?,?,?,?)',
            [req.session.user_id, req.body.user_id, req.body.nickname, req.body.personalNote]);

        const [inserted_request_sql] = await dbConnection.execute(
            'SELECT relation_request_id, name, surname FROM Relation_Request INNER JOIN User ON to_user_id = user_id WHERE relation_request_id = ?',
            [result.insertId]
        );
        res.status(200).send(JSON.stringify(inserted_request_sql[0]));

    } catch (error) {
        res.status(400).send();
    }
});

app.get('/sentRelationRequests', async (req, res) => {
    try {
        const [result] = await dbConnection.execute(
            'SELECT relation_request_id, user_type_id, name, surname, nickname FROM Relation_Request INNER JOIN User ON to_user_id = user_id WHERE from_user_id = ?',
            [req.session.user_id]);

        return res.status(200).send(JSON.stringify(result));

    } catch (error) {
        return res.status(400).send();
    }
});

app.post('/cancelRelationRequest', async (req, res) => {
    try {
        const [result] = await dbConnection.execute(
            'DELETE FROM Relation_Request WHERE relation_request_id = ? AND from_user_id = ?',
            [req.body.relation_request_id, req.session.user_id]
        );

        return res.status(200).send({ relation_request_id: req.body.relation_request_id });
    } catch (error) {
        return res.status(404).send();
    }
});

app.get('/getTeacherRelations', async (req, res) => {
    try {
        const [result] = await dbConnection.execute(
            'Select relation_id, Final.user_id, name, surname, personal_note_id, nickname, content FROM (SELECT relation_id, user_id, name, surname FROM (SELECT * FROM Relation WHERE user1_id = ? OR user2_id = ?) AS Abc INNER JOIN (SELECT User.user_id, User.name, User.surname FROM User INNER JOIN User_Type ON User_Type.user_type_id = User.user_type_id WHERE User.user_type_id = 1) AS Teachers ON (Abc.user1_id = Teachers.user_id OR Abc.user2_id = Teachers.user_id)) AS Final INNER JOIN Personal_Note ON (Final.user_id = for_user_id) WHERE Personal_Note.user_id = ?',
            [req.session.user_id, req.session.user_id, req.session.user_id]
        );

        return res.status(200).send(JSON.stringify(result));
    } catch (error) {
        
        return res.status(400).send();
    }
});

app.get('/getGuardianRelations', async (req, res) => {
    try {
        const [result] = await dbConnection.execute(
            'Select relation_id, Final.user_id, name, surname, personal_note_id, nickname, content FROM (SELECT relation_id, user_id, name, surname FROM (SELECT * FROM Relation WHERE user1_id = ? OR user2_id = ?) AS Abc INNER JOIN (SELECT User.user_id, User.name, User.surname FROM User INNER JOIN User_Type ON User_Type.user_type_id = User.user_type_id WHERE User.user_type_id = 3) AS Teachers ON (Abc.user1_id = Teachers.user_id OR Abc.user2_id = Teachers.user_id)) AS Final INNER JOIN Personal_Note ON (Final.user_id = for_user_id) WHERE Personal_Note.user_id = ?',
            [req.session.user_id, req.session.user_id, req.session.user_id]
        );

        return res.status(200).send(JSON.stringify(result));
    } catch (error) {
        
        return res.status(400).send();
    }
});

app.post('/editPersonalNote', async (req,res) => {
    try {
        const [result] = await dbConnection.execute(
            'UPDATE Personal_Note SET nickname = ?, content = ? WHERE user_id = ? AND personal_note_id = ?',
            [req.body.nickname, req.body.content, req.session.user_id, req.body.personal_note_id]
        );

        return res.status(200).send();
    } catch (error) {
        return res.status(400).send();
    }
});

app.post('/deleteRelation', async (req,res) => {
    try {

        // Delete personal notes

        const [removePersonalNotes_sql] = await dbConnection.execute(
            'DELETE FROM Personal_Note WHERE personal_note_id IN (SELECT DEF.personal_note_id FROM (SELECT* FROM (SELECT * FROM Relation WHERE (user1_id = ? OR user2_id = ?) AND relation_id = ?) As Abc INNER JOIN Personal_Note ON ((user1_id = for_user_id OR user1_id = user_id) AND (user2_id = for_user_id OR user2_id = user_id)) WHERE relation_id = ?) AS DEF WHERE relation_id = ?)',
            [req.session.user_id, req.session.user_id, req.body.relation_id, req.body.relation_id, req.body.relation_id]
        );

        const [removeRelation_sql] = await dbConnection.execute(
            'DELETE FROM Relation WHERE (user1_id = ? OR user2_id = ?) AND relation_id = ?',
            [req.session.user_id, req.session.user_id, req.body.relation_id]
        );

        return res.status(200).send();
    } catch (error) {
        return res.status(400).send();
    }
});

app.listen(process.env.PORT);