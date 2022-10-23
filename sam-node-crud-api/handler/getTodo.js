const AWS = require('aws-sdk');
const TODO_TABLE = process.env.TODO_TABLE;
const dynamoDb = new AWS.DynamoDB.DocumentClient();

exports.getTodo = async (event, context) => {
  let body;
  let statusCode = 200;
  const headers = {
    'Content-Type': 'application/json',
  };

  const params = {
    TableName: TODO_TABLE,
    Key: {
      id: event.pathParameters.id,
    },
  };
  try {
    body = await dynamoDb.get(params).promise();
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

// module.exports.getTodo = (event, context, callback) => {
//   const params = {
//     TableName: TODO_TABLE,
//     Key: {
//       id: event.pathParameters.id,
//     },
//   };

//   dynamoDb.get(params, (error, data) => {
//     if (error) {
//       console.error(error);
//       callback(new Error(error));
//       return;
//     }

//     const response = data.Item
//       ? {
//           statusCode: 200,
//           body: JSON.stringify(data.Item),
//         }
//       : {
//           statusCode: 404,
//           body: JSON.stringify({ message: "Todo not found" }),
//         };
//     callback(null, response);
//   });
// };
