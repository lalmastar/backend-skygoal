require('./config/dbConnect');
const express = require("express");
const cookieParser = require('cookie-parser')
const authRoute = require('./routes/authRoute');
const dbConnect = require('./config/dbConnect');
const bodyParser = require('body-parser');
const morgan = require('morgan');
const corsOptions = require('./config/corsOptions');
const cors = require("cors");

const app = express();
const dotenv = require('dotenv').config();

const PORT = process.env.PORT || 4000;

dbConnect();
app.use(cors({
    // origin: corsOptions,
    // origin: 'http://localhost:3000',
    origin: 'https://majestic-cuchufli-b5d0ef.netlify.app',
    optionsSuccessStatus:200,
    methods: ['GET', 'POST', 'PUT', 'PATCH', 'DELETE'],
    allowedHeaders: ['X-PINGOTHER', 'Content-Type',"Authorization","Origin", 'HEAD', 'OPTIONS',"Accept","Cache-Control",'Cookie','X-Requested-With'],
    credentials: true
}))
app.use(morgan('dev'))
app.use(bodyParser.json());
app.use(bodyParser.urlencoded({ extended: false }));
app.use(cookieParser());

app.get('/', (req, res) => {
    res.send("Home Page")
})


app.use("/api/user", authRoute);

app.listen(PORT, ()=>{
    console.log(`Server running on port ${PORT}`);
})
