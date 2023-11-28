const mongoose = require('mongoose');
const Url = require('../models/Url');
const parse = require('url-parse');
const validUrl = require('valid-url');
const axios = require('axios');


const shorten = async (url) => {
  try {
    const endpoint = 'https://api.rebrandly.com/v1/links';
    const linkRequest = {
      destination: url,
      domain: { fullName: 'rebrand.ly' },
    };

    const apiCall = {
      method: 'post',
      url: endpoint,
      data: linkRequest,
      headers: {
        'Content-Type': 'application/json',
        apikey: process.env.REBRANDLY_API_KEY,
        workspace: process.env.REBRANDLY_WORKSPACE_ID,
      },
    };

    const apiResponse = await axios(apiCall);
    const link = apiResponse.data;
    return link.shortUrl;
  } catch (error) {
    console.error(error);
    throw new Error('Failed to shorten URL');
  }
};

const createUrl = async (req, res) => {
  try {
    const { longURL } = req.body;
    console.log('req.userId:', req.userId); // Ensure userId is logged

    if (!validUrl.isWebUri(longURL)) {
      return res.status(400).json({ message: 'Invalid URL' });
    }

    const shortURL = await shorten(longURL);

    const urlObj = parse(longURL);
    const domain = urlObj.hostname;

    const currentDate = new Date();

    // Use req.userId directly
    const userId = req.userId;

    // Include userId when creating the URL
    const url = new Url({ longURL, shortURL, userId, createdAt: currentDate });
    await url.save();

    res.status(201).json({ shortURL });
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: 'Server Error' });
  }
};




const getUrlList = async (req, res) => {
  try {
    const urls = await Url.find();
    res.status(200).json(urls);
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: 'Server Error' });
  }
};





// UserUrlList

const userGetUrlList = async (req, res) => {
  try {
    // const userId = req.user.id; // Assuming user information is added to the request by your authentication middleware
    const userId = req.userId;
    console.log('userId', userId);
    // Fetch URLs for the specific user
    const urls = await Url.find({ userId });
    res.status(200).json(urls);
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: 'Server Error' });
  }
};





const updateCopyCount = async (req, res) => {
  try {
    const { urlId, copyCount } = req.body;

    // Assuming you have a field called `copyCount` in your Url model
    await Url.findByIdAndUpdate(urlId, { $set: { copyCount } });

    res.status(200).json({ message: 'Copy count updated successfully' });
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: 'Server Error' });
  }
};




// urlController.js
const getDashboardData = async (req, res) => {
  try {
    const totalURLs = await Url.countDocuments();
    
    const totalCopyCounts = await Url.aggregate([{ $group: { _id: null, copyCounts: { $sum: "$copyCount" } } }]);

    res.status(200).json({
      totalURLs,
      totalCopyCounts: totalCopyCounts[0].copyCounts, // Include the copy counts in the response
    });
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: 'Server Error' });
  }
};




const getChartData = async (req, res) => {
  try {
    const dailyURLs = await Url.aggregate([
      {
        $group: {
          _id: {
            date: { $dateToString: { format: '%Y-%m-%d', date: '$createdAt' } },
            time: { $dateToString: { format: '%H:%M:%S', date: '$createdAt' } }
          },
          count: { $sum: 1 },
        },
      },
      { $sort: { '_id.date': 1 } },
    ]);

    const monthlyURLs = await Url.aggregate([
      {
        $group: {
          _id: { $dateToString: { format: '%Y-%m', date: '$createdAt' } },
          count: { $sum: 1 },
        },
      },
      { $sort: { _id: 1 } },
    ]);

    res.status(200).json({ dailyURLs, monthlyURLs });
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: 'Server Error' });
  }
};




// url of particular users
const getChartForUser = async (req, res) => {
  try {
    const userId = req.userId;
    const userObjectId = new mongoose.Types.ObjectId(userId); // Use 'new' keyword here
    const dailyURLs = await Url.aggregate([
      {
        $match: { userId: userObjectId }, // Use the created userObjectId
      },
      {
        $group: {
          _id: { date: { $dateToString: { format: "%Y-%m-%d", date: "$createdAt" } } },
          count: { $sum: 1 },
        },
      },
    ]);

    const monthlyURLs = await Url.aggregate([
      {
        $match: { userId: userObjectId }, // Use the created userObjectId
      },
      {
        $group: {
          _id: { $dateToString: { format: "%Y-%m", date: "$createdAt" } },
          count: { $sum: 1 },
        },
      },
    ]);

    res.status(200).json({ dailyURLs, monthlyURLs });
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: 'Server Error' });
  }
};


const deleteUrl = async (req, res) => {
  const { id } = req.params;
  try {
    // Use the `Url` model to find the document by id and delete it
    const url = await Url.findByIdAndDelete(id);
    if (!url) {
      return res.status(404).json({ message: 'URL not found' });
    }

    return res.status(200).json({ message: 'URL deleted successfully' });
  } catch (error) {
    console.error(error);
    return res.status(500).json({ message: 'Internal server error' });
  }
};


module.exports = {
  createUrl,
  getUrlList,
  userGetUrlList,
  updateCopyCount,
  getDashboardData,
  getChartData,
  getChartForUser,
  deleteUrl,
};

