# WS Connect

WS Connect is a wrapper for the [ws](https://github.com/websockets/ws) WebSocket client for Node.js that will automatically reconnect lost or disconnected WebSocket connections transparently.

This module is for Node.js 10+ only and will not work in the browser. The server implementation must respond to `ping` messages as required by the WebSocket spec.

## Install

```
npm install @oznu/ws-connect
```

## Usage

### Example

```js
const { WebSocket } = require('@oznu/ws-connect')

// establish new websocket connection
const socket = new WebSocket('ws://127.0.0.1:8080')

// send message to server
socket.send('some message')

// send json to server
socket.sendJson({hello: 'world'})

// listen for messages from server
socket.on('message', (msg) => {
  console.log(msg)
})

// listen for json from server
socket.on('json', (data) => {
  console.log(data)
})

// emitted each time the websocket connection is established
socket.on('open', () => {
  console.log('Websocket Connection Established')
})

// emitted each time the websocket connection disconnects
socket.on('close', () => {
  console.log('Websocket Connection Closed')
})

// listen for websocket status events, connect and disconnect events, errors, etc.
socket.on('websocket-status', (status) => {
  console.log(status)
})
```

## Class WebSocket

This class represents a WebSocket. It extends the `EventEmitter`.

### new WebSocket(address, [options])

* `address` {String} The URL to which to connect.
  * `reconnectInterval` {Number} The interval in milliseconds between connection attempts. Default 5000.
  * `pingInterval` {Number} The interval in milliseconds that the client should ping the server. Default 10000.
  * `pingFailureLimit` {Number} The number of failed pings before a reconnection is attempted. Default 2.
  * `beforeConnect` {Promise} A function that returns a promise that is to be called before (re)connecting to the server.
  * `protocols` {String|Array} The list of subprotocols.
  * `options` {Object} The [ws](https://github.com/websockets/ws) client connection options. See [docs](https://github.com/websockets/ws/blob/master/doc/ws.md#new-websocketaddress-protocols-options).

### socket.ws

The original [ws](https://github.com/websockets/ws/blob/master/doc/ws.md#class-websocket) client connection.

### socket.send(data[, callback])

* `data` {Any} The data to send.
* `callback` {Function} An optional callback which is invoked when data is written out.

### socket.sendJson(data[, callback])

The same as `socket.send` except the data will be `JSON.stringified` before being sent.

### socket.close()

Closes the WebSocket connection and halts reconnection attempts.

### Event: 'message'

* `data` {String|Buffer|ArrayBuffer|Buffer[]}

Emitted when a message is received from the server.

### Event: 'json'

Emitted when a json data is received from the server.

### Event: 'open'

Emitted when the connection is established

### Event: 'close'

* `code` {Number}
* `reason` {String}

Emitted when the connection is closed. `code` is a numeric value indicating the status code explaining why the connection has been closed. `reason` is a human-readable string explaining why the connection has been closed.

### Event: 'websocket-status'

* `message` {String}

Emits human-readable messages regarding the status of the WebSocket connection such as disconnect and reconnecting events, ping timeouts, and errors. Useful for debugging.
