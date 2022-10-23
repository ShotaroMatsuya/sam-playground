const AWS = require('aws-sdk');

const TODO_TABLE = process.env.TODO_TABLE;
const dynamoDb = new AWS.DynamoDB.DocumentClient();

exports.listTodos = async (event, context) => {
  let body;
  let statusCode = 200;
  const headers = {
    'Content-Type': 'application/json',
  };
  const params = {
    TableName: TODO_TABLE,
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
