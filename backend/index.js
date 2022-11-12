import express from 'express';
import cors from 'cors';
import path from 'path';
import { fileURLToPath } from 'url';
import * as dotenv from 'dotenv';
import { stringify } from 'querystring';

// Setup dotenv (enviorement variables)
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
dotenv.config({ path: path.join(__dirname, `.env.${process.env.NODE_ENV}`) });

const app = express();

app.use(cors({
    optionsSuccessStatus: 200
}));

app.use(express.json());

app.post('/signup', (req, res) => {
    console.log(req.body);
    res.status(200).json({msg:"all is ok"});
})

app.listen(process.env.PORT);