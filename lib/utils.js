/**
 * @description Utility tools to help with various tasks
 * @author Dororo_
 */

// dependencies
const crypto = require('crypto');
const querystring = require('querystring');
const https = require('https');
const config = require('./config');

// container for module
var utils = {};

/**
 * @description takes a string variable and returns a SHA256 hash
 * @param {string} string - the string to hash
 */
utils.hash = str => {
    if (typeof (str) == 'string' && str.length > 0) {
        return crypto.createHmac('sha256', config.hashingSecret).update(str).digest('hex');
    } else {
        return false;
    }
};

/**
 * @description This util makes sure the passed json is valid for parsing
 * @returns parsed json into object, otherwise an empty object
 * @param {string} str - string to verify
 */
utils.parseJsonToObject = str => {
    try {
        return JSON.parse(str);
    } catch {
        return {};
    }
};

/**
 * @description generates a random string of a given length
 * @param {number} length - length of the string
 */
utils.stringGenerator = length => {
    if (typeof (length) == 'number' && length > 0) {
        var chars = 'abcdefghijklmnopqrstuvwxyz123456789';
        var str = '';
        for (var i = 0; i < length; i++) {
            // get random from ${chars} and append to ${str}
            str += chars.charAt(Math.floor(Math.random() * chars.length));
        }
        return str;
    } else {
        return false;
    }
}


/**
 * @descriptoin allows you to send an sms message to a certain phone number
 * @param {string} phone - phone number to send message to
 * @param {string} message - the message (content of the message)
 * @param {} callback - data returned
 * 
 * @TODO this function isn't really working, gotta update from the docs
 */
utils.sendTwilioSms = (phone, message, callback) => {
    // validate the paramaters
    var phone = typeof (phone) == 'string' && phone.trim().length == 10 ? phone.trim() : false;
    var message = typeof (message) == 'string' && message.trim().length > 0 && message.trim().length < 1600 ? message.trim() : false;

    if (phone && message) {
        // configure the request payload
        var payload = {
            'From': config.twilio.phone,
            'To': '+8' + phone,
            'Body': message
        };

        // bulid the request and send it
        var request = https.request({
            'protocol': 'https:',
            'hostname': 'api.twilio.com',
            'method': 'POST',
            'path': `/2010-04-01/Accounts/${config.twilio.accountSid}/Messages.json`,
            'auth': `${config.twilio.accountSid}:${config.twilio.authToken}`,
            'headers': {
                'Content-Type': 'application/x-www-form-urlencoded',
                'Content-Length': Buffer.byteLength(querystring.stringify(payload))
            }
        }, res => {
            // check if request is success
            if([200, 201].indexOf(res.statusCode) > -1) {
                callback(false);
            } else {
                callback('status code: ' + res.statusCode);
            }
        });
        
        // bind to error event
        request.on('error', err => {
            callback(err);
        });

        // add body and send
        request.write(querystring.stringify(payload));
        request.end();

    } else {
        callback('bad paramters');
    }
};

// export the module
module.exports = utils;