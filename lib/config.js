/** 
 * Here lives all configurations for the API
 * @author Dororo_
 * @desc decide upon which environemt the program should run in
 * 
 */

// environemnts container
var environments = {};

// the default and development enviroment
environments.development = {
    'httpPort': 3000,
    'httpsPort': 3001,
    'envName': 'development',
    'hashingSecret': 'secretKeyDevelopment',
    'maxChecks': 5,
    'twilio': {
        'accountSid': 'ACb32d411ad7fe886aac54c665d25e5c5d',
        'authToken': '9455e3eb3109edc12e3d8c92768f7a67',
        'fromPhone': '+15005550006'
    }
};

// production ready settings
environments.production = {
    'httpPort': 5000,
    'httpsPort': 5001,
    'envName': 'production',
    'hashingSecret': 'secretKeyProduction',
    'maxChecks': 5,
    'twilio': {
        'accountSid': '',
        'authToken': '',
        'phone': ''
    }
};

// check for the required env
var currentEnv = typeof (process.env.NODE_ENV) == 'string' ? process.env.NODE_ENV.toLowerCase() : '';

// validate given environemt or default ot staging
var exportEnv = typeof (environments.currentEnv) == 'object' ? environments.currentEnv : environments.development;

// Export the module
module.exports = exportEnv;