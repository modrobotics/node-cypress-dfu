# Cypress Firmware Updater

`cypress-dfu` is a BLE connection agnostic library for performing firmware updates
to [Cypress](http://www.cypress.com/) radios running the Cypress OTA DFU Bootloader.

In order to use `cypress-dfu` a connection needs to be established using another library such as [noble](https://github.com/noble/noble) (see the example for such a use case).

This library is a javascript port of the code found in the official [Cypress CySmart Mobile App](http://www.cypress.com/documentation/software-and-drivers/cysmart-mobile-app).

## Requirements
- An established connection to the Cypress radio to be updated.
- A handle for sending data to the DFU characteristic
- A way to pass data received from the Cypress DFU characteristic into `cypress-dfu`
- node v6.14.2 or later for the [noble](https://github.com/noble/noble) example.

## Installing
`npm install`


## Using
```javascript
var CypressDFU = require('cypress-dfu')

//Attach listeners
CypressDFU.on('progress', function (progress) {
  console.log(['Flashing... ', progress, '%'].join(''))
})
CypressDFU.on('flashStart', function () {
  console.log('Flashing...')
})
CypressDFU.on('flashFinished', function () {
  console.log('Flashing...Success')
})
CypressDFU.on('error', function (err, code, message) {
  console.log(err, code, message)
})

//Pipe data received from your connection into the updater
yourConnection.on('data', function (data) {
  CypressDFU.onData(data)
})

CypressDFU.startUpdate(payload, yourMethodToSendData)

```
## Methods
### startUpdate(payload, writeMethod)
Begins the DFU process.
- `payload` (String)
  - Contents of the .cyacd bootloadable file that should be flashed
- `writeMethod` (Method)
  - A method, or helper used to send data to the DFU Characteristic
  - Needs to match interface: `function writeMethod(data, callback)`
    - `data` (Array) bytes to be sent to the Cypress radio
    - `callback` (Method) callback for when write has completed

### onData(data)
Used to pipe data received over the BLE connection to the updater.
- `data` (Array) bytes received over the BLE link.

## Events
Events emitted by `cypress-dfu`.
Event handlers can be attached by:

```javascript
var CypressDFU = require('cypress-dfu')
CypressDFU.on([event_name], [params...])
```

### flashStart
Emitted once the DFU process has begun.
```javascript
CypressDFU.on('flashStart', function(){
  //
})
```

### flashFinished
Emitted once the DFU process has completed successfully.
```javascript
CypressDFU.on('flashFinished', function(){
  //
})
```

### error
Emitted for any errors that occur during DFU. An error indicates the DFU process has failed.
```javascript
CypressDFU.on('error', function(error, message, code){
  //
})
```

### progress
Progress events while DFU is occurring. Where `progress` is a percentage 0-100.
```javascript
CypressDFU.on('progress', function(progress){
  //
})
```

# Flashing Flow
Flow captured from debugging the CySmart app. See `output.log` for the full dump.
```
Check Sum type comes from CYACD HEADER. Either Summation or CRC16

PACKET STRUCTURE
START COMMAND LEN1 LEN2 C7 FF END
  START : 1
  COMMAND: 0xZZ
  LEN1 (LSB):
  LEN2 (MSB):
  DATA: dataLength number of bytes
  CSUM1 (LSB) crc16:
  CSUM2 (MSB) crc16:
  END: 17

RESPONSE
  01 STATUS ROW_START_

OTAEnterBootLoaderCmd
 Write request sent with value , [ 01 38 00 00 C7 FF 17  ]

 Response
 01 00 08 00 9E 11 50 0E 00 3C 01 01 AC FE 17

 OTAGetFlashSizeCmd
 Write request sent with value , [ 01 32 01 00 01 CB FF 17  ]

 Response
 01 00 04 00 D5 00 FF 01 26 FE 17

Loop:
   OTAProgramRowCmd send size--->138
   Write request sent with value , [ 01 39 83 00 01 D5 00 00 40 00 20 91 6A 01 00 F1 CB 01 00 F1 CB 01 00 80 B5 00 AF 02 4B 83 F3 08 88 06 F0 DB F8 C0 46 00 40 00 20 80 B5 00 AF 37 4B 12 22 1A 60 07 F0 3F FD 36 4B 18 00 07 F0 77 FF 01 20 07 F0 48 FD 30 20 07 F0 53 FB 32 4B 32 4A 1A 60 32 4B 80 22 D2 05 1A 60 31 4B 31 4A 12 68 02 21 0A 43 1A 60 2F 4B 30 4A 1A 60 30 4B 00 22 1A 60 2F 4B 2F 4A 12 68 08 21 8A 43 1A 60 FA 23 DB 00 18 00 07 F0 4B D5 17  ]

   OTAVerifyRowCmd
   Write request sent with value , [ 01 3A 03 00 01 D5 00 EC FE 17  ]

OTAVerifyCheckSumCmd
Write request sent with value , [ 01 31 00 00 CE FF 17  ]

OTAExitBootloaderCmd
 Write request sent with value , [ 01 3B 00 00 C4 FF 17  ]

Reponse Byte Exit>>00
Fragment Exit bootloader response>>00
```
