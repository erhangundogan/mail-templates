var config = require("./config.json"),
    jade = require("jade"),
    path = require("path"),
    fs = require("fs"),
    util = require("util");
    events = require("events");
    nodemailer = require("nodemailer");

var Mailer = exports.Mailer = function() {
  events.EventEmitter.call(this);
  return this;
};

util.inherits(Mailer, events.EventEmitter);

/**
 *
 * @param template:  e.g. { name:"send-welcome", language:"tr", type:"jade|txt" }
 * @param templateData: e.g. { name:"", domain:"", sender:"", link:"", supportEmail:"" }
 * @param mailData: e.g. { from:"", replyTo:"", cc:"", bcc:"", subject:"" }
 */
Mailer.prototype.send = function(template, templateData, mailData) {

  var self = this;

  if (!template || !templateData || !mailData) {
    this.emit("error", "[ERROR] => Mail parameters not valid!");
    process.exit(1);
  }

  var templateFile = path.join(__dirname, "templates",
    template.language, template.type, template.name + "." + template.type);

  fs.exists(templateFile, function(exists) {
    if (exists) {
      jade.renderFile(templateFile, { locals: templateData },
        function(err, result) {
          if (err || !result) {
            self.emit("error", "[ERROR RENDER TEMPLATE] => " +  err.stack||err);
            process.exit(1);
          } else {

            if (template.type == "txt") {
              mailData.text = result;
            } else if (template.type == "jade") {
              mailData.html = result;
            } else {
              self.emit("error", "[ERROR] => Unknown template file type");
              process.exit(1);
            }

            var smtpTransport = nodemailer.createTransport("SMTP", config.smtpOptions);
            smtpTransport.sendMail(mailData,
              function(err, result) {
                if (err) {
                  self.emit("error", "[ERROR SMTP SEND] => " + err.stack||err);
                  process.exit(1);
                }
                var dt = new Date();
                self.emit("success", { data:mailData, date:dt });
                process.exit(1);
            });
          }
        }
      );
    } else {
      self.emit("error", "[ERROR] => Mail template not found!");
      process.exit(1);
    }
  });
};