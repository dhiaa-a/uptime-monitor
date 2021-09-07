/**
 * @description library for handling requests 
 * @author Dororo_
 * 
 */

// dependencies 
const _data = require('./data');
const utils = require('./utils');
const configs = require('./config');

// container for module
var handlers = {}

/**
 * 
 * @param {Request} data - incoming data object from the request
 * @param {Response} callback - forms a response to the user 
 */
handlers.ping = (data, callback) => callback(200);

// general 404 handler to return page not found response
handlers.notFound = (data, callback) => callback(404);

/**
 * @description a handler for the /users route to handle all crud operations
 * @param {Request} data - incoming data object from the request
 * @param {Response} callback - forms a response to the user 
 */
handlers.users = (data, callback) => {
    var acceptableMethods = ['post', 'get', 'put', 'delete'];
    if (acceptableMethods.indexOf(data.method) > -1) {
        handlers._users[data.method](data, callback);
    } else {
        callback(405);
    }
};

// container for users submethods
handlers._users = {};


/**
 * Required data: phone number
 * Optional data: none
 * 
 * @description users - post
 * @param {Request} data - use {queryStringObject.phone, headers.token} here
 * @param {Response} callback - a request callback to return response
 * 
 */
handlers._users.get = (data, callback) => {
    var phone = typeof (data.queryStringObject.phone) == 'string' && data.queryStringObject.phone.trim().length == 10 ? data.queryStringObject.phone.trim() : false;

    if (phone) {
        // check if user is authenticated
        var token = typeof (data.headers.token) == 'string' ? data.headers.token : false;
        handlers._tokens.verifyToken(token, phone, isValid => {
            if (isValid) {
                // check if user exists
                _data.read('users', phone, (err, data) => {
                    if (!err && data) {
                        delete data.hashedPassword;
                        callback(200, data);
                    } else {
                        callback(404);
                    }
                });
            } else {
                callback(403, { 'error': 'you must be authenticated first!' });
            }
        });
    } else {
        callback(400, { 'error': 'missing required field(s)' });
    }
};


/**
 * Required data: firstName, lastName, phone, password, tosAgreement
 * Optional data: none 
 * 
 * @description users - get
 * @param {Request} data - user {payload.firstName, payload.lastName, payload.phone, payload.password, payload.tosAgreement} here
 * @param {Response} callback - a request callback to return response
 */
handlers._users.post = (data, callback) => {
    // validate requried data
    var firstName = typeof (data.payload.firstName) == 'string' && data.payload.firstName.trim().length > 0 ? data.payload.firstName.trim() : false;
    var lastName = typeof (data.payload.lastName) == 'string' && data.payload.lastName.trim().length > 0 ? data.payload.lastName.trim() : false;
    var phone = typeof (data.payload.phone) == 'string' && data.payload.phone.trim().length == 10 ? data.payload.phone.trim() : false;
    var password = typeof (data.payload.password) == 'string' && data.payload.password.trim().length > 0 ? data.payload.password.trim() : false;
    var tosAgreement = typeof (data.payload.tosAgreement) == 'boolean' && data.payload.tosAgreement == true ? true : false;

    if (firstName && lastName && phone && password && tosAgreement) {
        // check if user exists
        _data.read('users', phone, (err, user) => {
            if (err) {
                // hash the password before storing
                var hashedPassword = utils.hash(password);
                if (hashedPassword) {
                    // create the user object
                    var newUser = {
                        'firstName': firstName,
                        'lastName': lastName,
                        'phone': phone,
                        'hashedPassword': hashedPassword,
                        'tosAgreement': true
                    }

                    // store the user
                    _data.create('users', phone, newUser, err => {
                        if (!err) {
                            callback(200);
                        } else {
                            console.log(err);
                            callback(500, { 'error': 'could not create a new user' });
                        }
                    });
                }
            } else {
                callback(400, { 'error': 'this phone number is already in use' });
            }
        });
    } else {
        callback(400, { 'error': 'missing required field(s)' });
    }
};

/**
 * Required data: phone number
 * Optional data: firstName, lastName, password (at least one must be specified)
 * 
 * @description users - put
 * @param {Request} data - use {payload.phone, payload.firstName, payload.lastName, payload.password} here
 * @param {Response} callback - a request callback to return response
 * 
 * @todo only authenticated users can update data, block access to other users data
 */
