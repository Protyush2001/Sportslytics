const express = require('express');
const router = express.Router();
const customMatchController = require('../controllers/customMatch-controller');
const authenticateUser = require('../middlewares/authenticateUser');

// Middleware to validate authentication on all routes
router.use(authenticateUser);

// CREATE MATCH
// POST /api/custom-matches
// Creates a new custom match
// Allowed roles: admin, team_owner, player
router.post('/', customMatchController.createMatches);

// GET ALL MATCHES
// GET /api/custom-matches
// Retrieves all matches sorted by creation date (newest first)
router.get('/', customMatchController.getAllMatches);

// GET SINGLE MATCH
// GET /api/custom-matches/:id
// Retrieves a specific match by ID
router.get('/:id', customMatchController.getMatch);

// UPDATE BALL
// PUT /api/custom-matches/:id/update-ball
// Updates match score with ball-by-ball data
// Body: { runs, isWicket, strikerId, nonStrikerId, bowlerId, extras }
router.put('/:id/update-ball', customMatchController.updateBall);

// DELETE MATCH
// DELETE /api/custom-matches/:id
// Deletes a match and associated data
router.delete('/:id', customMatchController.deleteMatch);

// STREAMING ROUTES

// START STREAM
// POST /api/custom-matches/:matchId/stream/start
// Initiates a live stream and recording for a match
// Only authorized by match creator
router.post('/:matchId/stream/start', customMatchController.startStream);

// STOP STREAM
// POST /api/custom-matches/:matchId/stream/stop
// Stops the active stream and updates recording status
// Body: { recordingUrl } (optional)
// Only authorized by match creator
router.post('/:matchId/stream/stop', customMatchController.stopStream);

// UPLOAD RECORDING
// POST /api/custom-matches/:matchId/recording/upload
// Uploads video recording to ImageKit and processes for streaming
// Requires file upload via multipart/form-data
// Body: { recordingId } (optional)
// Only authorized by match creator
router.post(
  '/:matchId/recording/upload',
  customMatchController.uploadMiddleware.single('video'),
  customMatchController.uploadRecording
);

// UPDATE RECORDING STATUS
// PUT /api/custom-matches/:matchId/recording/status
// Updates the status of a recording (pending, processing, completed, failed)
// Body: { recordingId, status, recordingUrl, fileSize, mimeType, duration, errorMessage, uploadProgress }
// Only authorized by match creator
router.put('/:matchId/recording/status', customMatchController.updateRecordingStatus);

// PREDICTION ROUTES

// GENERATE MATCH PREDICTION
// POST /api/custom-matches/:matchId/prediction
// Generates AI prediction for the match
// Body: { predictionType } (optional)
// Requires aiEnabled flag on match
router.post('/:matchId/prediction', customMatchController.generatePrediction);

// MATCH RESULT ROUTES

// UPDATE MATCH RESULT
// PUT /api/custom-matches/:matchId/result
// Finalizes match result and updates team statistics
// Body: { winnerTeamName }
// Only authorized by match creator
router.put('/:matchId/result', customMatchController.updateMatchResult);

module.exports = router;