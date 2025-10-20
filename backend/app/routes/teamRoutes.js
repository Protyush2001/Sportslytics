const express = require('express');
const router = express.Router();
const teamCtlr = require('../controllers/team-controller');
const authenticateUser = require('../middlewares/authenticateUser');

router.post('/', authenticateUser, teamCtlr.createTeam);


router.get('/', authenticateUser, teamCtlr.getTeams);



router.delete('/:id', authenticateUser, teamCtlr.deleteTeam);


router.patch('/:teamId/remove/:playerId', authenticateUser, teamCtlr.patchTeam);


router.post('/:teamId/add-players', authenticateUser, teamCtlr.addPlayersToTeam);


router.get('/points-table', authenticateUser, teamCtlr.getPointsTable);

router.get('/:id', authenticateUser, teamCtlr.getTeamsById);

module.exports = router;