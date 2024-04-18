'use strict';

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
  var key = randomString();

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

    var back = 'tmpl_f0fafc696ebcbc9';
    if (process.env.ENV == 'prod') {
      back = 'tmpl_ce36d157166293d';
    }

    const args = {
      description: 'Demo Postcard job',
      to: {
        name: 'David Blackman',
        address_line1: '251 Vierwindenstraat',
        address_city: 'Amsterdam',
        address_state: 'North Holland',
        address_zip: '1013cw',
        address_country: "NL"
      },
      from: {
        name: 'David Blackman',
        address_line1: '52 ten eyck st',
        address_city: 'brooklyn',
        address_state: 'ny',
        address_zip: '11206',
        address_country: "US"
      },
      back: back,
      front: front,
      merge_variables: {
        greeting: params.greeting,
        opening: params.opening,
        closing: params.closing,
        name: params.name,
        message: params.message.replace('\n', '<br>'),

      }
    }

    Lob.postcards.create(args, function (err, res) {
      sendResponse(err, res)
    });
  }

  var image_data_parts = params.image_data.split(';base64,')
  var mime_type = image_data_parts[0].split(':')[1]
  var extension = mime_type.split('/')[1]
  key += '.' + extension
  var decoded_image_data = new Buffer(image_data_parts[1], 'base64')

  s3.putObject({
    Bucket: process.env.BUCKET,
    Key: key,
    Body: decoded_image_data,
    ContentType: mime_type
  }).promise()
    .then(uploadCard)
    .catch((error) => sendResponse(error, {}))

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
