/**
 * the main API file
 * @author Dororo_
 * @desc main module that runs the API
 */

// Dependencies
const http = require('http');
const https = require('https');
const url = require('url');
const StringDecoder = require('string_decoder').StringDecoder;
const fs = require('fs');
const config = require('./lib/config');
const handlers = require('./lib/handlers');
const utils = require('./lib/utils');

// create the http server and listen on the according port
var httpServer = http.createServer((req, res) => webHandler(req, res));
httpServer.listen(config.httpPort, () => console.log(`running a ${config.envName} server on port ${config.httpPort}...`));

// create the https server and proivde required info, listen to according port
var httpsServerOptions = {
    'key': fs.readFileSync('./https/key.pem'),
    'cert': fs.readFileSync('./https/cert.pem')
};

var httpsServer = https.createServer(httpsServerOptions, (req, res) => webHandler(req, res));
httpsServer.listen(config.httpsPort, () => console.log(`running a ${config.envName} server on port ${config.httpsPort}...`));

// Request handler for servers
var webHandler = (req, res) => {

    // get the parsed url
    var parsedUrl = url.parse(req.url, true);

    // extract path from url
    var path = parsedUrl.pathname
    var trimmedPath = path.replace(/^\/+|\/+$/g, '');

    // store the query string object
    var queryStringObject = parsedUrl.query;

    // get the headers
    var headers = req.headers;

    // get the method
    var method = req.method;

    /**
     * the url body comes in as a stream so we have to keep listening to a certain event (data) and collect the chunks of data
     * we initilise a buffer to collect data and then decode the full payload into a readable (utf-8)
     */
    var decoder = new StringDecoder('utf-8');
    var buffer = '';

    req.on('data', data => buffer += decoder.write(data));

    // we write the respond once the payload is done streaming
    req.on('end', () => {
        buffer += decoder.end();

        // decide upon an approprite handler
        var handler = typeof (router[trimmedPath]) !== 'undefined' ? router[trimmedPath] : handlers.notFound;

        // construct data object
        var data = {
            'trimmedPath': trimmedPath,
            'queryStringObject': queryStringObject,
            'method': method.toLowerCase(),
            'headers': headers,
            'payload': utils.parseJsonToObject(buffer)
        };
    
        handler(data, (statusCode, payload) => {
            // default status code and payload to 200 and empty object if not valid
            var statusCode = typeof (statusCode) == 'number' ? statusCode : 200;
            var payload = typeof (payload) == 'object' ? payload : {};

            // stringify the body to send it to the user
            var payloadString = JSON.stringify(payload);

            // return a response
            res.setHeader('content-type', 'application/json');
            res.writeHead(statusCode);
            res.end(payloadString);

            // handle logging 
            console.log(`\nRequest: ${data.method} /${data.trimmedPath}\nResponse: ${statusCode} ${payloadString}`);
        });
    });
};


// map the routes to their correponding handlers
var router = {
    'ping': handlers.ping,
    'users': handlers.users,
    'tokens': handlers.tokens,
    'checks': handlers.checks
};
