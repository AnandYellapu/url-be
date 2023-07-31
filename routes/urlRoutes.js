const express = require('express');
const router = express.Router();
const urlController = require('../controllers/urlController');

router.post('/create-url', urlController.createUrl);

router.get('/url-list', urlController.getUrlList);

// router.get('/urls/:shortURL', urlController.updateClickCount);

router.post('/update-click-count/:urlId', urlController.updateClickCount);

router.get('/chart', urlController.getChartData);

router.get('/dashboard', urlController.getDashboardData);

router.delete('/urls/:id', urlController.deleteUrl);

module.exports = router;
