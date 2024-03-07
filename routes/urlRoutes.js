const express = require('express');
const router = express.Router();
const urlController = require('../controllers/urlController');
const authenticateToken = require('../middleware/authenticateToken');

// create url for user and admin also
router.post('/create-url', authenticateToken,urlController.createUrl);

// get url list of all
router.get('/url-list', urlController.getUrlList);

// get url list of user only
router.get('/user-url-list', authenticateToken, urlController.userGetUrlList);

// Add the new route for updating copy counts
router.post('/copy-count', urlController.updateCopyCount);

// get charts of all
router.get('/chart', urlController.getChartData);

// get charts of user only
router.get('/user-charts',  authenticateToken,urlController.getChartForUser);

// admin only
router.get('/dashboard', urlController.getDashboardData);

// delete byId for user only
router.delete('/urls/:id', urlController.deleteUrl);


// admin only - delete URLs in bulk
router.delete('/bulk', urlController.deleteBulkUrls);

// admin only - delete all URLs
router.delete('/all', urlController.deleteAllUrls);


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

