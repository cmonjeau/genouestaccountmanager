/**
* Test expiration date of user, if lower than 2 month, send an email to user
*/
var STATUS_PENDING_EMAIL = 'Waiting for email approval';
var STATUS_PENDING_APPROVAL = 'Waiting for admin approval';
var STATUS_ACTIVE = 'Active';
var STATUS_EXPIRED = 'Expired';


var CONFIG = require('config');
var notif = require('./routes/notif.js');

var monk = require('monk'),
    db = monk(CONFIG.mongo.host+':'+CONFIG.mongo.port+'/'+CONFIG.general.db),
    users_db = db.get('users');
    projects_db = db.get('projects')

var MAIL_CONFIG = CONFIG.gomail;

function timeConverter(tsp){
  var a = new Date(tsp);
  var months = ['Jan','Feb','Mar','Apr','May','Jun','Jul','Aug','Sep','Oct','Nov','Dec'];
  var year = a.getFullYear();
  var month = months[a.getMonth()];
  var date = a.getDate();
  var hour = a.getHours();
  var min = a.getMinutes();
  var sec = a.getSeconds();
  var time = date + ',' + month + ' ' + year + ' ' + hour + ':' + min + ':' + sec ;
  return time;
}

// Find users expiring in less then 2 month
projects_db.find({}, function(err, projects){
  var mail_sent = 0;
  var notifs = [];
  for(var i=0;i<projects.length;i++){
      var project = projects[i];
      if(project.expire !== undefined && project.expire!=null) {
          if(project.expire < new Date().getTime() + 1000*3600*24*30) {
              var msg = "Quota for project "+project.id+" partition will expire at "+new Date(project.expire);
              notifs.push(msg);
          }
      }
  }
  for(var i=0;i<notifs.length;i++){
    var notification = notifs[i];
    var mailOptions = {
      origin: MAIL_CONFIG.origin, // sender address
      destinations: [CONFIG.general.accounts], // list of receivers
      subject: 'Quota expiration', // Subject line
      message: notification, // plaintext body
      html_message: notification // html body
    };
    if( notif.mailSet()) {
        notif.sendUser(mailOptions, function(error, response){
            if(error){
              console.log(error);
            }
            mail_sent++;
            if(mail_sent == notifs.length) {
              process.exit(code=0);
            }
        });
    }
    else {
        console.log(notif);
        mail_sent++;
        if(mail_sent == notifs.length) {
          process.exit(code=0);
        }
    }

  }

  if(mail_sent == notifs.length) {
    process.exit(code=0);
  }

});
