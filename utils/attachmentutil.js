/*

attachmentutil.js
Will generate the log filename and convert the attachment file to base64
*/
const os = require("os");
const fs = require("fs");
const path = require("path");
const cmdspawn = require('child_process').spawnSync;
const emailer = require('../utils/emailer');
var archiver = require('archiver');

const ee = require('events');

const eventEmitter = new ee.EventEmitter();

module.exports = {
    generatePPUFileName: function (vendor_type) {
        var date = new Date();
        var hostname = os.hostname();

        return hostname.concat("-",
            vendor_type,
            "-",
            date.getFullYear(),
            ("0" + (date.getMonth() + 1)).slice(-2),
            ("0" + date.getDate()).slice(-2),
            "-",
            ("0" + date.getHours()).slice(-2),
            ("0" + date.getMinutes()).slice(-2),
            ("0" + date.getSeconds()).slice(-2));
    },
    rotateLog: function (lmutil_path, license_path, vendor_type, rotatedlog, error_log, filename) {
        /**
         * lmutil_path:     full path to lmutil.exe
         * license_path:    folder where all the licenses are kept, eg C:\Licenses
         * vendor_type:     most likley slbsls
         * rotatedlog:      full path of the log file that has just been rotated, eg C:\logs\ppulog.rl
         * error_log:      full path to log textfile
         */
        var fileExists = false;
        const bat = cmdspawn('cmd.exe', ['/c',
            lmutil_path,
            'lmnewlog',
            '-c',
            license_path,
            vendor_type,
            rotatedlog,
            '>',
            error_log]
        );

        //check log exists and return true or false
        if (fs.existsSync(rotatedlog)) {
            fileExists = true;
        }
        return fileExists;
    },

    archiveAndSend: function (archdesc, emailDesc) {
        const compressedFile = archdesc.archive_path + "\\" + archdesc.filename + ".zip";

        var outputFileStream = fs.createWriteStream(compressedFile);
        var zipfile = archiver('zip', {
            zlib: {
                level: 9
            }
        });

        outputFileStream.on('close', () =>  {
            //convert to base 64 attachment
            const b64 = convertRotatedLogToBase64(compressedFile);
            //base64Attachment, attachmentFilenameStr

            emailDesc.base64Attachment = b64;
            emailDesc.attachmentFilenameStr = path.basename(compressedFile);
            emailer.emailLog(emailDesc);
        });


        zipfile.pipe(outputFileStream);
        zipfile.append(fs.createReadStream(archdesc.rotatedlog), { name: archdesc.filename + '.rl' });
        zipfile.finalize();
    },
    sendError: function(eo, errorlog){
        eo.base64Attachment = convertRotatedLogToBase64(errorlog);
        eo.attachmentFilenameStr = path.basename(errorlog);
        emailer.emailLog(eo);
    }

};

function convertRotatedLogToBase64(archivedFile){
    return new Buffer(fs.readFileSync(archivedFile)).toString('base64');
}