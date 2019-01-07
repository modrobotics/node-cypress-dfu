var events = require('events')
var util = require('util');
var debug = require('debug')('cypress_dfu:ota_service')
var noble;

if(process.platform === "win32"){
  noble = require('noble-winrt');
}
else if(process.platform === "darwin"){
  noble = require('noble-mac');
}
else{
  noble = require('noble');
}

//Service
var SERVICE_UUID =  '00060000-F8CE-11E4-ABF4-0002A5D5C51B';
//Characteristic
var COMMAND_UUID =  '00060001-F8CE-11E4-ABF4-0002A5D5C51B';//Notify/Write

var OTAService = function(){
  events.EventEmitter.call(this);
  var service = this;
  service.state = "notReady";
  service._scanning = false
  service.devices = {}

  noble.on('stateChange', function(state) {
    if (state === 'poweredOn') {
      service.state = "ready";
      service.emit("ready");
    }
    else{
      service.state = "notReady";
    }
  });

  this.startDeviceScan = function(device_added, device_updated, callback){
    var beginScan = function(){
      noble.startScanning([], true);
    }

    service.onDeviceDiscovered = function(peripheral){
      if(!peripheral || !peripheral.advertisement || !peripheral.advertisement.localName){
        return;
      }
      if(peripheral.advertisement.localName.toLowerCase().indexOf('cubelet') === 0)
      {
        peripheral.btType = 'le';
        peripheral.name = peripheral.advertisement.localName

        if(peripheral.address in service.devices){
          service.devices[peripheral.address] = peripheral
          device_updated(peripheral)
        }
        else{
          service.devices[peripheral.address] = peripheral
          device_added(peripheral)
        }
      }
    }

    noble.on('scanStart', function(){
      debug("Scan started");
      service._scanning = true;
    });
    noble.on('scanStop', function(){
      debug("Scan stopped");
      service._scanning = false;
      noble.removeListener('discover', service.onDeviceDiscovered);
    });
    noble.on('discover', service.onDeviceDiscovered);

    if(service.state != "ready"){
      setTimeout(function(){
        if(service.state != "ready"){
          noble._state = "poweredOn";
          beginScan();
        }
      }, 300)
      service.once('ready', beginScan);
    }
    else if(service._scanning){
      service.stopDeviceScan(beginScan);
    }
    else{
      beginScan();
    }
  }

  this.stopDeviceScan = function (callback) {
    noble.stopScanning();
    callback(null);
  }

  this.connect = function(device, callback){
    device.once('connect', function(){
      debug("Connected...Discovering Services/Characteristics")
      device.discoverSomeServicesAndCharacteristics([SERVICE_UUID], [COMMAND_UUID], function(err, services, characteristics){
        writeCharacteristic = characteristics.find( characteristic => characteristic.uuid === formatUUID(COMMAND_UUID) );
        writeCharacteristic.subscribe(function(err){
          if(err){
            debug("Subscribe Error: ", err)
            callback(err);
            return;
          }
          debug("Subscribed to TX_CHAR.")
          writeCharacteristic.on('data', function(data){
            debug("Received: ", data)
            service.emit("data", data);
          });
          callback(null);
        });
      })
    });

    device.once('disconnect', function(){
      console.log("Disconnected")
    });

    device.connect(function(err){
      if(err){
        callback(err)
      }
    });
  }

  this.writeOTABootLoaderCommand = function (command, callback){
    var payload = toBuffer(command)
    debug("Sending: ", payload)
    writeCharacteristic.write(payload, false, callback);
  }
}

function uuidCompare(uuid1, uuid2){
  uuid1 = formatUUID(uuid1);
  uuid2 = formatUUID(uuid2);
  return uuid1 == uuid2;
}

function formatUUID(uuid){
  return uuid.replace(/-/g, "").toLowerCase();
}

// function toArrayBuffer(arr){
//   var r = new Uint8Array(arr);
//   return r.buffer;
// }
//
function toBuffer(ab){
  return Buffer.from(ab)
}

// function byteArrayToHexBuffer(ar){
//   var s = ""
//   ar.forEach(function(value){
//     s += d2h(value) + " "
//   })
//   console.log(ar)
//   console.log(s)
//   return Buffer.from(s.trim(), 'utf8');
// }
//
// function d2h(d) {
//   var s = d.toString(16);
//   if(s.length < 2) {
//       s = '0' + s;
//   }
//   else if(s.length > 2){
//     //TODO!s =
//   }
//   return s.toUpperCase();
//
//   //return s.padStart(2, '0').toUpperCase()
// }

util.inherits(OTAService, events.EventEmitter);
module.exports = OTAService
