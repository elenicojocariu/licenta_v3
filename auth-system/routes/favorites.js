const express = require('express');
const router = express.Router();
const favoritesController = require('../controllers/favoritesController');
const authMiddleware = require('../middleware/authMiddleware');

router.post('/addFavorite', authMiddleware.authenticate, favoritesController.addFavorite);
router.get('/getFavorites/:userId', authMiddleware.authenticate, favoritesController.getFavorites);
router.delete('/removeFavorite', authMiddleware.authenticate, favoritesController.removeFavorite);

module.exports = router;
