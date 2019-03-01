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
  const key = randomString() + '.png';

  function uploadCard() {
    const front = 'https://s3.amazonaws.com/purpose-store/' + key;
    console.log(front);

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
      back: 'tmpl_f0fafc696ebcbc9',
      front: front,
      merge_variables: {
        greeting: params.greeting,
        opening: params.opening,
        closing: params.closing,
        name: params.name,
        message: params.message.replace('\n', '<br>'),

      }
    }, function (err, res) {
      console.log(err, res);
    });
  }

  var decoded_image_data = new Buffer(params.image_data.split('base64,')[1], 'base64')

  s3.putObject({
    Bucket: process.env.BUCKET,
    Key: key,
    Body: decoded_image_data,
    ContentType: 'image/png'
  }).promise().then(uploadCard)

  const response = {
    statusCode: 200,
    headers: {
      'Access-Control-Allow-Origin': '*',
      'Access-Control-Allow-Credentials': true,
    },
    body: JSON.stringify({
      product: 'hi'
    }),
  };
  callback(null, response);
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
