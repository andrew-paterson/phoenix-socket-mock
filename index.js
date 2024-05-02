/** @module phoenixMockSocket */
import { Server } from 'mock-socket';

export default {
  /**
 * Starts the server socket connection at the url passed, using mock-socket.
 * Provides out of the box handling of the built in `phx_join` and `heartbeat` events.
 * Responds to custom incoming messages from the client by applying the result of `responsePayloadFunc` argument
 * Catches the "A mock server is already listening on this url" from mock-socket and logs a warning, but throws any other errors from mock-socket. This is because your testing framework may attempt to sockets connections to the same URL multiple times during a test run.
 * @param url {string} - The url of the web socket connection to start. This should be the same as the url of the actual web socket connection that your client will attempt to join.
 * @param responsePayloadFunc {function} - Returns the payload to use in response to an incoming message from the client. Receives the incoming topic, eventName and payload as arguments, and must return the response payload in the form of an object.
 * @example
import phoenixMockSocket from 'phoenix-socket-mock';

function myTest() {
  const url = 'ws://localhost8000/socket/websocket';
  const responsePayloadFunc = (topic, eventName, payload) => {
    let responseString;
    if (payload.message === 'One fish') {
      responseString = 'Two fish';
    } else if (payload.message === 'Red fish') {
      responseString = 'Blue fish';
    } else {
      responseString = 'Unknown fish';
    }
    return {
      response: { message: responseString },
    };
  };
  phoenixMockSocket.initialise(url, responsePayloadFunc);
};

// Client code - this is only given as a reference for the above mock server code
import { Socket } from 'phoenix';

const socket = new Socket('ws://localhost8000/socket/websocket');
socket.connect();

const channel = socket.channel('my_topic');
if (channel.state !== 'joined') {
  channel
    .join()
    .receive('ok', (resp) => {
      console.log('Joined my_topic channel', resp);
    })
    .receive('error', (resp) => {
      console.log('Unable to join my_topic channel', resp);
    });
}
channel.push('my_event_name', {
  message: 'One fish',
});
channel.push('my_event_name', {
  message: 'Red fish',
});
channel.on('my_event_name', (payload) => {
  console.log(payload); // First logs "Two fish", then "Blue fish"
});
*/
  initialise(
    url,
    responsePayloadFunc = () => {
      return { response: {}, status: 'ok' };
    }
  ) {
    try {
      const mockServer = new Server(url);
      console.log(mockServer.clients());
      mockServer.on('connection', (socket) => {
        this.socket = socket;
        socket.on('message', (incomingMessage) => {
          const incomingMessageObj = JSON.parse(incomingMessage);
          const incomingTopic = incomingMessageObj[2];
          const incomingEventName = incomingMessageObj[3];
          const incomingPayload = incomingMessageObj[4];
          let responsePayload;
          let responseEventName;
          if (['phx_join', 'heartbeat'].indexOf(incomingEventName) > -1) {
            responseEventName = 'phx_reply';
            responsePayload = {
              response: {},
              status: 'ok',
            };
          } else {
            responseEventName = incomingMessageObj[3];
            responsePayload = responsePayloadFunc(incomingTopic, incomingEventName, incomingPayload);
          }
          const response = this._generateResponse(incomingMessage, responseEventName, responsePayload);
          socket.send(response);
        });
      });
    } catch (err) {
      if (err.indexOf('A mock server is already listening on this url') > -1) {
        console.warn(err);
      } else {
        throw err;
      }
    }
  },

  // https://hexdocs.pm/phoenix/writing_a_channels_client.html#message-format
  // messageReference is chosen by the client and should be a unique value. The server includes it in its reply so that the client knows which message the reply is for.
  // joinReference is also chosen by the client and should also be a unique value. It only needs to be sent for a "phx_join" event; for other messages it can be null. It is used as a message reference for push messages from the server, meaning those that are not replies to a specific client message. For example, imagine something like "a new user just joined the chat room".
  // topicName must be a known topic for the socket endpoint, and a client must join that topic before sending any messages on it.
  // eventName must match the first argument of a handle_in function on the server channel module.
  // payload should be a map and is passed as the second argument to that handle_in function.

  _generateResponse(incomingMessage, eventName, payload) {
    incomingMessage = typeof incomingMessage === 'string' ? JSON.parse(incomingMessage) : incomingMessage;
    const messageReference = incomingMessage[0];
    const joinReference = incomingMessage[1];
    const topicName = incomingMessage[2];
    return JSON.stringify([messageReference, joinReference, topicName, eventName, payload]);
  },

  /**
 * Formats a push notification to be sent from the server to the client.
 * Note that this is only used for unpromted push notifications from the server to the client, and not for responses to client messages.
 * @param topic {string} - The channel topic to send the push notification to.
 * @param eventName {string} - The eventName of the notification
 * @param payload {object} - The payload to send to the client.
 * @example
import phoenixMockSocket from 'phoenix-socket-mock';

const pushNotification = phoenixMockSocket.formatPushNotification('my_topic', 'my_event_name', {
  message: 'This is a push notification from the server'
};
*/
  formatPushNotification(topic, eventName, payload) {
    return JSON.stringify([null, null, topic, eventName, payload]);
  },
  /**
 * Formats a push notification to be sent from the server to the client.
 * Note that this is only used for unpromted push notifications from the server to the client, and not for responses to client messages.
 * @param message {string} - The formatted message to send to the client (See formatPushNotification).
 * @example
import phoenixMockSocket from 'phoenix-socket-mock';

const pushNotification = phoenixMockSocket.formatPushNotification('my_topic', 'my_event_name', {
  message: 'This is a push notification from the server'
};
phoenixMockSocket.sendPushNotification(pushNotification);
*/
  sendPushNotification(message) {
    this.socket.send(message);
  },
};
