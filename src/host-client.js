const dgram = require('dgram');

const { promisify, MessageType } = require('./shared');
const { MASTER_SERVER_ADDR, MASTER_SERVER_PORT } = require('./settings');

const client = dgram.createSocket('udp4');
const promisified = promisify(client);

const waiting = new Map();

client.on('message', function(message, remote) {
  let buf = Buffer.from(message);

  let messageType = buf.readInt8();
  let body = buf.toString('utf8', 1);

  if (messageType == MessageType.Join) {
    let tokens = body.split(':');
    let address = tokens[0];
    let port = parseInt(tokens[1]);

    console.log(`${body} has requested to join...`);

    waiting.set(body, {address, port, state: 'Waiting'});

    buf = Buffer.alloc(1);
    buf.writeInt8(MessageType.Handshake);

    // Send once. Will be most likely rejected.
    promisified.send(buf, 0, buf.length, port, address);
  } else if (messageType == MessageType.Handshake) {
    let key = `${remote.address}:${remote.port}`;

    if (waiting.has(key)) {
      let state = waiting.get(key);
      state.state = 'Connected';

      console.log(`Got message from ${key}! Punchthrough successful.`);

      buf = Buffer.alloc(1);
      buf.writeInt8(MessageType.Ack);

      // Send ack
      promisified.send(buf, 0, buf.length, remote.port, remote.address);
    }
  }
});

let message = Buffer.from('CREATE');

client.send(message, 0, message.length, MASTER_SERVER_PORT, MASTER_SERVER_ADDR, function(err, bytes) {
  if (err) throw err;
  console.log('Created a room. Waiting for clients to join...');

  // client.close();
});