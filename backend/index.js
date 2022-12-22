import express, { json } from 'express';
import cors from 'cors';
import path from 'path';
import mysql from 'mysql2/promise'
import bcrypt from 'bcrypt';
import session from 'express-session';
import MySQLStore from 'express-mysql-session';
import { fileURLToPath } from 'url';
import * as dotenv from 'dotenv';
import { DateTime } from 'luxon';
import { convertTimeToMinutes } from './utils.js';

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
        let toReturn = {
            msg: ''
        };
        if (error.sqlState == 45000) toReturn.msg = error.sqlMessage;
        res.status(400).send(JSON.stringify(toReturn));
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

app.get('/pendingRelationRequests', async (req, res) => {
    try {
        const [result] = await dbConnection.execute(
            'SELECT relation_request_id, user_type_id, name, surname FROM Relation_Request INNER JOIN User ON from_user_id = user_id WHERE to_user_id = ?',
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

app.post('/acceptRelationRequest', async (req, res) => {
    try {

        const [result_insert_note_student_sql] = await dbConnection.execute(
            'INSERT INTO Personal_Note (user_id, for_user_id, nickname, content) SELECT from_user_id, to_user_id, nickname, personal_note FROM Relation_Request WHERE relation_request_id = ? AND to_user_id = ?',
            [req.body.relation_request_id, req.session.user_id]
        );

        const [result_insert_note_recepient_sql] = await dbConnection.execute(
            'INSERT INTO Personal_Note (user_id, for_user_id) SELECT to_user_id, from_user_id FROM Relation_Request WHERE relation_request_id = ? AND to_user_id = ?',
            [req.body.relation_request_id, req.session.user_id]
        );

        const [result_insert_relation_sql] = await dbConnection.execute(
            'INSERT INTO Relation (user1_id, user2_id) SELECT from_user_id, to_user_id FROM Relation_Request WHERE relation_request_id = ? AND to_user_id = ?',
            [req.body.relation_request_id, req.session.user_id]
        );

        const [result_delete_sql] = await dbConnection.execute(
            'DELETE FROM Relation_Request WHERE relation_request_id = ? AND to_user_id = ?',
            [req.body.relation_request_id, req.session.user_id]
        );

        const [result_toreturn_sql] = await dbConnection.execute(
            'Select relation_id, Final.user_id, name, surname, personal_note_id, nickname, content, school, grade_branch, birth_date FROM (SELECT relation_id, user_id, name, surname, school, grade_branch, birth_date FROM (SELECT * FROM Relation WHERE relation_id = ?) AS Abc INNER JOIN (SELECT User.user_id, User.name, User.surname, User.school, User.grade_branch, User.birth_date FROM User INNER JOIN User_Type ON User_Type.user_type_id = User.user_type_id WHERE User.user_type_id = 2) AS Teachers ON (Abc.user1_id = Teachers.user_id OR Abc.user2_id = Teachers.user_id)) AS Final INNER JOIN Personal_Note ON (Final.user_id = for_user_id) WHERE Personal_Note.user_id = ?',
            [result_insert_relation_sql.insertId, req.session.user_id]
        );

        return res.status(200).send(JSON.stringify(result_toreturn_sql[0]));
    } catch (error) {
        console.log(error);
        return res.status(404).send();
    }
});

app.post('/rejectRelationRequest', async (req, res) => {
    try {
        const [result] = await dbConnection.execute(
            'DELETE FROM Relation_Request WHERE relation_request_id = ? AND to_user_id = ?',
            [req.body.relation_request_id, req.session.user_id]
        );

        return res.status(200).send();
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

app.get('/getStudentRelations', async (req, res) => {
    try {
        const [result] = await dbConnection.execute(
            'Select relation_id, Final.user_id, name, surname, personal_note_id, nickname, content, school, grade_branch, birth_date FROM (SELECT relation_id, user_id, name, surname, school, grade_branch, birth_date FROM (SELECT * FROM Relation WHERE user1_id = ? OR user2_id = ?) AS Abc INNER JOIN (SELECT User.user_id, User.name, User.surname, User.school, User.grade_branch, User.birth_date FROM User INNER JOIN User_Type ON User_Type.user_type_id = User.user_type_id WHERE User.user_type_id = 2) AS Teachers ON (Abc.user1_id = Teachers.user_id OR Abc.user2_id = Teachers.user_id)) AS Final INNER JOIN Personal_Note ON (Final.user_id = for_user_id) WHERE Personal_Note.user_id = ?',
            [req.session.user_id, req.session.user_id, req.session.user_id]
        );

        return res.status(200).send(JSON.stringify(result));
    } catch (error) {

        return res.status(400).send();
    }
});

app.post('/editPersonalNote', async (req, res) => {
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

app.post('/deleteRelation', async (req, res) => {
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

app.post('/createLesson', async (req, res) => {

    try {

        let validationFail = false;

        // Check if user is a teacher
        const [checkUserType_sql] = await dbConnection.execute(
            'SELECT user_id FROM User WHERE user_id = ? AND user_type_id = 1',
            [req.session.user_id]
        );

        if (checkUserType_sql.length < 0) return res.status(403).send();

        // -- Student List validation

        // check if the teacher and the student has a relation
        if (req.body.studentList.length > 0) {
            const checkRelation = dbConnection.format("SELECT Count(*) as count FROM Relation WHERE (relation_id IN (?) AND (user1_id = ? OR user2_id = ?) AND (user1_id IN (?,?) AND user2_id IN (?,?)))",
                [req.body.studentList.map(elem => elem.relation_id), req.session.user_id, req.session.user_id, req.session.user_id, req.body.studentList.map(elem => elem.user_id), req.session.user_id, req.body.studentList.map(elem => elem.user_id)]);
            const [checkRelation_sql] = await dbConnection.execute(checkRelation);
            if (checkRelation_sql[0].count != req.body.studentList.length) return res.status(403).send();
        }

        // check if student list has duplicate students
        var valueArr = req.body.studentList.map(elem => elem.user_id);
        var isDuplicate = valueArr.some(function (item, idx) {
            return valueArr.indexOf(item) != idx
        });
        if (isDuplicate) return res.status(403).send();

        // -- Session data validation

        // check if dates are of future and beginning time is smaller than the ending time
        req.body.sessionList.forEach(elem => {
            if (!DateTime.fromISO(elem.date).isValid) validationFail = true;
            if ((new Date(elem.date)) <= (new Date())) validationFail = true;
            if (BigInt(convertTimeToMinutes(elem.startTime)) > BigInt(convertTimeToMinutes(elem.endTime))) validationFail = true;
        });
        if (validationFail) return res.status(403).send();

        // -- Payment data validation

        // check if dates are of future and the amount is not below zero
        req.body.paymentList.forEach(elem => {
            if (!DateTime.fromISO(elem.date).isValid) validationFail = true;
            if ((new Date(elem.date)) <= (new Date())) validationFail = true;
            if (elem.amount <= 0) validationFail = true;
        });
        if (validationFail) return res.status(403).send();

        // -- Insertions into tables

        // Insert into Lesson table
        const [insertLesson_sql] = await dbConnection.execute(
            'INSERT INTO Lesson (name, teacher_id, ended) VALUES (?,?,false)',
            [req.body.lessonName, req.session.user_id]
        );

        // Insert into Student_Lesson table
        if (req.body.studentList.length > 0) {
            const insert_studentLesson = dbConnection.format(
                'INSERT INTO Student_Lesson (student_id, lesson_id) VALUES ?',
                [req.body.studentList.map(elem => [elem.user_id, insertLesson_sql.insertId])]
            );
            const [insert_studentLesson_sql] = await dbConnection.execute(insert_studentLesson);
        }

        // Insert into Session table
        if (req.body.sessionList.length > 0) {
            const insert_session = dbConnection.format(
                'INSERT INTO Session (lesson_id, name, date, start_time, end_time) VALUES ?',
                [req.body.sessionList.map(elem => [insertLesson_sql.insertId, elem.sessionName, DateTime.fromISO(elem.date).toFormat('yyyy-MM-dd'), elem.startTime, elem.endTime])]
            );
            const [insert_session_sql] = await dbConnection.execute(insert_session);
        }

        // Insert into Payment table
        if (req.body.paymentList.length > 0 && req.body.studentList.length > 0) {
            let InsertPaymentList = [];
            req.body.studentList.forEach(student => {
                req.body.paymentList.forEach(payment => InsertPaymentList.push([insertLesson_sql.insertId, payment.amount, student.user_id, DateTime.fromISO(payment.date).toFormat('yyyy-MM-dd'), false]));
            });

            const insert_payment = dbConnection.format(
                'INSERT INTO Payment (lesson_id, amount, student_id, due, paid) VALUES ?',
                [InsertPaymentList]
            );
            const [insert_payment_sql] = await dbConnection.execute(insert_payment);
        }


        return res.status(200).send();

    } catch (error) {
        return res.status(403).send();
    }
});

app.get('/getTeacherLessons', async (req, res) => {
    try {
        const [teacherLessons_sql] = await dbConnection.execute(
            'SELECT * FROM Lesson WHERE teacher_id = ?',
            [req.session.user_id]
        );

        return res.status(200).send(JSON.stringify(teacherLessons_sql));
    } catch (error) {
        return res.status(403).send();
    }
});

app.get('/getTeacherLessonInfoById', async (req, res) => {
    try {
        const [sessionList_sql] = await dbConnection.execute(
            'SELECT session_id, name, date, start_time, end_time FROM (SELECT lesson_id FROM Lesson WHERE teacher_id = ? AND lesson_id = ?) as Lesson INNER JOIN Session ON Lesson.lesson_id = Session.lesson_id',
            [req.session.user_id, req.query.lessonId]
        );

        const [studentList_sql] = await dbConnection.execute(
            'SELECT student_lesson_id, student_id, name, surname, nickname FROM (SELECT student_lesson_id, student_id, name, surname FROM (SELECT student_lesson_id, student_id FROM (SELECT * FROM Lesson WHERE teacher_id = ? AND lesson_id = ?) as Lesson INNER JOIN Student_Lesson ON Lesson.lesson_id = Student_Lesson.lesson_id) as Abc INNER JOIN User ON abc.student_id = User.user_id) AS Def INNER JOIN Personal_Note ON (Personal_Note.for_user_id = Def.student_id AND Personal_Note.user_id = ?)',
            [req.session.user_id, req.query.lessonId, req.session.user_id]
        );

        return res.status(200).send(JSON.stringify({
            sessionList: sessionList_sql,
            studentList: studentList_sql
        }));
    } catch (error) {
        return res.status(403).send();
    }
});

app.post('/removeSession', async (req, res) => {
    try {
        const [removeSession_sql] = await dbConnection.execute(
            'DELETE FROM Session WHERE session_id = (SELECT session_id FROM (SELECT session_id FROM Lesson INNER JOIN Session ON Lesson.lesson_id = Session.lesson_id WHERE teacher_id = ? AND date > (SELECT CURDATE()) AND session_id = ?) AS abc)',
            [req.session.user_id, req.body.sessionId]
        );

        return res.status(200).send();
    } catch (error) {
        return res.status(403).send();
    }
});

app.post('/addSession', async (req, res) => {

    try {
        // check if the request maker has the lesson
        const [checkLesson_sql] = await dbConnection.execute(
            'SELECT Count(*) as count FROM Lesson WHERE teacher_id = ? AND lesson_id = ?',
            [req.session.user_id, req.body.lessonId]
        );
        if (checkLesson_sql[0].count == 0) return res.status(403).send();

        // check if dates are of future and beginning time is smaller than the ending time
        let validationFail = false;
        if (!DateTime.fromISO(req.body.date).isValid) validationFail = true;
        if ((new Date(req.body.date)) <= (new Date())) validationFail = true;
        if (BigInt(convertTimeToMinutes(req.body.startTime)) > BigInt(convertTimeToMinutes(req.body.endTime))) validationFail = true;
        if (validationFail) return res.status(403).send();

        // Insert the session
        const [insertSession_sql] = await dbConnection.execute(
            'INSERT INTO Session (lesson_id, name, date, start_time, end_time) VALUES (?,?,?,?,?)',
            [req.body.lessonId, req.body.name, DateTime.fromISO(req.body.date).toFormat('yyyy-MM-dd'), req.body.startTime, req.body.endTime]
        );

        return res.status(200).send(JSON.stringify({ insertId: insertSession_sql.insertId }));
    } catch (error) {
        return res.status(403).send();
    }
});

app.post('/removeStudentFromLesson', async (req, res) => {
    try {
        const [removeStudent_sql] = await dbConnection.execute(
            'DELETE FROM Student_Lesson WHERE student_lesson_id = (SELECT student_lesson_id FROM (SELECT student_lesson_id FROM Lesson INNER JOIN Student_Lesson ON Lesson.lesson_id = Student_Lesson.lesson_id WHERE teacher_id = ? AND Lesson.lesson_id = ? AND student_id = ?) As Abc)',
            [req.session.user_id, req.body.lessonId, req.body.studentId]
        );

        return res.status(200).send();
    } catch (error) {
        return res.status(403).send();
    }
});

app.post('/addStudentToLesson', async (req, res) => {
    try {

        // check if the request maker has the lesson, and the relation to the user
        const [check_sql] = await dbConnection.execute(
            'SELECT Count(*) as count FROM Lesson INNER JOIN Relation ON (user1_id IN (?,?) AND user2_id IN (?,?)) WHERE teacher_id = ? AND lesson_id = ?',
            [req.session.user_id, req.body.studentId, req.session.user_id, req.body.studentId, req.session.user_id, req.body.lessonId]
        );
        if (check_sql[0].count != 1) return res.status(403).send();

        // Add the student to the lesson
        const [addStudent_sql] = await dbConnection.execute(
            'INSERT INTO Student_Lesson (student_id, lesson_id) VALUES (?,?)',
            [req.body.studentId, req.body.lessonId]
        );

        return res.status(200).send({ student_lesson_id: addStudent_sql.insertId });
    } catch (error) {
        return res.status(403).send();
    }
});

app.post('/endLesson', async (req, res) => {
    try {

        // Make the lesson's ended column true
        const [endLesson_sql] = await dbConnection.execute(
            'UPDATE Lesson SET ended = 1 WHERE lesson_id = ? AND teacher_id = ?',
            [req.body.lessonId, req.session.user_id]
        );
        if (endLesson_sql.changedRows != 1) return res.status(403).send();

        // Delete all future sessons
        const [deleteSession_sql] = await dbConnection.execute(
            'DELETE FROM Session WHERE lesson_id = ? AND date > (SELECT CURDATE())',
            [req.body.lessonId]
        );

        // Delete  all future assignments
        const [deleteAssignments_sql] = await dbConnection.execute(
            'DELETE FROM Assignment WHERE lesson_id = ? AND due > (SELECT CURDATE())',
            [req.body.lessonId]
        );

        return res.status(200).send();
    } catch (error) {
        return res.status(403).send();
    }
});

app.get('/getSessionHistoryById', async (req, res) => {
    try {

        let toReturn = {
            sessionList: [],
            userList: [],
            studentsTakingTheLesson: []
        };

        // Get session list
        const [sessionList_sql] = await dbConnection.execute(
            'SELECT session_id, Session.name as session_name, date, start_time, end_time, lesson.name as lesson_name, attendance_registered FROM Session INNER JOIN Lesson ON Session.lesson_id = lesson.lesson_id WHERE teacher_id = ? AND Lesson.lesson_id = ?',
            [req.session.user_id, req.query.lessonId]
        );
        toReturn.sessionList = sessionList_sql.map(elem => {
            if (elem.attendance_registered == 1) elem.attendanceList = [];
            return elem;
        });

        // Get attendance list
        let sessionIds = [];
        sessionList_sql.forEach(elem => { if (elem.attendance_registered == 1) sessionIds.push(elem.session_id) });
        if (sessionIds.length == 0) return res.status(200).send(JSON.stringify(toReturn));
        const [attendanceList_sql] = await dbConnection.execute(dbConnection.format(
            'SELECT * FROM Attendance WHERE session_id IN (?)',
            [sessionIds]
        ));

        attendanceList_sql.forEach(elem => {
            toReturn.sessionList[toReturn.sessionList.findIndex(sessionElem => sessionElem.session_id == elem.session_id)].attendanceList.push(elem);
        });

        // Get the users that taking the lesson
        const [studentsTakingTheLesson_sql] = await dbConnection.execute(
            'SELECT UserTable.user_id, name, surname, nickname FROM (SELECT user_id, name, surname FROM Student_Lesson INNER JOIN User ON Student_Lesson.student_id = User.user_id WHERE Student_Lesson.lesson_id = ?) As UserTable INNER JOIN Personal_Note ON UserTable.user_id = Personal_Note.for_user_id WHERE Personal_Note.user_id = ?',
            [req.query.lessonId, req.session.user_id]
        );
        toReturn.studentsTakingTheLesson = [...studentsTakingTheLesson_sql];

        // Get userList
        let uniqueIds = [];
        toReturn.sessionList.forEach(sessionElem => {
            if (sessionElem.attendanceList == undefined) return;
            sessionElem.attendanceList.forEach(attendanceListElem => {
                if (uniqueIds.findIndex(uniqueIdElem => uniqueIdElem == attendanceListElem.student_id) == -1) uniqueIds.push(attendanceListElem.student_id);
            })
        });

        if (uniqueIds.length == 0) return res.status(200).send(JSON.stringify(toReturn));
        const [userList_sql] = await dbConnection.execute(dbConnection.format(
            'SELECT User.user_id, name, surname, nickname FROM User INNER JOIN Personal_Note ON User.user_id = Personal_Note.for_user_id WHERE User.user_id IN (?) AND Personal_Note.user_id = ?',
            [uniqueIds, req.session.user_id]
        ));
        toReturn.userList = [...userList_sql];
        toReturn.studentsTakingTheLesson.forEach(studentTakingTheLesson => {
            if (toReturn.userList.findIndex(elem => elem.user_id == studentTakingTheLesson.user_id) == -1) toReturn.userList.push(studentTakingTheLesson);
        })

        return res.status(200).send(JSON.stringify(toReturn));
    } catch (error) {
        return res.status(403).send();
    }
});

app.post('/registerAttendance', async (req, res) => {
    try {

        // Check if teacher owns the lesson
        const [checkLesson_sql] = await dbConnection.execute(
            'SELECT Count(*) as count FROM Lesson WHERE teacher_id = ?',
            [req.session.user_id]
        );
        if (checkLesson_sql[0].count == 0) return res.status(403).send();

        // Update the session info
        const [updateSessionInfo_sql] = await dbConnection.execute(
            'UPDATE Session SET attendance_registered = true WHERE session_id = ? AND lesson_id = ?',
            [req.body.session_id, req.body.lesson_id]
        );

        if (req.body.studentList.length != 0) {
            // Insert into attendance table
            const [insertAttendance_sql] = await dbConnection.execute(dbConnection.format(
                'INSERT INTO Attendance (session_id, student_id, existent) VALUES ?',
                [req.body.studentList.map(elem => [req.body.session_id, elem.user_id, elem.existent])]
            ));
        }

        return res.status(200).send();
    } catch (error) {
        return res.status(403).send();
    }
});

app.get('/getTeacherEndedLessons', async (req, res) => {
    try {

        let toReturn = {
            lessonList: [],
            uniqueUserInfo: []
        }

        // Get ended lessons
        const [endedLessonList_sql] = await dbConnection.execute(
            'SELECT lesson_id, name FROM Lesson WHERE teacher_id = ? AND ended = 1',
            [req.session.user_id]
        );

        endedLessonList_sql.forEach(elem => {
            let toPush = {
                lesson_id: elem.lesson_id,
                lesson_name: elem.name,
                studentsTakingTheLesson: [],
                sessionList: []
            }
            toReturn.lessonList.push(toPush);
        })
        if (toReturn.lessonList.length == 0) return res.status(200).send(JSON.stringify(toReturn));

        // Get session list
        const [sessionList_sql] = await dbConnection.execute(dbConnection.format(
            'SELECT session_id, lesson_id, name, date, start_time, end_time FROM Session WHERE lesson_id IN (?)',
            [toReturn.lessonList.map(elem => elem.lesson_id)]
        ));
        sessionList_sql.forEach(sessionElem => {
            toReturn.lessonList[toReturn.lessonList.findIndex(elem => elem.lesson_id == sessionElem.lesson_id)].sessionList.push({ ...sessionElem, attendanceList: [] });
        });

        // Get attendance list
        const [attendanceList_sql] = await dbConnection.execute(dbConnection.format(
            'SELECT session_id, student_id, existent FROM Attendance WHERE session_id IN (?)',
            [sessionList_sql.map(elem => elem.session_id)]
        ));

        attendanceList_sql.forEach(attendanceElem => {
            let lessonIndex, sessionIndex;
            lessonIndex = toReturn.lessonList.findIndex(lessonElem => {
                sessionIndex = lessonElem.sessionList.findIndex(sessionElem => sessionElem.session_id == attendanceElem.session_id);
                if (sessionIndex != -1) return true;
                else return false;
            });
            toReturn.lessonList[lessonIndex].sessionList[sessionIndex].attendanceList.push(attendanceElem);
        });

        // Get students taking the lesson
        const [studentsTakingTheLesson_sql] = await dbConnection.execute(dbConnection.format(
            'SELECT student_id, lesson_id FROM Student_Lesson WHERE lesson_id IN (?)',
            [toReturn.lessonList.map(elem => elem.lesson_id)]
        ));
        studentsTakingTheLesson_sql.forEach(elem => {
            toReturn.lessonList[toReturn.lessonList.findIndex(elemLesson => elemLesson.lesson_id == elem.lesson_id)].studentsTakingTheLesson.push(elem.student_id);
        });

        // Get student information
        let uniqueIdList = [];
        studentsTakingTheLesson_sql.forEach(elem => uniqueIdList.push(elem.student_id));
        attendanceList_sql.forEach(elem => {
            if (uniqueIdList.findIndex(elem2 => elem2 == elem.student_id) != -1) uniqueIdList.push(elem.student_id);
        });

        const [studentInfo_sql] = await dbConnection.execute(dbConnection.format(
            "SELECT User.user_id, name, surname, COALESCE(nickname,'') as nickname FROM User LEFT JOIN Personal_Note ON User.user_id = Personal_Note.for_user_id AND Personal_Note.user_id = ? WHERE User.user_id IN (?)",
            [req.session.user_id, uniqueIdList]
        ));

        toReturn.uniqueUserInfo = [...studentInfo_sql];

        return res.status(200).send(JSON.stringify(toReturn));
    } catch (error) {
        console.log(error);
        return res.status(403).send();
    }
});

app.get('/getTeacherSchedule', async (req, res) => {
    try {
        const [teacherSchedule_sql] = await dbConnection.execute(
            'SELECT Lesson.name as lesson_name, Session.name as session_name, date, start_time, end_time, session_id FROM Lesson INNER JOIN Session ON Lesson.lesson_id = Session.lesson_id WHERE teacher_id = ? AND date > (SELECT CURDATE()) ORDER BY date, start_time',
            [req.session.user_id]
        );

        return res.status(200).send(JSON.stringify(teacherSchedule_sql));
    } catch (error) {
        return res.status(403).send();
    }
});

app.get('/getTeacherAssignments', async (req, res) => {
    try {

        let toReturn = {
            lessonList: [],
            uniqueUsers: []
        };

        const [getTeacherStudentLessons_sql] = await dbConnection.execute(
            'SELECT lesson_id, lesson_name, student_id, name, surname, nickname FROM (SELECT lesson_id, lesson_name, student_id, nickname FROM (SELECT * FROM (SELECT Lesson.lesson_id, Lesson.name as lesson_name, student_id FROM Lesson LEFT OUTER JOIN Student_Lesson ON Lesson.lesson_id = Student_Lesson.lesson_id WHERE teacher_id = ? AND ended = false) as StudentAndLessons LEFT OUTER JOIN Personal_Note ON Personal_Note.user_id = ? AND Personal_Note.for_user_id = StudentAndLessons.student_id) as Final WHERE NOT (student_id is not null AND personal_note_id is null)) as ActualFinal LEFT OUTER JOIN User ON User.user_id = ActualFinal.student_id',
            [req.session.user_id, req.session.user_id]
        )

        // Push lessons to toReturn
        getTeacherStudentLessons_sql.forEach(sqlElem => {
            if (toReturn.lessonList.findIndex(arrElem => arrElem.lesson_id == sqlElem.lesson_id) == -1) {
                toReturn.lessonList.push({
                    lesson_id: sqlElem.lesson_id,
                    lesson_name: sqlElem.lesson_name,
                    studentsTakingTheLesson: [],
                    assignmentList: []
                });
            }
        });

        // Push students to lessons
        getTeacherStudentLessons_sql.forEach(sqlElem => {
            if (sqlElem.student_id == null) return;
            let index = toReturn.lessonList.findIndex(arrElem => arrElem.lesson_id == sqlElem.lesson_id);
            toReturn.lessonList[index].studentsTakingTheLesson.push(sqlElem.student_id);
        });

        // Get unique user list
        getTeacherStudentLessons_sql.forEach(sqlElem => {
            if (sqlElem.student_id == null) return;
            if (toReturn.uniqueUsers.findIndex(arrElem => arrElem.user_id == sqlElem.student_id) == -1) {
                toReturn.uniqueUsers.push({
                    user_id: sqlElem.student_id,
                    name: sqlElem.name,
                    surname: sqlElem.surname,
                    nickname: sqlElem.nickname
                });
            }
        });

        // Get Assignments
        const [getAssignments_sql] = await dbConnection.execute(
            'SELECT Assignment.assignment_id, Lesson.lesson_id, header, content, due FROM Assignment INNER JOIN Lesson ON Assignment.lesson_id = Lesson.lesson_id WHERE teacher_id = ? AND done = 0 ORDER BY lesson_id, due',
            [req.session.user_id]
        );

        getAssignments_sql.forEach(assignment => {
            let index = toReturn.lessonList.findIndex(lesson => lesson.lesson_id == assignment.lesson_id);
            toReturn.lessonList[index].assignmentList.push(assignment);
        });

        return res.status(200).send(JSON.stringify(toReturn));
    } catch (error) {
        return res.status(403).send();
    }
});

app.post('/createAssignment', async (req, res) => {
    try {

        // Check if teacher owns the lesson
        const [checkLesson_sql] = await dbConnection.execute(
            'SELECT Count(*) as count FROM Lesson WHERE teacher_id = ? AND lesson_id = ?',
            [req.session.user_id, req.body.lesson_id]
        );
        if (checkLesson_sql[0].count == 0) return res.status(403).send();

        // Check if the due date is valid and from future
        if (!DateTime.fromISO(req.body.due).isValid) return res.status(403).send();
        if ((new Date(req.body.due)) <= (new Date())) return res.status(403).send();

        // Create the assignment
        const [insertAssignment_sql] = await dbConnection.execute(
            'INSERT INTO Assignment (lesson_id, header,content,due,done) VALUES (?, ?, ?, ? ,false)',
            [req.body.lesson_id, req.body.header, req.body.content, req.body.due]
        );

        return res.status(200).send(JSON.stringify({ insertId: insertAssignment_sql.insertId }));
    } catch (error) {
        return res.status(403).send();
    }
});

app.post('/registerAssignment', async (req, res) => {
    try {
        // Update the assignment
        const [updateAssignment_sql] = await dbConnection.execute(
            'UPDATE Assignment SET done = 1 WHERE assignment_id = (Select * FROM (SELECT assignment_id FROM Lesson INNER JOIN Assignment ON Lesson.lesson_id = Assignment.lesson_id WHERE teacher_id = ? AND Assignment.assignment_id = ?) as Abc)',
            [req.session.user_id, req.body.assignment_id]
        )

        // Insert into Assignment_Student
        if (req.body.studentList.length == 0) return res.status(200).send();
        const [insert_sql] = await dbConnection.execute(dbConnection.format(
            'INSERT INTO Assignment_Student (assignment_id, student_id, done) VALUES ?',
            [req.body.studentList.map(elem => {
                return [req.body.assignment_id, elem.student_id, elem.done]
            })]
        ));

        return res.status(200).send();
    } catch (error) {
        return res.status(403).send();
    }
});

app.get('/getTeacherPastAssignments', async (req, res) => {
    try {
        const [lessonList_sql] = await dbConnection.execute(
            'SELECT lesson_id, name FROM Lesson WHERE teacher_id = ? ORDER BY lesson_id',
            [req.session.user_id]
        )

        const [assignmentList_sql] = await dbConnection.execute(dbConnection.format(
            'SELECT Assignment.assignment_id, Assignment.lesson_id, Assignment_Student.student_id, Assignment.header, Assignment.content, Assignment.due, Assignment_Student.done FROM Assignment LEFT OUTER JOIN Assignment_Student ON Assignment.assignment_id = Assignment_Student.assignment_id WHERE Assignment.done = 1 AND Assignment.lesson_id IN (SELECT lesson_id FROM Lesson WHERE teacher_id = ?) ORDER BY Assignment.due',
            [req.session.user_id]
        ));

        let toReturn = {
            lessonsInfo: [],
            userList: []
        };

        // Push lessons
        lessonList_sql.forEach(elem => {
            elem.assignmentList = [];
            toReturn.lessonsInfo.push(elem);
        });

        // Fill lessons' assignments
        assignmentList_sql.forEach(elem => {
            let lessonIndex = toReturn.lessonsInfo.findIndex(lesson => lesson.lesson_id == elem.lesson_id);
            if (toReturn.lessonsInfo[lessonIndex].assignmentList.findIndex(assignment => assignment.assignment_id == elem.assignment_id) == -1) {
                toReturn.lessonsInfo[lessonIndex].assignmentList.push({
                    assignment_id: elem.assignment_id,
                    header: elem.header,
                    content: elem.content,
                    due: elem.due,
                    studentsThatDidDo: [],
                    studentsThatDidNotDo: []
                })
            }
        })

        // Fill assignments' students
        assignmentList_sql.forEach(elem => {
            if (elem.student_id == null) return;
            let lessonIndex = toReturn.lessonsInfo.findIndex(lesson => lesson.lesson_id == elem.lesson_id);
            let assignmentIndex = toReturn.lessonsInfo[lessonIndex].assignmentList.findIndex(assignment => assignment.assignment_id == elem.assignment_id);
            if (elem.done) toReturn.lessonsInfo[lessonIndex].assignmentList[assignmentIndex].studentsThatDidDo.push(elem.student_id);
            else toReturn.lessonsInfo[lessonIndex].assignmentList[assignmentIndex].studentsThatDidNotDo.push(elem.student_id);
        });

        // Get student information
        let uniqueIdList = [];

        toReturn.lessonsInfo.forEach(lesson => {
            lesson.assignmentList.forEach(assignment => {
                assignment.studentsThatDidDo.forEach(elem => {
                    if (uniqueIdList.findIndex(elem2 => elem == elem2) == -1) uniqueIdList.push(elem);
                })
                assignment.studentsThatDidNotDo.forEach(elem => {
                    if (uniqueIdList.findIndex(elem2 => elem == elem2) == -1) uniqueIdList.push(elem);
                })
            })
        })

        if (uniqueIdList.length > 0) {
            const [studentInfo_sql] = await dbConnection.execute(dbConnection.format(
                "SELECT User.user_id, name, surname, COALESCE(nickname,'') as nickname FROM User LEFT JOIN Personal_Note ON User.user_id = Personal_Note.for_user_id AND Personal_Note.user_id = ? WHERE User.user_id IN (?)",
                [req.session.user_id, uniqueIdList]
            ));

            toReturn.userList = [...studentInfo_sql];
        }

        return res.status(200).send(JSON.stringify(toReturn));
    } catch (error) {
        return res.status(403).send();
    }
});

app.get('/getTeacherPayments', async (req, res) => {
    try {
        const [getTeacherPayments_sql] = await dbConnection.execute(
            'SELECT payment_id, Lesson.lesson_id, student_id, Lesson.name as lesson_name, amount, due, paid FROM Lesson INNER JOIN Payment ON Lesson.lesson_id = Payment.lesson_id WHERE teacher_id = ? ORDER BY due',
            [req.session.user_id]
        );

        let toReturn = {
            paymentList: getTeacherPayments_sql,
            lessonList: [],
            userList: []
        };

        let uniqueUserIds = [];
        toReturn.paymentList.forEach(payment => {
            if (toReturn.lessonList.findIndex(lesson => lesson.lesson_id == payment.lesson_id) == -1) toReturn.lessonList.push({
                lesson_id: payment.lesson_id,
                lesson_name: payment.lesson_name
            });

            if (uniqueUserIds.findIndex(elem => elem == payment.student_id) == -1) uniqueUserIds.push(payment.student_id);
        })

        if (uniqueUserIds.length > 0) {
            const [studentInfo_sql] = await dbConnection.execute(dbConnection.format(
                "SELECT User.user_id, name, surname, COALESCE(nickname,'') as nickname FROM User LEFT JOIN Personal_Note ON User.user_id = Personal_Note.for_user_id AND Personal_Note.user_id = ? WHERE User.user_id IN (?)",
                [req.session.user_id, uniqueUserIds]
            ));

            toReturn.userList = [...studentInfo_sql];
        }


        return res.status(200).send(JSON.stringify(toReturn));
    } catch (error) {
        return res.status(403).send();
    }
});

app.get('/getTeacherStudentLessons', async (req, res) => {
    try {
        const [getTeacherStudentLessons_sql] = await dbConnection.execute(
            'SELECT Lesson.lesson_id, name, student_lesson_id, student_id FROM Lesson LEFT OUTER JOIN Student_Lesson ON Lesson.lesson_id = Student_Lesson.lesson_id WHERE teacher_id = ?',
            [req.session.user_id]
        );

        let toReturn = {
            lessonList: [],
            userList: []
        }

        // Extract lessons
        getTeacherStudentLessons_sql.forEach(elem => {
            if (toReturn.lessonList.findIndex(lesson => lesson.lesson_id == elem.lesson_id) == -1) toReturn.lessonList.push({
                lesson_id: elem.lesson_id,
                lesson_name: elem.name,
                studentList: []
            })
        });

        // Extract students
        getTeacherStudentLessons_sql.forEach(elem => {
            if (elem.student_lesson_id == null) return;
            let lessonIndex = toReturn.lessonList.findIndex(lesson => lesson.lesson_id == elem.lesson_id);
            toReturn.lessonList[lessonIndex].studentList.push(elem.student_id);
        });

        // Get users' info
        let uniqueIdList = [];
        toReturn.lessonList.forEach(lesson => {
            lesson.studentList.forEach(studentId => {
                if (uniqueIdList.findIndex(elem => elem == studentId) == -1) uniqueIdList.push(studentId);
            })
        });

        if (uniqueIdList.length > 0) {
            const [studentInfo_sql] = await dbConnection.execute(dbConnection.format(
                "SELECT User.user_id, name, surname, COALESCE(nickname,'') as nickname FROM User LEFT JOIN Personal_Note ON User.user_id = Personal_Note.for_user_id AND Personal_Note.user_id = ? WHERE User.user_id IN (?)",
                [req.session.user_id, uniqueIdList]
            ));

            toReturn.userList = [...studentInfo_sql];
        }

        return res.status(200).send(JSON.stringify(toReturn));
    } catch (error) {
        return res.status(403).send();
    }
});

app.post('/addPayment', async (req, res) => {
    try {

        // Validate values
        if (!DateTime.fromISO(req.body.due).isValid) return res.status(403).send();
        if ((new Date(req.body.due)) <= (new Date())) return res.status(403).send();

        if (req.body.amount <= 0) return res.status(403).send();

        // Check if teacher owns the lesson
        const [checkLesson_sql] = await dbConnection.execute(
            'SELECT Count(*) as count FROM Lesson WHERE teacher_id = ? AND lesson_id = ?',
            [req.session.user_id, req.body.lesson_id]
        );
        if (checkLesson_sql[0].count == 0) return res.status(403).send();

        const [insertPayment_sql] = await dbConnection.execute(
            'INSERT INTO Payment (lesson_id, student_id, amount, due, paid) VALUES (?,?,?,?,false)',
            [req.body.lesson_id, req.body.student_id, req.body.amount, req.body.due]
        );

        return res.status(200).send();

    } catch (error) {
        return res.status(403).send();
    }
});

app.post('/acceptPayment', async (req, res) => {
    try {

        // Check if the teacher owns the lesson and payment
        const [checkValidity_sql] = await dbConnection.execute(
            'SELECT Count(*) as count FROM Lesson INNER JOIN Payment ON Lesson.lesson_id = Payment.lesson_id WHERE teacher_id = ? AND payment_id = ?',
            [req.session.user_id, req.body.payment_id]
        );
        if (checkValidity_sql[0].count == 0) return res.status(403).send();

        const [updatePayment_sql] = await dbConnection.execute(
            'UPDATE Payment SET paid = true WHERE payment_id = ?',
            [req.body.payment_id]
        );

        return res.status(200).send();
    } catch (error) {
        return res.status(403).send();
    }
});

app.get('/getTeacherNotes', async (req, res) => {
    try {

        const [getTeacherNotes_sql] = await dbConnection.execute(
            'SELECT * FROM Note WHERE teacher_id = ? ORDER BY creation_date',
            [req.session.user_id]
        );

        return res.status(200).send(JSON.stringify(getTeacherNotes_sql));
    } catch (error) {
        return res.status(403).send();
    }
});

app.post('/createNote', async (req, res) => {
    try {
        const [createNote_sql] = await dbConnection.execute(
            'INSERT INTO Note (teacher_id, student_id, creation_date, header, content) VALUES (?,?,CURDATE(),?,?)',
            [req.session.user_id, req.body.student_id, req.body.header, req.body.content]
        )

        return res.status(200).send(JSON.stringify({ insertId: createNote_sql.insertId }));
    } catch (error) {
        return res.status(403).send();
    }
});

app.post('/editNote', async (req, res) => {
    try {
        const [editNote_sql] = await dbConnection.execute(
            'UPDATE Note SET header=?, content=? WHERE teacher_id = ? AND note_id = ?',
            [req.body.header, req.body.content, req.session.user_id, req.body.note_id]
        );

        return res.status(200).send();
    } catch (error) {
        return res.status(403).send();
    }
});

app.post('/deleteNote', async (req, res) => {
    try {
        const [deleteNote_sql] = await dbConnection.execute(
            'DELETE FROM Note WHERE teacher_id = ? AND note_id = ?',
            [req.session.user_id, req.body.note_id]
        );

        return res.status(200).send();
    } catch (error) {
        return res.status(403).send();
    }
});

app.get('/getTeacherUpcomingAttendance', async (req, res) => {
    try {

        let toReturn = {
            sessionList: [],
            lessonList: [],
            userList: []
        }

        // Get the sessions to enter attendance to
        const [getSessions_sql] = await dbConnection.execute(
            'SELECT session_id, Lesson.lesson_id, Lesson.name as lesson_name, Session.name as session_name, date, start_time, end_time FROM Lesson INNER JOIN Session ON Session.lesson_id = Lesson.lesson_id WHERE teacher_id = ? AND attendance_registered = false AND Date < (DATE(now())) ORDER BY date',
            [req.session.user_id]
        );

        toReturn.sessionList = [...getSessions_sql];

        toReturn.sessionList.forEach(session => {
            if (toReturn.lessonList.findIndex(lesson => lesson.lesson_id == session.lesson_id) == -1)
                toReturn.lessonList.push({
                    lesson_id: session.lesson_id,
                    lesson_name: session.lesson_name,
                    studentsTakingTheLesson: []
                });
        });

        if (getSessions_sql.length == 0) return res.status(200).send(JSON.stringify(toReturn));

        // Get the student ids that take the lessons that sessions have
        const [getStudentIds_sql] = await dbConnection.execute(dbConnection.format(
            'SELECT * FROM Student_Lesson WHERE lesson_id IN (?)',
            [toReturn.lessonList.map(lesson => lesson.lesson_id)]
        ));

        getStudentIds_sql.forEach(studentLesson => {
            let lessonIndex = toReturn.lessonList.findIndex(lesson => lesson.lesson_id == studentLesson.lesson_id);
            toReturn.lessonList[lessonIndex].studentsTakingTheLesson.push(studentLesson.student_id);
        });

        if (getStudentIds_sql.length == 0) return res.status(200).send(JSON.stringify(toReturn));

        // Get the student info
        let uniqueUserIds = []
        toReturn.lessonList.forEach(lesson => {
            lesson.studentsTakingTheLesson.forEach(id => {
                if(uniqueUserIds.findIndex(elem => elem==id) == -1) uniqueUserIds.push(id);
            })
        })

        const [getStudentInfo_sql] = await dbConnection.execute(dbConnection.format(
            "SELECT User.user_id, name, surname, COALESCE(nickname,'') as nickname FROM User LEFT JOIN Personal_Note ON User.user_id = Personal_Note.for_user_id AND Personal_Note.user_id = ? WHERE User.user_id IN (?)",
            [req.session.user_id, uniqueUserIds]
        ))

        toReturn.userList = [...getStudentInfo_sql];

        return res.status(200).send(JSON.stringify(toReturn));

    } catch (error) {
        return res.status(403).send();
    }
});

app.get('/getStudentSchedule', async (req, res) => {
    try {
        const [getSchedule_sql] = await dbConnection.execute(
            'SELECT lesson_name, Session.name as session_name, date, start_time, end_time, session_id FROM (SELECT Lesson.lesson_id, Lesson.name as lesson_name FROM Student_Lesson INNER JOIN Lesson ON Student_Lesson.lesson_id = Lesson.lesson_id WHERE student_id = ?) AS Abc INNER JOIN Session ON Abc.lesson_id = Session.lesson_id AND date > (SELECT CURDATE()) ORDER BY date, start_time',
            [req.session.user_id]
        )
        
        return res.status(200).send(JSON.stringify(getSchedule_sql));
    } catch (error) {
        return res.status(403).send();
    }
});

app.get('/getStudentLessons', async (req, res) => {
    try {

        const [studentLessons_sql] = await dbConnection.execute(dbConnection.format(
            "SELECT lesson_id, lesson_name, name as teacher_name, surname as teacher_surname, COALESCE(nickname,'') as nickname FROM (SELECT * FROM (SELECT Lesson.lesson_id as lesson_id, Lesson.name as lesson_name, lesson.teacher_id FROM Student_Lesson INNER JOIN Lesson ON Student_Lesson.lesson_id = Lesson.lesson_id WHERE student_id = ? AND ended = false) as Abc INNER JOIN User ON Abc.teacher_id = User.user_id) as Final LEFT OUTER JOIN Personal_Note ON Final.teacher_id = Personal_Note.for_user_id AND Personal_Note.user_id = ?",
            [req.session.user_id, req.session.user_id]
        ));

        return res.status(200).send(JSON.stringify(studentLessons_sql));
    } catch (error) {
        return res.status(403).send();
    }
});

app.get('/getStudentLessonInfoById', async (req, res) => {
    try {
        const [sessionList_sql] = await dbConnection.execute(
            'SELECT session_id, name, date, start_time, end_time FROM (SELECT Lesson.lesson_id FROM Lesson INNER JOIN Student_Lesson on lesson.lesson_id = Student_Lesson.lesson_id WHERE student_id = ? AND Lesson.lesson_id = ?) as Lesson INNER JOIN Session ON Lesson.lesson_id = Session.lesson_id ORDER BY date, start_time, end_time',
            [req.session.user_id, req.query.lessonId]
        );

        return res.status(200).send(JSON.stringify(sessionList_sql));
    } catch (error) {
        return res.status(403).send();
    }
});

app.get('/getStudentSessionHistoryById', async (req, res) => {
    try {
        const [getSessionHistory] = await dbConnection.execute(
            'SELECT Final.session_id, name, date, start_time, end_time, existent FROM (SELECT session_id, name, date, start_time, end_time FROM (SELECT Lesson.lesson_id FROM Lesson INNER JOIN Student_Lesson on lesson.lesson_id = Student_Lesson.lesson_id WHERE student_id = ? AND Lesson.lesson_id = ?) as Lesson INNER JOIN Session ON Lesson.lesson_id = Session.lesson_id WHERE attendance_registered = true ORDER BY date, start_time, end_time) as Final INNER JOIN Attendance ON Attendance.session_id = Final.session_id WHERE student_id = ? ORDER BY date desc, start_time, end_time',
            [req.session.user_id, req.query.lessonId, req.session.user_id]
        )

        return res.status(200).send(JSON.stringify(getSessionHistory));
    } catch (error) {
        return res.status(403).send();
    }
});

app.get('/getStudentEndedLessons', async (req, res) => {
    try {
        
        const [studentLessons_sql] = await dbConnection.execute(dbConnection.format(
            "SELECT lesson_id, lesson_name, name as teacher_name, surname as teacher_surname, COALESCE(nickname,'') as nickname FROM (SELECT * FROM (SELECT Lesson.lesson_id as lesson_id, Lesson.name as lesson_name, lesson.teacher_id FROM Student_Lesson INNER JOIN Lesson ON Student_Lesson.lesson_id = Lesson.lesson_id WHERE student_id = ? AND ended = true) as Abc INNER JOIN User ON Abc.teacher_id = User.user_id) as Final LEFT OUTER JOIN Personal_Note ON Final.teacher_id = Personal_Note.for_user_id AND Personal_Note.user_id = ?",
            [req.session.user_id, req.session.user_id]
        ));

            return res.status(200).send(JSON.stringify(studentLessons_sql));
    } catch (error) {
        return res.status(403).send();
    }
});

app.get('/getStudentAssignments', async (req, res) => {
    try {

        let toReturn={
            activeAssignments: [],
            pastAssignments: [],
            lessonList: []
        }
        
        const [getActiveAssignments_sql] = await dbConnection.execute(
            'SELECT assignment_id, Assignment.lesson_id, header, content, due  FROM Student_Lesson INNER JOIN Assignment ON Student_Lesson.lesson_id = Assignment.lesson_id WHERE student_id = ? AND Assignment.done = false ORDER BY due',
            [req.session.user_id]
        );
        
        toReturn.activeAssignments = [...getActiveAssignments_sql];

        const [getPastAssignments_sql] = await dbConnection.execute(
            'SELECT Assignment.assignment_id, Assignment.lesson_id, header, content, due, a_s.done FROM Assignment_Student as a_s INNER JOIN Assignment ON a_s.assignment_id = Assignment.assignment_id WHERE student_id = ?  ORDER BY due desc',
            [req.session.user_id]
        );

        toReturn.pastAssignments = [...getPastAssignments_sql];

        let uniqueLessonIds = [];

        getActiveAssignments_sql.forEach(assignment => {
            if (uniqueLessonIds.findIndex(elem => elem == assignment.lesson_id) == -1) uniqueLessonIds.push(assignment.lesson_id);
        });

        getPastAssignments_sql.forEach(assignment => {
            if (uniqueLessonIds.findIndex(elem => elem == assignment.lesson_id) == -1) uniqueLessonIds.push(assignment.lesson_id);
        });

        if (uniqueLessonIds.length == 0) return res.status(200).send(JSON.stringify(toReturn));
        const [getLessonList_sql] = await dbConnection.execute(dbConnection.format(
            'SELECT lesson_id, name as lesson_name FROM Lesson WHERE lesson_id IN (?)',
            [uniqueLessonIds]
        ));

        toReturn.lessonList = [...getLessonList_sql];

        return res.status(200).send(JSON.stringify(toReturn));
    } catch (error) {
        return res.status(403).send();
    }
});

app.get('/getGuardianSchedule', async (req, res) => {
    try {

        let toReturn=[];

        const [getStudentRelations_sql] = await dbConnection.execute(
            'Select Final.user_id, name, surname, nickname FROM (SELECT relation_id, user_id, name, surname, school, grade_branch, birth_date FROM (SELECT * FROM Relation WHERE user1_id = ? OR user2_id = ?) AS Abc INNER JOIN (SELECT User.user_id, User.name, User.surname, User.school, User.grade_branch, User.birth_date FROM User INNER JOIN User_Type ON User_Type.user_type_id = User.user_type_id WHERE User.user_type_id = 2) AS Teachers ON (Abc.user1_id = Teachers.user_id OR Abc.user2_id = Teachers.user_id)) AS Final INNER JOIN Personal_Note ON (Final.user_id = for_user_id) WHERE Personal_Note.user_id = ?',
            [req.session.user_id, req.session.user_id, req.session.user_id]
        )

        getStudentRelations_sql.forEach(relation => {
            relation.schedule = []
            toReturn.push(relation);
        })

        if (getStudentRelations_sql.length == 0) return res.status(200).send(JSON.stringify(toReturn));
        
        const [getSchedule_sql] = await dbConnection.execute(dbConnection.format(
            'SELECT lesson_name, Session.name as session_name, date, start_time, end_time, session_id, student_id FROM (SELECT Lesson.lesson_id, Lesson.name as lesson_name, Student_Lesson.student_id FROM Student_Lesson INNER JOIN Lesson ON Student_Lesson.lesson_id = Lesson.lesson_id WHERE student_id IN (?)) AS Abc INNER JOIN Session ON Abc.lesson_id = Session.lesson_id AND date > (SELECT CURDATE()) ORDER BY date, start_time',
            [getStudentRelations_sql.map(elem => elem.user_id)]
        ));

        getSchedule_sql.forEach(session => {
            toReturn[toReturn.findIndex(student => student.user_id == session.student_id)].schedule.push(session);
        })

        return res.status(200).send(JSON.stringify(toReturn));
    } catch (error) {
        return res.status(403).send();
    }
});

app.get('/getGuardianLessons', async (req, res) => {
    try {

        let toReturn = [];

        const [getStudentRelations_sql] = await dbConnection.execute(
            'Select Final.user_id, name, surname, nickname FROM (SELECT relation_id, user_id, name, surname, school, grade_branch, birth_date FROM (SELECT * FROM Relation WHERE user1_id = ? OR user2_id = ?) AS Abc INNER JOIN (SELECT User.user_id, User.name, User.surname, User.school, User.grade_branch, User.birth_date FROM User INNER JOIN User_Type ON User_Type.user_type_id = User.user_type_id WHERE User.user_type_id = 2) AS Teachers ON (Abc.user1_id = Teachers.user_id OR Abc.user2_id = Teachers.user_id)) AS Final INNER JOIN Personal_Note ON (Final.user_id = for_user_id) WHERE Personal_Note.user_id = ?',
            [req.session.user_id, req.session.user_id, req.session.user_id]
        );

        getStudentRelations_sql.forEach(relation => {
            relation.lessonList = []
            toReturn.push(relation);
        })

        if (getStudentRelations_sql.length == 0) return res.status(200).send(JSON.stringify(toReturn));

        const [getLessons_sql] = await dbConnection.execute(dbConnection.format(
            "SELECT lesson_id, lesson_name, name as teacher_name, surname as teacher_surname, student_id as user_id FROM (SELECT Lesson.lesson_id as lesson_id, Lesson.name as lesson_name, lesson.teacher_id, student_id FROM Student_Lesson INNER JOIN Lesson ON Student_Lesson.lesson_id = Lesson.lesson_id WHERE student_id IN (?) AND ended = false) as Abc INNER JOIN User ON Abc.teacher_id = User.user_id",
            [getStudentRelations_sql.map(elem => elem.user_id)]
        ));

        getLessons_sql.forEach(lesson => {
            toReturn[toReturn.findIndex(student => student.user_id == lesson.user_id)].lessonList.push(lesson);
        })

        return res.status(200).send(JSON.stringify(toReturn));
    } catch (error) {
        console.log(error);
        return res.status(403).send();
    }
});

app.get('/getGuardianLessonInfoById', async (req, res) => {
    try {
        // check if the guardian has the student relation
        const [checkRelation_sql] = await dbConnection.execute(dbConnection.format(
            'SELECT COUNT(*) as count FROM Relation WHERE user1_id IN (?,?) AND user2_id IN (?,?)',
            [req.session.user_id, req.query.userId, req.session.user_id, req.query.userId]
        ));
        if (checkRelation_sql[0].count == 0) return res.status(403).send();

        const [sessionList_sql] = await dbConnection.execute(
            'SELECT session_id, name, date, start_time, end_time FROM (SELECT Lesson.lesson_id FROM Lesson INNER JOIN Student_Lesson on lesson.lesson_id = Student_Lesson.lesson_id WHERE student_id = ? AND Lesson.lesson_id = ?) as Lesson INNER JOIN Session ON Lesson.lesson_id = Session.lesson_id ORDER BY date, start_time, end_time',
            [req.query.userId, req.query.lessonId]
        );

        return res.status(200).send(JSON.stringify(sessionList_sql));

    } catch (error) {
        return res.status(403).send();
    }
});

app.get('/getGuardianSessionHistoryById', async (req, res) => {
    try {
        // check if the guardian has the student relation
        const [checkRelation_sql] = await dbConnection.execute(dbConnection.format(
            'SELECT COUNT(*) as count FROM Relation WHERE user1_id IN (?,?) AND user2_id IN (?,?)',
            [req.session.user_id, req.query.userId, req.session.user_id, req.query.userId]
        ));
        if (checkRelation_sql[0].count == 0) return res.status(403).send();

        const [getSessionHistory] = await dbConnection.execute(
            'SELECT Final.session_id, name, date, start_time, end_time, existent FROM (SELECT session_id, name, date, start_time, end_time FROM (SELECT Lesson.lesson_id FROM Lesson INNER JOIN Student_Lesson on lesson.lesson_id = Student_Lesson.lesson_id WHERE student_id = ? AND Lesson.lesson_id = ?) as Lesson INNER JOIN Session ON Lesson.lesson_id = Session.lesson_id WHERE attendance_registered = true ORDER BY date, start_time, end_time) as Final INNER JOIN Attendance ON Attendance.session_id = Final.session_id WHERE student_id = ? ORDER BY date desc, start_time, end_time',
            [req.query.userId, req.query.lessonId, req.query.userId]
        )

        return res.status(200).send(JSON.stringify(getSessionHistory));
    } catch (error) {
        return res.status(403).send();
    }
});

app.listen(process.env.PORT);