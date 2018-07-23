const fs = require('fs');
const path = require('path');
const mkdirp = require('mkdirp');
const os = require("os");
const attachmentUtils = require('./utils/attachmentutil');

/**
 * Read the settings file
 */

const SETTINGS = JSON.parse(fs.readFileSync('settings.json', 'utf8'));

const ROOT_PATH = SETTINGS.LOG_ROOT_PATH;

const LOG_PATH = ROOT_PATH + "\\rotated_logs";
const ARCHIVE_PATH = ROOT_PATH + "\\archived_logs"
const ERROR_PATH = ROOT_PATH + "\\error_logs"


const PPU_FILENAME = attachmentUtils.generatePPUFileName(SETTINGS.VENDOR_DAEMON);
const PPU_ROTATED_LOG_FULL_PATH = LOG_PATH + '\\' + PPU_FILENAME + '.rl'
const COMPRESSED_LOG_FULL_PATH = ARCHIVE_PATH + '\\' + PPU_FILENAME + '.zip'

const ERROR_LOG_PATH = ERROR_PATH + "\\lmutil-err-" + PPU_FILENAME + ".txt"

const logObj = {
    rotatedlog: PPU_ROTATED_LOG_FULL_PATH,
    archive_path: ARCHIVE_PATH,
    filename: PPU_FILENAME
};

const emailObj = {
    toEmail: SETTINGS.EMAIL_ADDRESS_LOGS,
    ccList: SETTINGS.EMAIL_ADDRESS_CC_LIST,
    fromEmail: SETTINGS.EMAIL_FROM,
    subject: "PAYU USAGE [" + SETTINGS.PPU_CUSTOMER_ID + "] Report log sent for agent [" + os.hostname() + "]",
    content: "pay per use log ",
    apikey: SETTINGS.API_KEY
};

var logContent = "";
/**
 * Create the directories if they don't exist
 */
mkdirp.sync(LOG_PATH);
mkdirp.sync(ARCHIVE_PATH);
mkdirp.sync(ERROR_PATH);

if (fs.existsSync(ROOT_PATH)) {
    if (attachmentUtils.rotateLog(SETTINGS.LMUTIL_PATH, SETTINGS.LICENSE_DIR, SETTINGS.VENDOR_DAEMON, PPU_ROTATED_LOG_FULL_PATH, ERROR_LOG_PATH, PPU_FILENAME)) {
        attachmentUtils.archiveAndSend(logObj, emailObj);
    } else {
        //log error here that file did not get rotated

        logContent = logContent + "report log could not be created\n";

        console.log("report log could not be created");

        emailObj.toEmail = SETTINGS.EMAIL_ADDRESS_NOTIFICATIONS,
        emailObj.subject = "ERROR - " + emailObj.subject;
        emailObj.content = "Error with sending log";
        emailObj.content = logContent;
        attachmentUtils.sendError(emailObj, ERROR_LOG_PATH);
    }
} else {
    console.log("folder doesn't exist and could not make folder structure");
}

