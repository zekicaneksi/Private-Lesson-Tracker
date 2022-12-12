import express from 'express';
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

        /* (not needed, but may be in the future)
        // Insert into Attendance table 
        if (req.body.sessionList.length > 0 && req.body.studentList.length > 0) {
            const [insertedSessionIds_sql] = await dbConnection.execute(
                'SELECT session_id FROM Session WHERE lesson_id = ?',
                [insertLesson_sql.insertId]
            );

            let InsertAttendanceList = [];
            req.body.studentList.forEach(student => {
                insertedSessionIds_sql.forEach(session_id => InsertAttendanceList.push([student.user_id, session_id.session_id, null]));
            });

            const insert_attendance = dbConnection.format(
                'INSERT INTO Attendance (student_id, session_id, existent) VALUES ?',
                [InsertAttendanceList]
            );
            const [insert_attendance_sql] = await dbConnection.execute(insert_attendance);
        }*/

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

        const [getPendingAssignments_sql] = await dbConnection.execute(
            'SELECT assignment_id FROM Lesson INNER JOIN Assignment ON Lesson.lesson_id = Assignment.lesson_id WHERE teacher_id = ? AND Lesson.lesson_id = ? AND student_id = ? AND due > (SELECT CURDATE())',
            [req.session.user_id, req.body.lessonId, req.body.studentId]
        );

        if(getPendingAssignments_sql.length > 0){
            const deletePendingAssignments_sql = dbConnection.format(
                'DELETE FROM Assignment WHERE assignment_id IN (?)',
                [getPendingAssignments_sql.map(elem => elem.assignment_id)]
            );
            await dbConnection.execute(deletePendingAssignments_sql);
        }

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
        if(check_sql[0].count != 1) return res.status(403).send();

        // Add the student to the lesson
        const [addStudent_sql] = await dbConnection.execute(
            'INSERT INTO Student_Lesson (student_id, lesson_id) VALUES (?,?)',
            [req.body.studentId, req.body.lessonId]
        );
        
        return res.status(200).send({student_lesson_id: addStudent_sql.insertId});
    } catch (error) {
        return res.status(403).send();
    }
});

app.post('/endLesson', async (req,res) => {
    try {
        
        // Make the lesson's ended column true
        const [endLesson_sql] = await dbConnection.execute(
            'UPDATE Lesson SET ended = 1 WHERE lesson_id = ? AND teacher_id = ?',
            [req.body.lessonId, req.session.user_id]
        );
        if(endLesson_sql.changedRows != 1) return res.status(403).send();
        
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

app.listen(process.env.PORT);