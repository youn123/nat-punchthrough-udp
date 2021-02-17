const dgram = require('dgram');
const { generateRandomBase64String } = require('./utils');

const MAX_RETRIES = 3;

class PacketResendingUDPSocket {
  constructor() {
    this.socket = dgram.createSocket('udp4');
    this.pending = new Map();

    this.socket.on('message', (message, remote) => {
      let buf = Buffer.from(message);
      message = buf.toString();

      let messageId = buf.toString('utf8', 0, 7);
      let messageType = buf.readInt8(7);

      // console.log(`Message with id ${messageId} ${MessageTypeReverseMap[messageType]} received.`);

      switch (messageType) {
        case MessageType.Ack:
          if (this.pending.has(messageId)) {
            let messageState = this.pending.get(messageId);
            this.pending.delete(messageId);

            clearInterval(messageState.resend);

            // Wait for tick (hacky)
            if (!messageState.resolve) {
              setTimeout(() => {
                messageState.resolve({buf: buf.subarray(8), remote});
              }, 5);
            } else {
              messageState.resolve({buf: buf.subarray(8), remote});
            }
          }
          break;
        case MessageType.Message:
          break;
        default:
          break;
      }

      this.onMessage && this.onMessage({messageId}, buf.subarray(8), remote);
    });

    this.send.bind(this);
    this.on.bind(this);
    this.bind.bind(this);
    this.address.bind(this);
    this.close.bind(this);
  }

  send(message, offset, length, port, address, retry) {
    return new Promise((resolve, reject) => {
      if (length > 500) {
        reject(new Error("Message size cannot be greater than 500 bytes."));
      }

      let buf;
      let messageId;

      if (retry) {
        messageId = generateRandomBase64String(7);
        while (this.pending.has(messageId)) {
          messageId = generateRandomBase64String(7);
        }
  
        buf = Buffer.concat([Buffer.from(messageId), message]);
      } else {
        buf = message;
      }

      this.socket.send(buf, offset, buf.length, port, address, err => {
        if (err) {  
          reject(err);
        }

        if (!retry) {
          resolve();
        } else {
          // console.log(`Message with id ${messageId} sent.`);
          let messageState = {};
          this.pending.set(messageId, messageState);

          let numRetried = 0;
          // Resend every 3 sec if Ack not received.
          let resend = setInterval(() => {
            if (numRetried == MAX_RETRIES) {
              let messageState = this.pending.get(messageId);
              this.pending.delete(messageId);

              clearInterval(messageState.resend);
              messageState.reject();

              reject(err);
            }

            this.socket.send(buf, offset, buf.length, port, address, err => {
              if (err) {
                if (this.pending.has(messageId)) {
                  let messageState = this.pending.get(messageId);
                  this.pending.delete(messageId);

                  clearInterval(messageState.resend);
                  messageState.reject();

                  reject(err);
                }
              }

              numRetried++;
            });
          }, 3000);

          messageState.resend = resend;

          let receivedAck = new Promise((resolve, reject) => {
            messageState.resolve = resolve;
            messageState.reject = reject;
          });

          resolve(receivedAck);
        }
      });
    });
  }

  on(event, callback) {
    if (event == 'message') {
      this.onMessage = callback;
    } else {
      this.socket.on(event, callback);
    }
  }

  bind(port) {
    this.socket.bind(port);
  }

  address() {
    return this.socket.address();
  }

  close() {
    this.socket.close();
  }
}

const MessageType = {
  Message: 0,
  Ack: 1
};

const MessageTypeReverseMap = {
  0: 'Message',
  1: 'Ack'
};

module.exports = {
  PacketResendingUDPSocket,
  MessageType
};