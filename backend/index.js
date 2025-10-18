

const express = require('express');
const cors = require('cors');
const http = require('http');
const { Server } = require('socket.io');
require('dotenv').config();

const configDB = require('./config/db');
const userController = require('./app/controllers/user-controller');
const authenticateUser = require('./app/middlewares/authenticateUser');
const playerRoutes = require('./app/routes/playerRoutes');
const teamRoutes = require('./app/routes/teamRoutes');
const adminRoutes = require('./app/routes/adminRoutes');
const customMatchController = require('./app/controllers/matchController');
const predictionRoutes = require('./app/routes/predictionRoutes');
const paymentRoute = require('./app/routes/paymentRoute');
const registerChatbotHandlers = require("./app/chatbot/chatbotSocket"); 
const app = express();
const server = http.createServer(app); 
const io = new Server(server, {
  cors: {
    origin: '*', 
    methods: ['GET', 'POST','PATCH','DELETE','PUT']
  }
});

const port = process.env.PORT || 3000;

app.use(cors({
    origin: "*", 
}))

app.use(express.json());
configDB();

registerChatbotHandlers(io);

// Socket.io connection for live matches
io.on('connection', (socket) => {
  console.log('Socket connected:', socket.id);

  // Example: broadcast live commentary
  socket.on('sendCommentary', (data) => {
    io.emit('receiveCommentary', data);
  });

  // Example: live score update
  socket.on('updateScore', (scoreData) => {
    io.emit('scoreUpdated', scoreData);
  });

  socket.on('disconnect', () => {
    console.log('Socket disconnected:', socket.id);
  });
});

// admin routes --
app.use('/admin', adminRoutes);

// User routes
app.post('/register', userController.register);
app.post('/login', userController.login);
// app.get('/users/account', authenticateUser, userController.account);

// Match routes
app.post('/matches', authenticateUser, customMatchController.createMatches);
app.get('/getAllMatches', customMatchController.getAllMatches);
app.patch('/matches/:id/ball', customMatchController.updateBall);

// Prediction routes
app.use('/api/predictions', predictionRoutes);

// Player and team routes
app.use('/api/players', playerRoutes);
app.use('/api/teams', teamRoutes);
app.use('/api/payment', paymentRoute);

app.use('/uploads', express.static('uploads'));

// Start server
server.listen(port, () => {
  console.log(`Server running on port ${port}`);
});