handlers._users.put = (data, callback) => {
    // validate required
    var phone = typeof (data.payload.phone) == 'string' && data.payload.phone.trim().length == 10 ? data.payload.phone.trim() : false;

    // validate optionals
    var firstName = typeof (data.payload.firstName) == 'string' && data.payload.firstName.trim().length > 0 ? data.payload.firstName.trim() : false;
    var lastName = typeof (data.payload.lastName) == 'string' && data.payload.lastName.trim().length > 0 ? data.payload.lastName.trim() : false;
    var password = typeof (data.payload.password) == 'string' && data.payload.password.trim().length > 0 ? data.payload.password.trim() : false;

    if (phone) {
        if (firstName || lastName || password) {
            // check if user is authenticated
            var token = typeof (data.headers.token) == 'string' ? token : false;
            handlers._tokens.verifyToken(token, phone, isValid => {
                if (isValid) {
                    // lookup for user
                    _data.read('users', phone, (err, user) => {
                        if (!err && user) {
                            // update new fields
                            if (firstName) user.firstName = firstName;
                            if (lastName) user.lastName = lastName;
                            if (password) user.hashedPassword = utils.hash(password);

                            // store the new user object
                            _data.update('users', phone, user, err => {
                                if (!err) {
                                    callback(200);
                                } else {
                                    console.log(err);
                                    callback(500, { 'error': 'could not update the user' });
                                }
                            });
                        } else {
                            callback(400, { 'error': 'the specified user does not exist' });
                        }
                    });
                } else {
                    callback(403, { 'error': 'you must be authenticated first' });
                }
            });
        } else {
            callback(400, { 'error': 'no fields to update' });
        }
    } else {
        callback(400, { 'error': 'missing required field(s)' });
    }
};

/**
 * 
 * required data: phone
 * optional data: none
 * 
 * @description users - delete
 * @param {Request} data - use {queryStringObject.phone} here
 * @param {Response} callback - a request callback to return response
 * 
 */
handlers._users.delete = (data, callback) => {
    var phone = typeof (data.queryStringObject.phone) == 'string' && data.queryStringObject.phone.trim().length == 10 ? data.queryStringObject.phone.trim() : false;

    if (phone) {
        // check if user is authenticated
        var token = typeof (data.headers.token) == 'string' ? data.headers.token : false;
        handlers._tokens.verifyToken(token, phone, isValid => {
            if (isValid) {
                // lookup user
                _data.read('users', phone, (err, user) => {
                    if (!err && user) {
                        _data.delete('users', phone, err => {
                            if (!err) {
                                // delete all user checks
                                var userChecks = typeof (user.checks) == 'object' && user.checks instanceof Array ? user.checks : [];
                                if (userChecks.length > 0) {
                                    // keep track of how many files deleted and if we hit some errors
                                    var deleted = 0;
                                    var errors = false;

                                    // loop and delete
                                    userChecks.forEach(id => {
                                        _data.delete('checks', id, err => {
                                            if (!err) {
                                                deleted++;
                                                callback(200);
                                            } else {
                                                errors = true;
                                                callback(500, {'error': `only ${deleted} checks out of ${userChecks.length} were deleted`});
                                            }
                                        });
                                    });
                                } else {
                                    callback(200);
                                }
                            } else {
                                callback(500, { 'error': 'could not delete the user' });
                            }
                        });
                    } else {
                        callback(404);
                    }
                });
            } else {
                callback(403, { 'error': 'you must be authenticated first' });
            }
        });
    } else {
        callback(400, { 'error': 'missing required field(s)' });
    }
};

/**
 * @description a handler for the /tokens route to handle all crud operations
 * @param {Request} data - use {method} here
 * @param {Response} callback 
 */
handlers.tokens = (data, callback) => {
    var acceptableMethods = ['get', 'post', 'put', 'delete'];
    if (acceptableMethods.indexOf(data.method) > -1) {
        handlers._tokens[data.method](data, callback);
    } else {
        callback(405);
    }
};

// container for tokens submethods
handlers._tokens = {};

/**
 * 
 * required data: phone, password
 * optional data: none
 * 
 * @description tokens - post
 * @param {Request} data - use {payload.phone, payload.password} here
 * @param {Response} callback 
 * 
 */
