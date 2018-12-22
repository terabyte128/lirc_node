exports.version = '0.0.2';
exports.IRSend = require('./irsend');
exports.irsend = new exports.IRSend();
exports.remotes = {};

exports.IRReceive = require('./irreceive');
var irreceive = new exports.IRReceive();
exports.addListener = irreceive.addListener.bind(irreceive);
exports.on = exports.addListener;
exports.removeListener = irreceive.removeListener.bind(irreceive);

// In some cases the default lirc socket does not work
// More info at http://wiki.openelec.tv/index.php?title=Guide_to_Lirc_IR_Blasting
exports.setSocket = function(socket) {
  exports.irsend.setSocket(socket);
}

exports.init = function(callback) {
  exports.irsend.list('', '', irsendCallback);

	try {
    exports.wolConfig = require(process.env.HOME + "/.wake_on_lan.json")
  } catch (e) {
    console.log("Did not find a wake-on-lan config file");
  }

  function irsendCallback(error, stdout, stderr) {

    exports._populateRemotes(error, stdout, stderr);
    exports._populateCommands();
    if (callback) callback();
  }

  return true;
};

// Private
exports._populateRemotes = function(error, stdout, stderr) {
  var remotes = stdout.split('\n');
		
  exports.remotes = {};

  remotes.forEach(function(element, index, array) {
    var remoteName = element.match(/(.+)$/);

		if (remoteName) exports.remotes[remoteName[1]] = [];
  });
};

exports._populateCommands = function() {
  for (var remote in exports.remotes) {
    (function(remote) {
      exports.irsend.list(remote, '', function(error, stdout, stderr) {
        exports._populateRemoteCommands(remote, error, stdout, stderr);
      });
    })(remote);
  }
};

exports._populateRemoteCommands = function(remote, error, stdout, stderr) {
  var commands = stdout.split('\n');

  commands.forEach(function(element, index, array) {
    var commandName = element.match(/.+\s(.+)$/);
    if (commandName && commandName[1]) exports.remotes[remote].push(commandName[1]);
  });

	if (exports.wolConfig[remote]) {
    exports.remotes[remote].push("WAKE_ON_LAN");
  }
};
