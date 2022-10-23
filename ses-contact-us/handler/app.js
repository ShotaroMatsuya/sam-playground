'use strict';
const AWS = require('aws-sdk');
const ses = new AWS.SES();

module.exports.createContact = async (event, context) => {
  console.log('Received:::', event);
  const { to, from, subject, message } = JSON.parse(event.body);

  if (!to || !from || !subject || !message) {
    return {
      headers: {
        'Access-Control-Allow-Origin': '*', // Required for CORS support to work
        'Access-Control-Allow-Credentials': false, // Required for cookies, authorization headers with HTTPS
        'Content-Type': 'application/json',
      },
      statusCode: 400,
      body: JSON.stringify({ message: ' to or from... are not set properly!' }),
    };
  }
  const params = {
    Destination: {
      ToAddresses: [to],
    },
    Message: {
      Body: {
        Text: { Data: message },
      },
      Subject: { Data: subject },
    },
    Source: from,
  };
  try {
    await ses.sendEmail(params).promise();
    return {
      headers: {
        'Access-Control-Allow-Origin': '*', // Required for CORS support to work
        'Access-Control-Allow-Credentials': false, // Required for cookies, authorization headers with HTTPS
        'Content-Type': 'application/json',
      },
      statusCode: 200,
      body: JSON.stringify({
        message: 'email sent successfully!',
        success: true,
      }),
    };
  } catch (error) {
    console.error(error);
    return {
      headers: {
        'Access-Control-Allow-Origin': '*', // Required for CORS support to work
        'Access-Control-Allow-Credentials': false, // Required for cookies, authorization headers with HTTPS
        'Content-Type': 'application/json',
      },
      statusCode: 400,
      body: JSON.stringify({
        message: 'The email failed to send',
        success: true,
      }),
    };
  }
};