handlers._tokens.post = (data, callback) => {
    var phone = typeof (data.payload.phone) == 'string' && data.payload.phone.trim().length == 10 ? data.payload.phone.trim() : false;
    var password = typeof (data.payload.password) == 'string' && data.payload.password.trim().length > 0 ? data.payload.password.trim() : false;
    if (phone && password) {
        // lookup user
        _data.read('users', phone, (err, user) => {
            if (!err && user) {
                if (utils.hash(password) == user.hashedPassword) {
                    // construct a token that lasts for 1 hour
                    var token = {
                        'phone': phone,
                        'id': utils.stringGenerator(20),
                        'expires': Date.now() * 1000 * 60 * 60 // 1 hour token
                    }

                    // store the token
                    _data.create('tokens', token.id, token, err => {
                        if (!err) {
                            callback(200, token);
                        } else {
                            callback(500, { 'error': 'could not create a new token' });
                        }
                    });
                } else {
                    callback(400, { 'error': 'sent password does not match the user\'s password' });
                }
            } else {
                callback(400, { 'error': 'could not find such user' });
            }
        });
    } else {
        callback(400, { 'error': 'missing required field(s)' });
    }
};


/**
 * required data: id
 * optional data: none
 * 
 * @description tokens - get
 * @param {Request} data - use {queryStringObject.id} here
 * @param {Response} callback 
 * 
 */
handlers._tokens.get = (data, callback) => {
    var id = typeof (data.queryStringObject.id) == 'string' && data.queryStringObject.id.trim().length == 20 ? data.queryStringObject.id.trim() : false;
    if (id) {
        // lookup the id
        _data.read('tokens', id, (err, token) => {
            if (!err && token) {
                callback(200, token);
            } else {
                callback(400, { 'error': 'token does not exist' });
            }
        });
    } else {
        callback(400, { 'error': 'missing required field(s)' });
    }
};

/**
 * required data: id, extend
 * optional data: none
 * 
 * @description tokens - put
 * @param {Request} data - use {payload.id, payload.extend} here
 * @param {Response} callback 
 * 
 */
handlers._tokens.put = (data, callback) => {
    var id = typeof (data.payload.id) == 'string' && data.payload.id.trim().length == 20 ? data.payload.id.trim() : false;
    var extend = typeof (data.payload.extend) == 'boolean' && data.payload.extend == true ? true : false;

    if (id && extend) {
        // lookup the token
        _data.read('tokens', id, (err, token) => {
            if (!err && token) {
                // check if token is still up
                if (token.expires > Date.now()) {
                    // update the new expire date to another hour and save
                    token.expires = Date.now() * 1000 * 60 * 60;
                    _data.update('tokens', id, token, err => {
                        if (!err) {
                            callback(200);
                        } else {
                            callback(500, { 'error': 'could not extend the token' });
                        }
                    });
                } else {
                    callback(400, { 'error': 'can not extend, token already expired!' });
                }
            } else {
                callback(400, { 'error': 'token does not exist' });
            }
        });
    } else {
        callback(400, { 'error': 'missing required field(s)' });
    }
};

/**
 * required data: id
 * optional data: none
 * 
 * @description tokens - delete
 * @param {Request} data - use {queryStringObject.id} here
 * @param {Response} callback 
 * 
 */
handlers._tokens.delete = (data, callback) => {
    var id = typeof (data.queryStringObject.id) == 'string' && data.queryStringObject.id.trim().length == 20 ? data.queryStringObject.id.trim() : false;
    if (id) {
        // lookup the token
        _data.read('tokens', id, (err, token) => {
            if (!err && token) {
                _data.delete('tokens', id, err => {
                    if (!err) {
                        callback(200);
                    } else {
                        callback(500, { 'error': 'could not delete token' });
                    }
                });
            } else {
                callback(400, { 'error': 'token does not exist' });
            }
        });
    } else {
        callback(400, { 'error': 'missing requried field(s)' });
    }
}

/**
 * @description verify if token is valid for a given user
 * @param {string} id - token id
 * @param {string} phone - user phone number
 * @param {Response} callback 
 */
handlers._tokens.verifyToken = (id, phone, callback) => {
    // lookup the token
    _data.read('tokens', id, (err, token) => {
        if (!err && token) {
            // token must relate to a user, token must not be expired
            if (token.phone == phone && token.expires > Date.now()) {
                callback(true);
            } else {
                callback(false);
            }
        } else {
            callback(false);
        }
    });
};

