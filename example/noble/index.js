var fs = require('fs')
var CypressDFU = require('../../')

var OTAService = require('./service.js')
var otaService = new OTAService()

var ProgressBar = require('cli-progress')
var progressBar = new ProgressBar.Bar({}, ProgressBar.Presets.shades_classic)

var _ = require('underscore')

// For allowing user to select a device to update
var list = require('select-shell')(
  /* possible configs */
  {
    pointer: ' ▸ ',
    pointerColor: 'yellow',
    checked: ' ◉  ',
    unchecked: ' ◎  ',
    checkedColor: 'blue',
    msgCancel: 'No selected options!',
    msgCancelColor: 'orange',
    multiSelect: false,
    inverse: true,
    prepend: true,
    disableInput: true
  }
)

// On Device select
list.on('select', function (options) {
  var device = options[0].value
  otaService.stopDeviceScan(function () {
    otaService.connect(device, function (err) {
      if (err) {
        console.log('Connecting Failed, please try again.')
        process.exit(0)
      }

      var payloadPath = './test/bootloadable.cyacd'
      var payload = fs.readFileSync(payloadPath, 'utf8')

      otaService.on('data', function (data) {
        CypressDFU.onData(data)
      })

      CypressDFU.startUpdate(payload, otaService.writeOTABootLoaderCommand)
    })
  })
})

list.on('cancel', function (options) {
  console.log('Cancel list, ' + options.length + ' options selected')
  process.exit(0)
})

CypressDFU.on('progress', function (percentage) {
  progressBar.update(percentage)
})
CypressDFU.on('flashStart', function () {
  console.log('Flashing...')
  progressBar.start(100, 0)
})
CypressDFU.on('flashFinished', function () {
  progressBar.stop()
  console.log('Flashing...Success')
  process.exit()
})
CypressDFU.on('error', function (err, code, message) {
  console.log(err, code, message)
  process.exit()
})

var discoverTimeout = null

function deviceAdded (device) {
  clearTimeout(discoverTimeout)

  // After 5 seconds of not seeing a new device, show the list.
  discoverTimeout = setTimeout(function () {
    _.each(otaService.devices, function (device, address) {
      list.option(device.name + ' (' + device.address + ')', device)
    })
    console.log('Select a Cypress device to update:')
    list.list()
  }, 5000)
}

function deviceUpdated (device) {
  //
}

otaService.startDeviceScan(deviceAdded, deviceUpdated, function (err) {
  if (err) {
    console.error(err)
  }
})
