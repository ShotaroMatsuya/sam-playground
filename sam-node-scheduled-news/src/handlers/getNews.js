const AWS = require('aws-sdk');
AWS.config.update({ region: process.env.REGION });
const news_api_key = process.env.API_KEY;
const Response = require('./common/API_Responses');

const NEWS_TABLE = process.env.DYNAMODB_TABLE;
const dynamoDb = new AWS.DynamoDB.DocumentClient();
const uuid = require('uuid');

const Comprehend = new AWS.Comprehend();

// import fetch from "node-fetch";
const axios = require('axios');
const url_top_business =
  'https://newsapi.org/v2/top-headlines?country=us&category=business&apiKey=' +
  news_api_key;
exports.getNews = async (event, context) => {
  let body;
  let statusCode = 200;
  const headers = {
    'Content-Type': 'application/json',
  };
  const news = await getData();

  //wipe table first
  await deleteNews();

  var timestamp;
  var newsHeadline;
  var newsSentiment;
  var description;
  var newsUrl;
  var content;

  for (const item of news.articles.slice(0, 10)) {
    //console.log(item);
    // const senti = getSentiment("what the hell is this thing here?");
    newsHeadline = item['title'];
    description = item['description'];
    newsUrl = item['url'];
    content = item['content'];
    timestamp = item['publishedAt'];
    newsSentiment = await getSentiment(newsHeadline);
    console.log('PAY::', JSON.parse(newsSentiment.body).sentiment);

    //Insert to DB
    await insertToDynamo(
      JSON.parse(newsSentiment.body).sentiment.Sentiment,
      newsHeadline,
      timestamp,
      description,
      newsUrl,
      content
    );
  }

  const params = {
    TableName: NEWS_TABLE,
  };
  try {
    body = await dynamoDb.scan(params).promise();
  } catch (error) {
    statusCode = 400;
    body = err.message;
    console.log(err);
  } finally {
    body = JSON.stringify(body);
  }

  return {
    statusCode,
    body,
    headers,
  };
};
const deleteNews = async () => {
  console.log('Deleting........');
  let body;
  let statusCode = 200;
  const headers = {
    'Content-Type': 'application/json',
  };
  const params = {
    TableName: NEWS_TABLE,
  };
  try {
    body = await dynamoDb.scan(params).promise();
    if (body.Items != null) {
      for (const row of body.Items) {
        var sentiment = row.sentiment;
        var timestamp = row.timestamp;
        dynamoDb.delete({
          TableName: NEWS_TABLE,
          Key: {
            sentiment: sentiment,
            timestamp: timestamp,
            //   id: event.pathParameters.id,
          },
        });
      }
    }
  } catch (error) {
    statusCode = 400;
    body = err.message;
    console.log(err);
  } finally {
    body = `Deleted all news!!`;
  }

  return {
    statusCode,
    body,
    headers,
  };
};

const getSentiment = async newsTitle => {
  const params = {
    LanguageCode: 'en',
    TextList: [newsTitle],
  };
  //console.log("Params:::", params);

  try {
    const entityResults = await Comprehend.batchDetectEntities(
      params
    ).promise();
    const entities = entityResults.ResultList[0];

    const sentimentResults = await Comprehend.batchDetectSentiment(
      params
    ).promise();
    const sentiment = sentimentResults.ResultList[0];

    const responseData = {
      entities,
      sentiment,
    };
    // console.log("RES:::", JSON.stringify(responseData));

    return Response._200(responseData);
  } catch (error) {
    console.log('error', error);
    return Response._400({ message: 'failed to work with comprehend' });
  }
};
const insertToDynamo = async (
  sentiment,
  newsHeadline,
  timestamp,
  description,
  newsUrl,
  content
) => {
  //const timestamp = new Date().getTime();

  let body;
  let statusCode = 200;
  const headers = {
    'Content-Type': 'application/json',
  };

  const params = {
    TableName: NEWS_TABLE,
    Item: {
      id: uuid.v4(),
      sentiment: sentiment,
      title: newsHeadline,
      timestamp: timestamp,
      description: description,
      newsUrl: newsUrl,
      content: content,
    },
  };

  try {
    body = await dynamoDb.put(params).promise();
  } catch (err) {
    statusCode = 400;
    body = err.message;
    console.log(err);
  } finally {
    body = JSON.stringify(body);
  }

  return {
    statusCode,
    body,
    headers,
  };
};
const getData = async () => {
  const news = await axios.get(url_top_business);

  console.log(news);
  return news.data;
};
