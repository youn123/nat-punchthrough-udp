const dgram = require('dgram');

const { promisify, MessageType } = require('./shared');
const { MASTER_SERVER_PORT } = require('./settings');

const server = dgram.createSocket('udp4');
const rooms = [];
const promisified = promisify(server);

server.on('listening', function() {
  var address = server.address();
  console.log(`UDP server listening on ${address.address}:${address.port}`);
});

server.on('message', function(message, remote) {
  console.log(`${remote.address}:${remote.port} - ${message}`);

  if (message == 'CREATE') {
    rooms.push({address: remote.address, port: remote.port});
    console.log(`created room ${remote.address}:${remote.port}`);
  } else if (message == 'JOIN') {
    let room = rooms[0];

    let message = `${remote.address}:${remote.port}`;
    let bufToHost = Buffer.alloc(1 + message.length);
    bufToHost.writeInt8(MessageType.Join);
    bufToHost.write(message, 1);

    promisified.send(bufToHost, 0, bufToHost.length, room.port, room.address)
      .catch(function(err) {
        console.log(err);
      });

    message = `${room.address}:${room.port}`;
    let bufToClient = Buffer.alloc(1 + message.length);
    bufToClient.writeInt8(MessageType.Join);
    bufToClient.write(message, 1);
    
    promisified.send(bufToClient, 0, bufToClient.length, remote.port, remote.address)
      .catch(function(err) {
        console.log(err);
      });
  }
});

server.bind(MASTER_SERVER_PORT);