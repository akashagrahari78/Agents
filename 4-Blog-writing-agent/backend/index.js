const express = require('express');
const cors = require('cors');
const connectDb = require("./config/mongodb.js")

const app = express();
const port = process.env.PORT || 3000;
require("dotenv").config();

const authRouter = require('./routes/auth.js');
const blogsRouter = require('./routes/blogs.js');
const generateRouter = require('./routes/generate.js');




connectDb().catch((err) => {
  console.error('MongoDB connection error:', err.message || err);
  process.exit(1);
});

 app.get('/', (req, res) => {
  console.log('here server is running');
  res.send('server is running here');
});


// const allowedOrigins = [
//   'http://localhost:5173',
//   'http://localhost:3000',
//   process.env.FRONTEND_URL,
// ].filter(Boolean);
 

 
 

app.get('/api/health', (req, res) => {
  res.json({ status: 'ok', timestamp: new Date().toISOString() });
});


// middlewares
app.use(express.json({ limit: '50mb' }));
app.use(express.urlencoded({ extended: true, limit: '50mb' }));
app.use(cors({
  origin: [
    "https://blogwritingagent.vercel.app",
    "http://localhost:5173",
    "http://localhost:5174"
  ],
  credentials: true
}));


app.use('/api/auth', authRouter);
app.use('/api/generate', generateRouter);
app.use('/api/blogs', blogsRouter);

app.listen(port, () => {
  console.log(`Server running on port ${port}`);
});
