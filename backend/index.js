import express from 'express';
import cors from 'cors';
import path from 'path';
import mysql from 'mysql2/promise'
import { fileURLToPath } from 'url';
import * as dotenv from 'dotenv';

// Setup dotenv (enviorement variables)
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
dotenv.config({ path: path.join(__dirname, `.env.${process.env.NODE_ENV}`) });

const app = express();

// Middlewares

app.use(cors({
    optionsSuccessStatus: 200
}));

app.use(express.json());

// Database setup

const connection = await mysql.createConnection({
  host: process.env.MYSQL_HOSTNAME,
  port: process.env.MYSQL_PORT,
  user: process.env.MYSQL_USER,
  password: process.env.MYSQL_PASSWORD,
  database: process.env.MYSQL_DATABASE
});


// Routes


app.post('/signup', async (req, res) => {
    let userInfo = req.body;
    
    Object.keys(userInfo).forEach(key => {
        if(userInfo[key].length==0) userInfo[key] = null;
    });

    switch(userInfo.type){
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
            return res.status(400).json({msg: "wrong user type"});
    }

    try {
        const [row, fields] = await connection.execute(
            'INSERT INTO user (user_type_id, name, surname, email, password, birth_date, school, grade_branch) VALUES (?,?,?,?,?,?,?,?)',
            [userInfo.type,userInfo.name,userInfo.surname,userInfo.email,userInfo.password,userInfo.birthDate,userInfo.school,userInfo.gradeBranch]
          );   
    } catch (error) {
        return res.status(400).json({msg: error.code});
    }
    
    res.status(200).json({msg:"user is created"});
})

app.listen(process.env.PORT);