var OTAService = require('./ota_service.js')
var otaService = new OTAService()

var OTAWriter = require('./ota_writer.js')
var otaWriter = new OTAWriter(otaService)

var OTAReader = require('./ota_reader.js')
var otaReader = new OTAReader()

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

otaService.on('data', function(data){
  console.log(data);
  data = data.toString('hex');
  otaReader.parseEnterBootLoaderAcknowledgement(data, function(err, siliconID, siliconRev){
    console.log(err, siliconID, siliconRev)
  })
})


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
        return
      }
      otaWriter.OTAEnterBootLoaderCmd(0, function(err){
        console.log(err)
      })
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

//Adjust MTU 138?

//ENTER_BOOTLOADER
//Wait for response
//GET_FLASH_SIZE
//wait for response
//SEND_DATA
//wait for response
//PROGRAM_ROW
//wait for response
//VERIFY_ROW
//wait for response
//VERIFY_CHECK_SUM
//wait for response
//EXIT_BOOTLOADER
//wait for response
//done
