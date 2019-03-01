'use strict';

const Raven = require("raven"); // Official `raven` module
const RavenLambdaWrapper = require("serverless-sentry-lib"); // This helper library

const fetch = require('node-fetch');
const AWS = require('aws-sdk'); // eslint-disable-line import/no-extraneous-dependencies

const s3 = new AWS.S3();

function randomString() {
   return Math.random().toString(36).substring(2, 15) + Math.random().toString(36).substring(2, 15);
}

var Lob = require('lob')(process.env.LOB_API_KEY);


module.exports.sendCard = (event, context, callback) => {
  const querystring = require('querystring');
  const params = querystring.parse(event.body)
  const key = randomString() + '.png';

  function sendResponse(err, res) {
     var statusCode = 200;
      if (err != null) {
        statusCode = 500;
      }

      const response = {
        statusCode: statusCode,
        headers: {
          'Access-Control-Allow-Origin': '*',
          'Access-Control-Allow-Credentials': true,
        },
        body: JSON.stringify({
          err: err,
          res: res
        }),
      };
      callback(null, response);
  }

  function uploadCard() {
    const front = 'https://s3.amazonaws.com/purpose-store/' + key;
    console.log(front);

    var back = 'tmpl_f0fafc696ebcbc9';
    console.log(process.env.ENV)
    if (process.env.ENV == 'prod') {
      back = 'tmpl_ce36d157166293d';
    }

    Lob.postcards.create({
      description: 'Demo Postcard job',
      to: {
        name: 'David Blackman',
        address_line1: '52 Ten Eyck St',
        address_line2: 'Apt 3B',
        address_city: 'Brooklyn',
        address_state: 'NY',
        address_zip: '11206'
      },
      from: null,
      back: back,
      front: front,
      merge_variables: {
        greeting: params.greeting,
        opening: params.opening,
        closing: params.closing,
        name: params.name,
        message: params.message.replace('\n', '<br>'),

      }
    }, function (err, res) {
      sendResponse(err, res)
    });
  }

  var decoded_image_data = new Buffer(params.image_data.split('base64,')[1], 'base64')

  s3.putObject({
    Bucket: process.env.BUCKET,
    Key: key,
    Body: decoded_image_data,
    ContentType: 'image/png'
  }).promise().then(uploadCard)

};

module.exports.helloWorld = (event, context, callback) => {
  const response = {
    statusCode: 200,
    headers: {
      'Access-Control-Allow-Origin': '*', // Required for CORS support to work
    },
    body: JSON.stringify({
      message: 'Go Serverless v1.0! Your function executed successfully!',
      input: event,
    }),
  };

  callback(null, response);
};
