var helper = require('sendgrid').mail;
const util = require('util');
module.exports = {
    emailLog: function (emailObj) {

        const sgFromEmail = new helper.Email(emailObj.fromEmail);
        const sgToEmail = new helper.Email(emailObj.toEmail);
        const sgContent = new helper.Content('text/plain', emailObj.content);

        const sg = require('sendgrid')(emailObj.apikey);

        var attachment = new helper.Attachment();
        attachment.setContent(emailObj.base64Attachment);
        attachment.setType('application/zip');
        attachment.setFilename(emailObj.attachmentFilenameStr);
        attachment.setDisposition('attachment');

        //var mail = new helper.Mail(sgFromEmail, emailObj.subject, sgToEmail, sgContent);
        var mail = new helper.Mail();
        mail.setFrom(sgFromEmail);
        mail.setSubject(emailObj.subject);
        mail.addContent(sgContent);
        mail.addAttachment(attachment);

        var personalization = new helper.Personalization();
        personalization.addTo(sgToEmail);

        if (emailObj.ccList.length > 0) {
            emailObj.ccList.forEach((email) => {
                personalization.addCc(new helper.Email(email));
            });
        }
        mail.addPersonalization(personalization);

        var request = sg.emptyRequest({
            method: 'POST',
            path: '/v3/mail/send',
            body: mail.toJSON()
        });

        //console.log(util.inspect(request.body.personalizations, false, null))
        sg.API(request, function (error, response) {
            if (error) {
                console.log('Error response received');
                console.log(response.body);
                console.log(response.headers);
            } else {
                console.log('Sent ok');
            }

            //400 error response
            //202 OK
            console.log(response.statusCode);
        });


    }
};
