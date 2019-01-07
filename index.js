var OTAService = require('./ota_service.js')
var otaService = new OTAService()

var OTAUpdater = require('./ota_updater.js')
var otaUpdater = new OTAUpdater(otaService)

var PayloadProcessor = require('./payloadProcessor.js')
var payloadProcessor = new PayloadProcessor('./test/bootloadable.cyacd')
payloadProcessor.analyzeHeader()
payloadProcessor.readDataLines()

var _ = require('underscore');

//For Allowing user to select a device to update
var list = require('select-shell')(
  /* possible configs */
  {
    pointer: ' ▸ ',
    pointerColor: 'yellow',
    checked: ' ◉  ',
    unchecked:' ◎  ',
    checkedColor: 'blue',
    msgCancel: 'No selected options!',
    msgCancelColor: 'orange',
    multiSelect: false,
    inverse: true,
    prepend: true,
    disableInput: true
  }
);

var discoverTimeout = null;

function deviceAdded(device){
  clearTimeout(discoverTimeout)
  discoverTimeout = setTimeout(function(){
    _.each(otaService.devices, function (device, address) {
      list.option(device.name+" ("+device.address+")", device)
    });
    list.list();
  }, 5000)
}
function deviceUpdated(device){
  //
}

otaService.startDeviceScan(deviceAdded, deviceUpdated, function(err){
  console.log("Scan callback", err)
})

list.on('select', function(options){
  console.log(options);
  var device = options[0].value

  otaService.stopDeviceScan(function(){
    otaService.connect(device, function(err){
      console.log("Connect Callback", err)
      if(err){
        process.exit(0)
      }

      otaUpdater.start(payloadProcessor)
    })
  })
});

list.on('cancel', function(options){
  console.log('Cancel list, '+ options.length +' options selected');
  process.exit(0);
});


//Remove the disconnect hook
//Store the existing device to reconnect
//Set mode bootloader mode
//Disconnect
//Wait until service is discoverable
//Discover Service and Characteristics
//Connect to service
//InitiateDFU sequence
