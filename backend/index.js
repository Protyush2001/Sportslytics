

const express = require('express');
const cors = require('cors');
const http = require('http');
const { Server } = require('socket.io');
require('dotenv').config();
const multer = require('multer');
const path = require('path');
const fs = require('fs');
const { v4: uuidv4 } = require('uuid');

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
const customMatch = require('./app/models/customMatch-model');
const reviewCtlr = require('./app/controllers/reviewController');

const app = express();
const server = http.createServer(app);
const uploadsDir = path.join(__dirname, 'uploads/Recordings/');
if (!fs.existsSync(uploadsDir)) {
  fs.mkdirSync(uploadsDir, { recursive: true });
  console.log('Created uploads/recordings directory');
}


const storage = multer.diskStorage({
  destination: function (req, file, cb) {
    cb(null, uploadsDir)
  },
  filename: function (req, file, cb) {
    const uniqueName = `recording_${Date.now()}_${uuidv4()}.webm`;
    cb(null, uniqueName);
  }
});

const upload = multer({ 
  storage: storage,
  limits: {
    fileSize: 500 * 1024 * 1024, 
  },
  fileFilter: (req, file, cb) => {
    if (file.mimetype.startsWith('video/')) {
      cb(null, true);
    } else {
      cb(new Error('Only video files are allowed!'), false);
    }
  }
});


const io = new Server(server, {
  cors: {
    origin: [
      '*'
    ],
    methods: ["GET", "POST", "PATCH", "PUT", "DELETE"],
  },
  transports: ["polling", "websocket"],
  pingTimeout: 60000,
  pingInterval: 25000,
  maxHttpBufferSize: 1e6,
});

const port = process.env.PORT || 3000;


app.use(cors({ origin: "*" }));
app.use(express.json());
configDB();


io.on('connection', (socket) => {
  console.log(' Socket connected:', socket.id);


  socket.on('join_match', (matchId) => {
    socket.join(`match_${matchId}`);
    console.log(`Socket ${socket.id} joined room match_${matchId}`);
  });

  socket.on('leave_match', (matchId) => {
    socket.leave(`match_${matchId}`);
    console.log(` Socket ${socket.id} left room match_${matchId}`);
  });


  socket.on('offer', ({ to, sdp }) => {
    socket.to(to).emit('offer', { from: socket.id, sdp });
  });

  socket.on('answer', ({ to, sdp }) => {
    socket.to(to).emit('answer', { from: socket.id, sdp });
  });

  socket.on('ice-candidate', ({ to, candidate }) => {
    socket.to(to).emit('ice-candidate', { from: socket.id, candidate });
  });

  socket.on('stream-ended', (data) => {
    socket.to(`match_${data.matchId}`).emit('stream-ended', data);
  });


  socket.on('sendCommentary', ({ matchId, commentary }) => {
    console.log(` Commentary for match ${matchId}: ${commentary}`);
    io.to(`match_${matchId}`).emit('receiveCommentary', commentary);
  });

 
  socket.on('updateScore', (scoreData) => {
    io.emit('scoreUpdated', scoreData);
  });

  socket.on('disconnect', () => {
    console.log(' Socket disconnected:', socket.id);
  });
});

registerChatbotHandlers(io);


app.use('/admin', adminRoutes);

app.post('/register', userController.register);
app.post('/login', userController.login);
app.get('/admin/pending-users', authenticateUser, userController.getPendingUsers);
app.patch('/admin/approve-user/:userId', authenticateUser, userController.approveUser);
app.patch('/admin/reject-user/:userId', authenticateUser, userController.rejectUser);


app.post('/matches', authenticateUser, customMatchController.createMatches);
app.get('/getAllMatches', customMatchController.getAllMatches);
app.patch('/matches/:id/ball', customMatchController.updateBall);



app.post('/api/matches/:matchId/uploadRecording', 
  authenticateUser, 
  upload.single('recording'), 
  customMatchController.uploadRecording
);


app.get('/api/matches/:matchId/commentary', async (req, res) => {
  try {
    const match = await customMatch.findById(req.params.matchId)
      .select('commentary')
      .sort({ 'commentary.timestamp': -1 })
      .limit(100); // Last 100 balls
    
    if (!match) {
      return res.status(404).json({ msg: 'Match not found' });
    }
    
    res.json(match.commentary || []);
  } catch (error) {
    console.error('Error fetching commentary:', error);
    res.status(500).json({ msg: 'Error fetching commentary' });
  }
});


app.post('/api/matches/:matchId/start-stream', authenticateUser, customMatchController.startStream);
app.post('/api/matches/:matchId/stop-stream', authenticateUser, customMatchController.stopStream);
app.post('/api/matches/:matchId/matchResult',authenticateUser,customMatchController.updateMatchResult)


app.use('/api/predictions', predictionRoutes);

app.use('/api/players', playerRoutes);
app.use('/api/teams', teamRoutes);


app.use('/api/payment', paymentRoute);


app.use('/uploads', express.static('uploads'));

app.post('/api/reviews', authenticateUser, reviewCtlr.createReview);


app.get('/health', (req, res) => {
  res.json({
    status: 'OK',
    timestamp: new Date().toISOString(),
    socketConnections: io.engine.clientsCount
  });
});

app.get('/socket-health', (req, res) => {
  res.json({
    status: 'OK',
    connectedClients: io.engine.clientsCount,
    transports: ['polling', 'websocket'],
    timestamp: new Date().toISOString()
  });
});


server.listen(port, () => {
  console.log(` Server running on port ${port}`);
  console.log(`Socket.IO active at http://localhost:${port}/socket.io/`);
});
