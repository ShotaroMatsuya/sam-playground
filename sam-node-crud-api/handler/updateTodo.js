const AWS = require('aws-sdk');
const TODO_TABLE = process.env.TODO_TABLE;
const dynamoDb = new AWS.DynamoDB.DocumentClient();

exports.updateTodo = async (event, context) => {
  const datetime = new Date().toISOString();
  const data = JSON.parse(event.body);

  let body;
  let statusCode = 200;
  const headers = {
    'Content-Type': 'application/json',
  };
  console.log('Data::', data);
  if (typeof data.todo !== 'string' || typeof data.checked !== 'boolean') {
    console.error('Value of todo or done is invalid');
    return;
  }

  const params = {
    TableName: TODO_TABLE,
    Key: {
      id: event.pathParameters.id,
    },
    ExpressionAttributeNames: {
      '#todo_text': 'todo',
    },
    ExpressionAttributeValues: {
      ':todo': data.todo,
      ':checked': data.checked,
      ':updatedAt': datetime,
    },
    UpdateExpression:
      'SET #todo_text = :todo, checked = :checked, updatedAt = :updatedAt',
    ReturnValues: 'ALL_NEW',
  };

  try {
    body = await dynamoDb.update(params).promise();
  } catch (error) {
    statusCode = 400;
    body = err.message;
    console.log(err);
  } finally {
    body = JSON.stringify(body.Attributes);
  }

  return {
    statusCode,
    body,
    headers,
  };
};
// module.exports.updateTodo = (event, context, callback) => {
//   const datetime = new Date().toISOString();
//   const data = JSON.parse(event.body);

//   if (typeof data.todo !== "string" || typeof data.checked !== "boolean") {
//     console.error("Value of todo or done is invalide");
//     return;
//   }

//   const params = {
//     TableName: TODO_TABLE,
//     Key: {
//       id: event.pathParameters.id,
//     },
//     ExpressionAttributeNames: {
//       "#todo_text": "todo",
//     },
//     ExpressionAttributeValues: {
//       ":todo": data.todo,
//       ":checked": data.checked,
//       ":updatedAt": datetime,
//     },
//     UpdateExpression:
//       "SET #todo_text = :todo, checked = :checked, updatedAt = :updatedAt",
//     ReturnValues: "ALL_NEW",
//   };

//   dynamoDb.update(params, (error, data) => {
//     if (error) {
//       console.error(error);
//       callback(new Error(error));
//       return;
//     }
//     const response = {
//       statusCode: 200,
//       body: JSON.stringify(data.Attributes),
//     };
//     callback(null, response);
//   });
// };
