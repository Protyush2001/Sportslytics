const express = require('express');
const router = express.Router();
const customMatchController = require('../controllers/customMatch-controller');
const authenticateUser = require('../middlewares/authenticateUser');


router.use(authenticateUser);

router.post('/', customMatchController.createMatches);


router.get('/', customMatchController.getAllMatches);


router.get('/:id', customMatchController.getMatch);


router.put('/:id/update-ball', customMatchController.updateBall);


router.delete('/:id', customMatchController.deleteMatch);


router.post('/:matchId/stream/start', customMatchController.startStream);


router.post('/:matchId/stream/stop', customMatchController.stopStream);


router.post(
  '/:matchId/recording/upload',
  customMatchController.uploadMiddleware.single('video'),
  customMatchController.uploadRecording
);

router.put('/:matchId/recording/status', customMatchController.updateRecordingStatus);

router.post('/:matchId/prediction', customMatchController.generatePrediction);


router.put('/:matchId/result', customMatchController.updateMatchResult);

module.exports = router;