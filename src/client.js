const dgram = require('dgram');

const { promisify, MessageType } = require('./shared');
const { MASTER_SERVER_ADDR, MASTER_SERVER_PORT } = require('./settings');

const client = dgram.createSocket('udp4');
const promisified = promisify(client);

let room;
let sendHandshakes;

client.on('message', function(message, remote) {
  let buf = Buffer.from(message);

  let messageType = buf.readInt8();
  let body = buf.toString('utf8', 1);

  if (messageType == MessageType.Join) {
    let tokens = body.split(':');
    let address = tokens[0];
    let port = parseInt(tokens[1]);

    room = {address, port, state: 'Waiting'};

    console.log(`Found room. Joining ${body}...`);

    buf = Buffer.alloc(1);
    buf.writeInt8(MessageType.Handshake);

    sendHandshakes = setInterval(function() {
      promisified.send(buf, 0, buf.length, port, address);
    }, 3000);
  } else if (messageType == MessageType.Ack) {
    room.state = 'Connected';
    console.log(`Got Ack from ${remote.address}:${remote.port}! Punchthrough successful.`);

    clearInterval(sendHandshakes);
  }
});

let message = Buffer.from('Join');

client.send(message, 0, message.length, MASTER_SERVER_PORT, MASTER_SERVER_ADDR, function(err, bytes) {
  if (err) throw err;
  console.log('Requesting to join a room...');

  // client.close();
});