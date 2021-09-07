/**
 * Library for storing and reading data
 * @author Dororo_
 * @func
 * 
 * 
 */

// dependencies
const fs = require('fs');
const path = require('path');
const utils = require('./utils');

// container for the module
var lib = {};

/**
 * @description home directory for the data folder
 */
lib.baseDir = path.join(__dirname, '../.data/');

/**
 * @description creates and writes json files
 * 
 * @param {String} dir - folder name to store file in
 * @param {string} file - what do you want to name the file?
 * @param {Object} data - data object to be written
 * @param {requestCallback} callback - pass a callback to handle errors
 */
lib.create = (dir, file, data, callback) => {
    // attempt opening file
    fs.open(path.join(lib.baseDir, dir, file + '.json'), 'wx', (err, fileDescriptor) => {
        if (!err && fileDescriptor) {
            // write and close, pass data after stringifying it
            fs.write(fileDescriptor, JSON.stringify(data), err => {
                if (!err) {
                    fs.close(fileDescriptor, err => {
                        if (!err) {
                            callback(false);
                        } else {
                            callback('Error closing new file');
                        }
                    })
                } else {
                    callback('Error writing to new file');
                }
            });
        } else {
            callback('Could not create new file, it may already exist');
        }
    });
};

/**
 * @description reads a given file and returns its content
 * @param {string} dir - folder name to read the file from
 * @param {string} file - file name to be retrieved
 * @param {lib.read~callback} callback - returns (err, Object)
 * 
 */
lib.read = (dir, file, callback) => {
    fs.readFile(path.join(lib.baseDir, dir, file + '.json'), 'utf-8', (err, data) => {
        if(!err && data){
            callback(false, utils.parseJsonToObject(data));
        } else {
            callback(err, data);
        }
    });
};

/**
 * @description updates the content of an existing file
 * @param {string} dir - folder name to retireve the file from
 * @param {string} file - file name to be retrieved
 * @param {Object} data - data object to be added
 * @param {requestCallback} callback - expects error handling
 */
lib.update = (dir, file, data, callback) => {
    // open the file
    fs.open(path.join(lib.baseDir, dir, file + '.json'), 'r+', (err, fileDescriptor) => {
        if (!err && fileDescriptor) {
            // truncate the file before usage
            fs.truncate(fileDescriptor, err => {
                if (!err) {
                    // write to the file
                    fs.writeFile(fileDescriptor, JSON.stringify(data), err => {
                        if (!err) {
                            fs.close(fileDescriptor, err => {
                                if (!err) {
                                    callback(false);
                                } else {
                                    callback('Error closing the file');
                                }
                            });
                        } else {
                            callback('Error writing to file');
                        }
                    });
                } else {
                    callback('Error truncating file');
                }
            });
        } else {
            callback('Could not opne file, it may not exist yet');
        }
    });
};

/**
 * @description deletes a file 
 * @param {string} dir 
 * @param {string} file 
 * @param {requestCallback} callback 
 */
lib.delete = (dir, file, callback) => {
    // unlinking the file
    fs.unlink(path.join(lib.baseDir, dir, file + '.json'), err => {
        if (!err) {
            callback(false);
        } else {
            callback('Error deleting the file');
        }
    });
};

// export module
module.exports = lib;