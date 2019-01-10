var events = require('events')
var util = require('util')
var debug = require('debug')('cypress_dfu:ota_service')
var noble

if (process.platform === 'win32') {
  noble = require('noble-winrt')
} else if (process.platform === 'darwin') {
  noble = require('noble-mac')
} else {
  noble = require('noble')
}

// Bootloader Service
var OTA_SERVICE_UUID = '00060000-F8CE-11E4-ABF4-0002A5D5C51B'
// Bootloader Characteristic
var OTA_COMMAND_UUID = '00060001-F8CE-11E4-ABF4-0002A5D5C51B'// Notify/Write

// Application Service
var APPLICATION_SERVICE_UUID = '6E400001-B5A3-F393-E0A9-E50E24DCCA9E'
var APPLICATION_COMMAND_UUID = '6E400002-B5A3-F393-E0A9-E50E24DCCA9E'

var APPLICATION_MODE = 0
var BOOTLOADER_MODE = 1

var OTAService = function () {
  events.EventEmitter.call(this)
  var service = this
  service.state = 'notReady'
  service._scanning = false
  service.devices = {}
  service.mode = APPLICATION_MODE
  service.writeCharacteristic = null

  noble.on('stateChange', function (state) {
    if (state === 'poweredOn') {
      service.state = 'ready'
      service.emit('ready')
    } else {
      service.state = 'notReady'
    }
  })

  this.startDeviceScan = function (deviceAdded, deviceUpdated, callback) {
    var beginScan = function () {
      noble.startScanning([], true)
    }

    service.onDeviceDiscovered = function (peripheral) {
      if (!peripheral || !peripheral.advertisement || !peripheral.advertisement.localName) {
        return
      }
      if (peripheral.advertisement.localName.toLowerCase().indexOf('cubelet') === 0) {
        peripheral.btType = 'le'
        peripheral.name = peripheral.advertisement.localName

        if (peripheral.address in service.devices) {
          service.devices[peripheral.address] = peripheral
          deviceUpdated(peripheral)
        } else {
          service.devices[peripheral.address] = peripheral
          deviceAdded(peripheral)
        }
      }
    }

    noble.on('scanStart', function () {
      debug('Scan started')
      service._scanning = true
    })
    noble.on('scanStop', function () {
      debug('Scan stopped')
      service._scanning = false
      noble.removeListener('discover', service.onDeviceDiscovered)
    })
    noble.on('discover', service.onDeviceDiscovered)

    if (service.state !== 'ready') {
      setTimeout(function () {
        if (service.state !== 'ready') {
          noble._state = 'poweredOn'
          beginScan()
        }
      }, 300)
      service.once('ready', beginScan)
    } else if (service._scanning) {
      service.stopDeviceScan(beginScan)
    } else {
      beginScan()
    }
  }

  this.stopDeviceScan = function (callback) {
    noble.stopScanning()
    callback(null)
  }

  this.connect = function (device, callback) {
    device.once('connect', function () {
      debug('Connected...Discovering Services/Characteristics')
      device.discoverSomeServicesAndCharacteristics([OTA_SERVICE_UUID, APPLICATION_SERVICE_UUID], [OTA_COMMAND_UUID, APPLICATION_COMMAND_UUID], function (err, services, characteristics) {
        if (err) {
          console.error(err)
        }
        if (service.mode === APPLICATION_MODE) {
          debug('device is in application mode.')
          var applicationCharacteristic = characteristics.find(characteristic => characteristic.uuid === formatUUID(APPLICATION_COMMAND_UUID))

          device.once('disconnect', function () {
            setTimeout(function () {
              service.connect(device, callback)
            }, 1000)
          })

          // Set to bootloader mode, disconnect, and reconnect in a second
          var ar = []
          ar[0] = '<'.charCodeAt(0)
          ar[1] = 0x03
          ar[2] = 1
          ar[3] = '>'.charCodeAt(0)
          ar[4] = 0
          applicationCharacteristic.write(toBuffer(ar), true, function () {
            service.mode = BOOTLOADER_MODE
          })
          return
        }
        service.writeCharacteristic = characteristics.find(characteristic => characteristic.uuid === formatUUID(OTA_COMMAND_UUID))
        service.writeCharacteristic.subscribe(function (err) {
          if (err) {
            debug('Subscribe Error: ', err)
            callback(err)
            return
          }
          debug('Subscribed to TX_CHAR.')
          service.writeCharacteristic.on('data', function (data) {
            debug('Received: ', data)
            service.emit('data', data)
          })
          callback(null)
        })
      })
    })

    device.on('disconnect', function () {
      debug('Disconnected')
    })

    device.connect(function (err) {
      if (err) {
        callback(err)
      }
    })
  }

  this.writeOTABootLoaderCommand = function (command, callback) {
    var payload = toBuffer(command)
    debug('Sending: ', payload)
    service.writeCharacteristic.write(payload, false, callback)
  }
}

function formatUUID (uuid) {
  return uuid.replace(/-/g, '').toLowerCase()
}

function toBuffer (ab) {
  return Buffer.from(ab)
}

util.inherits(OTAService, events.EventEmitter)
module.exports = OTAService
