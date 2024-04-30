<a name="module_phoenixMockSocket"></a>

## phoenixMockSocket

* [phoenixMockSocket](#module_phoenixMockSocket)
    * [.initialise(url, responsePayloadFunc)](#module_phoenixMockSocket.initialise)
    * [.formatPushNotification(topic, eventName, payload)](#module_phoenixMockSocket.formatPushNotification)
    * [.sendPushNotification(message)](#module_phoenixMockSocket.sendPushNotification)

<a name="module_phoenixMockSocket.initialise"></a>

### phoenixMockSocket.initialise(url, responsePayloadFunc)
Starts the server socket connection at the url passed.
Provides out of the box handling of the built in `phx_join` and `heartbeat` events.
Responds to custom incoming messages from the client by applying the result of `responsePayloadFunc` argument

**Kind**: static method of [<code>phoenixMockSocket</code>](#module_phoenixMockSocket)  

| Param | Type | Description |
| --- | --- | --- |
| url | <code>string</code> | The url of the web socket connection to start. This should be the same as the url of the actual web socket connection that your client will attempt to join. |
| responsePayloadFunc | <code>function</code> | Returns the payload to use in response to an incoming message from the client. Receives the incoming topic, eventName and payload as arguments, and must return the response payload in the form of an object. |

**Example**  
```js
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
```
<a name="module_phoenixMockSocket.formatPushNotification"></a>

### phoenixMockSocket.formatPushNotification(topic, eventName, payload)
Formats a push notification to be sent from the server to the client.
Note that this is only used for unpromted push notifications from the server to the client, and not for responses to client messages.

**Kind**: static method of [<code>phoenixMockSocket</code>](#module_phoenixMockSocket)  

| Param | Type | Description |
| --- | --- | --- |
| topic | <code>string</code> | The channel topic to send the push notification to. |
| eventName | <code>string</code> | The eventName of the notification |
| payload | <code>object</code> | The payload to send to the client. |

**Example**  
```js
import phoenixMockSocket from 'phoenix-socket-mock';

const pushNotification = phoenixMockSocket.formatPushNotification('my_topic', 'my_event_name', {
  message: 'This is a push notification from the server'
};
```
<a name="module_phoenixMockSocket.sendPushNotification"></a>

### phoenixMockSocket.sendPushNotification(message)
Formats a push notification to be sent from the server to the client.
Note that this is only used for unpromted push notifications from the server to the client, and not for responses to client messages.

**Kind**: static method of [<code>phoenixMockSocket</code>](#module_phoenixMockSocket)  

| Param | Type | Description |
| --- | --- | --- |
| message | <code>string</code> | The formatted message to send to the client (See formatPushNotification). |

**Example**  
```js
import phoenixMockSocket from 'phoenix-socket-mock';

const pushNotification = phoenixMockSocket.formatPushNotification('my_topic', 'my_event_name', {
  message: 'This is a push notification from the server'
};
phoenixMockSocket.sendPushNotification(pushNotification);
```
