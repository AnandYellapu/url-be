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

    if (!validUrl.isWebUri(longURL)) {
      return res.status(400).json({ message: 'Invalid URL' });
    }

    const shortURL = await shorten(longURL);

    const urlObj = parse(longURL);
    const domain = urlObj.hostname;

    const currentDate = new Date();

    const url = new Url({ longURL, shortURL, createdAt: currentDate });
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

const updateClickCount = async (req, res) => {
  const { id } = req.params;
  try {
    // Use the `URL` model to find the document by id and update the click count
    const url = await Url.findById(id);
    if (!url) {
      return res.status(404).json({ message: 'URL not found' });
    }

    url.clickCount++;
    await url.save();

    return res.status(200).json({ message: 'Click count updated successfully' });
  } catch (error) {
    console.error(error);
    return res.status(500).json({ message: 'Internal server error' });
  }
};

const getDashboardData = async (req, res) => {
  try {
    const totalURLs = await Url.countDocuments();
    const totalClicks = await Url.aggregate([{ $group: { _id: null, clicks: { $sum: "$clicks" } } }]);
    const uniqueDomains = await Url.distinct("domain");

    res.status(200).json({ totalURLs, totalClicks: totalClicks[0].clicks, uniqueDomains });
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


const deleteUrl = async (req, res) => {
  const { id } = req.params;
  try {
    // Use the `Url` model to find the document by id and delete it
    const url = await Url.findById(id);
    if (!url) {
      return res.status(404).json({ message: 'URL not found' });
    }

    await url.remove();

    return res.status(200).json({ message: 'URL deleted successfully' });
  } catch (error) {
    console.error(error);
    return res.status(500).json({ message: 'Internal server error' });
  }
};


module.exports = {
  createUrl,
  getUrlList,
  updateClickCount,
  getDashboardData,
  getChartData,
  deleteUrl,
};
