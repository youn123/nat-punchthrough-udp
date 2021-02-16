/**
 * 
 * @param {dgram.Socket} socket 
 */
function promisify(socket) {
  return {
    send: function(message, offset, length, port, address) {
      return new Promise(function (resolve, reject) {
        socket.send(message, offset, length, port, address, function(err) {
          if (err) reject(err);
          resolve();
        });
      });
    }
  };
}

const MessageType = {
  Create: 0,
  Join: 1,
  Handshake: 2,
  Ack: 3
};

const DecodeMessageType = {
  0: 'Create',
  1: 'Join',
  2: 'Handshake',
  3: 'Ack'
};

module.exports = {
  promisify,
  MessageType,
  DecodeMessageType
};