/**
 * @description a handler for the /checks route to handle all crud operations
 * @param {Request} data - use {method} here
 * @param {Response} callback 
 */
handlers.checks = (data, callback) => {
    var acceptableMethods = ['get', 'post', 'put', 'delete'];
    if (acceptableMethods.indexOf(data.method) > -1) {
        handlers._checks[data.method](data, callback);
    } else {
        callback(405);
    }
};;

// container for the _checks routes
handlers._checks = {};

/**
 * requried data: protocol, url, method, successCodes, timeoutSeconds
 * optional data: none
 * 
 * @description checks - post
 * @param {Request} data - use {headers.token, payload.[protocol, url, method, successCodes, timeoutSeconds]} here
 * @param {Response} callback
 */
handlers._checks.post = (data, callback) => {
    // validate fields
    var protocol = typeof (data.payload.protocol) == 'string' && ['http', 'https'].indexOf(data.payload.protocol) > -1 ? data.payload.protocol : false;
    var url = typeof (data.payload.url) == 'string' && data.payload.url.trim().length > 0 ? data.payload.url.trim() : false;
    var method = typeof (data.payload.method) == 'string' && ['post', 'get', 'put', 'delete'].indexOf(data.payload.method) > -1 ? data.payload.method : false;
    var successCodes = typeof (data.payload.successCodes) == 'object' && data.payload.successCodes instanceof Array && data.payload.successCodes.length > 0 ? data.payload.successCodes : false;
    var timeoutSeconds = typeof (data.payload.timeoutSeconds) == 'number' && data.payload.timeoutSeconds % 1 == 0 && data.payload.timeoutSeconds >= 1 && data.payload.timeoutSeconds <= 5 ? data.payload.timeoutSeconds : false;

    if (protocol && url && method && successCodes && timeoutSeconds) {
        // check if user is authenticated
        var token = typeof (data.headers.token) == 'string' ? data.headers.token : false;
        _data.read('tokens', token, (err, token) => {
            if (!err && token) {
                // lookup user data to add checks to it
                _data.read('users', token.phone, (err, user) => {
                    if (!err && user) {
                        var userChecks = typeof (user.checks) == 'object' && user.checks instanceof Array ? user.checks : [];
                        if (userChecks.length < configs.maxChecks) {
                            // construct newCheck object
                            var newCheck = {
                                'id': utils.stringGenerator(20),
                                'userPhone': token.phone,
                                'protocol': protocol,
                                'url': url,
                                'method': method,
                                'successCodes': successCodes,
                                'timeoutSeconds': timeoutSeconds
                            };

                            _data.create('checks', newCheck.id, newCheck, err => {
                                if (!err) {
                                    user.checks = userChecks;
                                    user.checks.push(newCheck.id);

                                    _data.update('users', user.phone, user, err => {
                                        if (!err) {
                                            callback(200, newCheck);
                                        } else {
                                            callback(500, { 'error': 'could not add checks to user' });
                                        }
                                    });
                                } else {
                                    callback(500, { 'error': 'could not add the new check' });
                                }
                            });
                        } else {
                            callback(400, { 'error': `you already have ${configs.maxChecks} checks!` });
                        }
                    } else {
                        callback(403);
                    }
                });
            } else {
                callback(403)
            }
        });
    } else {
        callback(400, { 'error': 'some field(s) are either missing or invalid' });
    }

};


/**
 * requried data: id
 * optional data: none
 * 
 * @description checks - get
 * @param {Request} data - use {queryStringObject.id, headers.token} here
 * @param {Response} callback
 */
handlers._checks.get = (data, callback) => {
    var id = typeof (data.queryStringObject.id) == 'string' && data.queryStringObject.id.trim().length == 20 ? data.queryStringObject.id.trim() : false;

    if (id) {
        // check if the check exists
        _data.read('checks', id, (err, check) => {
            if (!err && check) {
                // check if user is authenticated
                var token = typeof (data.headers.token) == 'string' ? data.headers.token : false;
                handlers._tokens.verifyToken(token, check.userPhone, isValid => {
                    if (isValid) {
                        callback(200, check);
                    } else {
                        callback(403);
                    }
                });
            } else {
                callback(404);
            }
        });

    } else {
        callback(400, { 'error': 'missing required field(s)' });
    }
};


