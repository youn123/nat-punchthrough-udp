require('dotenv').config();

const { PacketResendingUDPSocket, MessageType } = require('../src/shared');

const client = new PacketResendingUDPSocket();

const message = 'WHOAMI';
const buf = Buffer.alloc(message.length + 1);

buf.writeUInt8(MessageType.Message);
buf.write(message, 1);

sends = Promise.all([
  client.send(Buffer.from(buf), 0, message.length, 33333, process.env.INTRO_SERVER_1, true),
  // client.send(Buffer.from(message), 0, message.length, 33334, process.env.INTRO_SERVER_1, true),
  // client.send(Buffer.from(message), 0, message.length, 33333, process.env.INTRO_SERVER_2, true),
  // client.send(Buffer.from(message), 0, message.length, 33334, process.env.INTRO_SERVER_2, true),
]);

sends.then(function(results) {
  for (let {buf, remote} of results) {
    console.log(`According to ${remote.address}:${remote.port}, I am ${buf.toString()}`);
  }

  client.close();
});