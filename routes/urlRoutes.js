const express = require('express');
const router = express.Router();
const urlController = require('../controllers/urlController');
const authenticateToken = require('../middleware/authenticateToken');

router.post('/create-url', authenticateToken,urlController.createUrl);

router.get('/url-list', urlController.getUrlList);

router.get('/user-url-list', authenticateToken, urlController.userGetUrlList);

// Add the new route for updating copy counts
router.post('/copy-count', urlController.updateCopyCount);

router.get('/chart', urlController.getChartData);

router.get('/user-charts',  authenticateToken,urlController.getChartForUser);

router.get('/dashboard', urlController.getDashboardData);

router.delete('/urls/:id', urlController.deleteUrl);

module.exports = router;





// const express = require('express');
// const router = express.Router();
// const urlController = require('../controllers/urlController');
// const authenticateTokenAndAuthorize = require('../middleware/authenticateTokenAndAuthorize'); // Import the RBAC middleware

// router.post('/create-url', authenticateTokenAndAuthorize('Create'), urlController.createUrl);

// router.get('/url-list', authenticateTokenAndAuthorize('Read'), urlController.getUrlList);

// router.post('/update-click-count/:urlId', authenticateTokenAndAuthorize('Update'), urlController.updateClickCount);

// router.get('/chart', authenticateTokenAndAuthorize('Read'), urlController.getChartData);

// router.get('/dashboard', authenticateTokenAndAuthorize('Manage'), urlController.getDashboardData);

// router.delete('/urls/:id', authenticateTokenAndAuthorize('Delete'), urlController.deleteUrl);

// module.exports = router;
