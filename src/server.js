const { PacketResendingUDPSocket, MessageType } = require('./shared');

const server = new PacketResendingUDPSocket();

server.on('listening', function() {
  var address = server.address();
  console.log(`UDP server listening on ${address.address}:${address.port}`);
});

server.on('message', function(req, buf, remote) {
  message = buf.toString();
  console.log(`Received ${remote.address}:${remote.port} - ${message}`);

  if (message == 'WHOAMI') {
    let message = `${remote.address}:${remote.port}`;
    let buf = Buffer.alloc(req.messageId.length + 1 + message.length);

    buf.write(req.messageId);
    buf.writeUInt8(MessageType.Ack, req.messageId.length);
    buf.write(message, req.messageId.length + 1);

    server.send(buf, 0, buf.length, remote.port, remote.address);
  }
});

const port = parseInt(process.argv[2]);
server.bind(port ? port : 33333);