/**
 * requried data: id
 * optional data: protocol, url, method, successCodes, timeoutSeconds (at least 1 exists)
 * 
 * @description checks - put
 * @param {Request} data - use {payload.[id, protocol, url, method, successCodes, timeoutSeconds], headers.token} here
 * @param {Response} callback
 */
handlers._checks.put = (data, callback) => {
    // validate required data
    var id = typeof (data.payload.id) == 'string' && data.payload.id.trim().length == 20 ? data.payload.id.trim() : false;

    // validate optionals data
    var protocol = typeof (data.payload.protocol) == 'string' && ['http', 'https'].indexOf(data.payload.protocol) > -1 ? data.payload.protocol : false;
    var url = typeof (data.payload.url) == 'string' && data.payload.url.trim().length > 0 ? data.payload.url.trim() : false;
    var method = typeof (data.payload.method) == 'string' && ['post', 'get', 'put', 'delete'].indexOf(data.payload.method) > -1 ? data.payload.method : false;
    var successCodes = typeof (data.payload.successCodes) == 'object' && data.payload.successCodes instanceof Array && data.payload.successCodes.length > 0 ? data.payload.successCodes : false;
    var timeoutSeconds = typeof (data.payload.timeoutSeconds) == 'number' && data.payload.timeoutSeconds % 1 == 0 && data.payload.timeoutSeconds >= 1 && data.payload.timeoutSeconds <= 5 ? data.payload.timeoutSeconds : false;

    if (id) {
        if (protocol || url || method || successCodes || timeoutSeconds) {
            // check if the check exists
            _data.read('checks', id, (err, check) => {
                if (!err && check) {
                    // check if user is authenticated
                    var token = typeof (data.headers.token) == 'string' ? token : false;
                    handlers._tokens.verifyToken(token, check.phoneUser, isValid => {
                        if (isValid) {
                            if (protocol) check.protocol = protocol;
                            if (url) check.url = url;
                            if (method) check.method = method;
                            if (successCodes) check.successCodes = successCodes;
                            if (timeoutSeconds) check.timeoutSeconds = timeoutSeconds;

                            // update the stored check file
                            _data.update('check', id, check, err => {
                                if (!err) {
                                    callback(200);
                                } else {
                                    callback(500, { 'error': 'could not update the check' });
                                }
                            });
                        } else {
                            callback(403);
                        }
                    });
                } else {
                    callback(404);
                }
            });
        } else {
            callback(400, { 'error': 'no field(s) to update' });
        }
    } else {
        callback(400, { 'error': 'missing required field(s)' });
    };
};


/**
 * requried data: id
 * optional data: none
 * 
 * @description checks - delete
 * @param {Request} data - use {queryStringObject.id, headers.token} here
 * @param {Response} callback
 */
handlers._checks.delete = (data, callback) => {
    var id = typeof (data.queryStringObject.id) == 'string' && data.queryStringObject.id.trim().length == 20 ? data.queryStringObject.id.trim() : false;

    if (id) {
        // check if the check exists 
        _data.read('checks', id, (err, check) => {
            if (!err && check) {
                // verify if user is authenticated
                var token = typeof (data.headers.token) == 'string' ? data.headers.token : false;
                handlers._tokens.verifyToken(token, check.userPhone, isValid => {
                    if (isValid) {
                        // delete the check data
                        _data.delete('checks', id, err => {
                            if (!err) {
                                // delete reference from associated user
                                _data.read('users', check.userPhone, (err, user) => {
                                    if (!err && user) {
                                        // edit user checks
                                        var userChecks = typeof (user.checks) == 'object' && user.checks instanceof Array ? user.checks : [];
                                        if (userChecks.indexOf(id) > -1) {
                                            userChecks.splice(userChecks.indexOf(id), 1);
                                            // update the user
                                            _data.update('users', check.userPhone, user, err => {
                                                if (!err) {
                                                    callback(200);
                                                } else {
                                                    callback(500, { 'error': 'could not update the user' });
                                                }
                                            });
                                        } else {
                                            callback(500, { 'error': 'no such id found in user checks' });
                                        }
                                    } else {
                                        callback(500, { 'error': 'could not find the user' });
                                    }
                                });
                            } else {
                                callback(500, { 'error': 'could not delete the check' });
                            }
                        });
                    } else {
                        callback(403);
                    }
                });
            } else {
                callback(404);
            }
        });
    } else {
        callback(400, { 'error': 'missing required field(s)' });
    }
};

// export the modules
module.exports = handlers;