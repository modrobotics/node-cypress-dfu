var OTAService = require('./ota_service.js')
var otaService = new OTAService()

var OTAUpdater = require('./ota_updater.js')
var otaUpdater = new OTAUpdater(otaService)

var PayloadProcessor = require('./payloadProcessor.js')
var payloadProcessor = new PayloadProcessor('./test/bootloadable.cyacd')
payloadProcessor.analyzeHeader()
payloadProcessor.readDataLines()

var ProgressBar = require('cli-progress');
var progressBar = new ProgressBar.Bar({}, ProgressBar.Presets.shades_classic);

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
    console.log("Select a Cubelet Hat to flash:")
    list.list();
  }, 5000)
}
function deviceUpdated(device){
  //
}

otaService.startDeviceScan(deviceAdded, deviceUpdated, function(err){

})

list.on('select', function(options){
  var device = options[0].value

  otaService.stopDeviceScan(function(){
    otaService.connect(device, function(err){
      if(err){
        console.log("Connecting Failed, please try again.")
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

otaUpdater.on('progress', function(percentage){
  progressBar.update(percentage)
})
otaUpdater.on('flashStart', function(percentage){
  console.log("Flashing...")
  progressBar.start(100,0)
})
otaUpdater.on('flashFinished', function(){
  progressBar.stop()
  console.log("Flashing...Success")
  process.exit();
})
otaUpdater.on('error', function(err, code, message){
  console.log(err, code, message)
  process.exit()
})
