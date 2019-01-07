var debug = require('debug')("cypress-dfu:ota_updater")

var ENTER_BOOTLOADER_REQ = 1
var ENTER_BOOTLOADER_RES = 2
var GET_FLASH_SIZE_REQ = 3
var GET_FLASH_SIZE_RES = 4
var PROGRAM_ROW_SEND_DATA_REQ = 5
var PROGRAM_ROW_SEND_DATA_RES = 6
var PROGRAM_ROW_REQ = 7
var PROGRAM_ROW_RES = 8
var VERIFY_ROW_REQ = 9
var VERIFY_ROW_RES = 10
var VERIFY_CHECKSUM_REQ = 11
var VERIFY_CHECKSUM_RES = 12
var EXIT_BOOTLOADER_REQ = 13
var EXIT_BOOTLOADER_RES = 14
var FINISHED = 15

//Adjust MTU 138?
var OTAUpdater = function(otaService){
  var OTAWriter = require('./ota_writer.js')
  var otaWriter = new OTAWriter(otaService)

  var OTAReader = require('./ota_reader.js')
  var otaReader = new OTAReader()

  var updater = this
  updater.currentState = ENTER_BOOTLOADER_REQ

  otaService.on('data', function(data){
    data = data.toString('hex');
    updater.doState(updater.currentState, data)
  })

  this.start = function(payload){
    updater.payload = payload
    updater.doState(updater.currentState)
  }

  this.doState = function(state, data){
    debug("Performing state: "+state)
    switch(state){
      case ENTER_BOOTLOADER_REQ:
        updater.currentState = ENTER_BOOTLOADER_RES;
        otaWriter.OTAEnterBootLoaderCmd(updater.payload.checkSumType, function(err){
          if(err){
            updater.handleError(err)
            return
          }
        })
      break;
      case ENTER_BOOTLOADER_RES:
        otaReader.parseEnterBootLoaderAcknowledgement(data, function(err, siliconID, siliconRev){
          if(err){
            updater.handleError(err)
            return
          }
          else if(siliconID != updater.payload.siliconID || siliconRev != updater.payload.siliconRev){
            var message = "Payload is for incorrect silicon. Expected siliconID: "+
              siliconID +
              " siliconRev: " +
              siliconRev +
              " got siliconID: " +
              updater.payload.siliconID +
              " siliconRev: " +
              updater.payload.siliconRev;
            updater.handleError(new Error(message))
            return
          }

          updater.currentState = GET_FLASH_SIZE_REQ;
          updater.doState(updater.currentState)
        })
      break;
      case GET_FLASH_SIZE_REQ:
      updater.currentState = GET_FLASH_SIZE_RES;
        otaWriter.OTAGetFlashSizeCmd([updater.payload.flashDataLines[0].arrayID], updater.payload.checkSumType, 1, function(err){
          if(err){
            updater.handleError(err)
            return
          }
        })
      break;
      case GET_FLASH_SIZE_RES:
        otaReader.parseGetFlashSizeAcknowledgement(data, function(err, startRow, endRow){
          if(err){
            updater.handleError(err)
            return
          }
          updater.startRow = startRow
          updater.endRow = endRow

          updater.currentState = PROGRAM_ROW_SEND_DATA_REQ
          updater.doState(updater.currentState)
        })
      break;
      case PROGRAM_ROW_SEND_DATA_REQ:
        updater.currentState = PROGRAM_ROW_SEND_DATA_RES;
        //TODO: We might not need this???

        //TODO data
        otaWriter.OTAProgramRowSendDataCmd(data, updater.payload.checkSumType, function(err){
          if(err){
            updater.handleError(err)
            return
          }
        })
      break;
      case PROGRAM_ROW_SEND_DATA_RES:
        otaReader.parseParseSendDataAcknowledgement(data, function(err, status){
          if(err){
            updater.handleError(err)
            return
          }
          updater.currentState = PROGRAM_ROW_REQ
          updater.doState(updater.currentState)
        })
      break;
      case PROGRAM_ROW_REQ:
      //TODO data
        updater.currentState = PROGRAM_ROW_RES;
        otaWriter.OTAProgramRowSendDataCmd(data, updater.payload.checkSumType, function(err){
          if(err){
            updater.handleError(err)
            return
          }
        })
      break;
      case PROGRAM_ROW_RES:
        otaReader.parseParseRowAcknowledgement(data, function(err, status){
          if(err){
            updater.handleError(err)
            return
          }
          updater.currentState = VERIFY_ROW_REQ
          updater.doState(updater.currentState)
        })
      break;
      case VERIFY_ROW_REQ:
        updater.currentState = VERIFY_ROW_RES;
        otaWriter.OTAVerifyRowCmd(rowMSB, rowLSB, model, updater.payload.checkSumType, function(err){
          if(err){
            updater.handleError(err)
            return
          }
        })
      break;
      case VERIFY_ROW_RES:
        otaReader.parseVerifyRowAcknowledgement(data, function(err, response, data){
          if(err){
            updater.handleError(err)
            return
          }

          //TODO!!
          updater.currentState = PROGRAM_ROW_REQ
          updater.doState(updater.currentState)
        })
      break;
      case VERIFY_CHECKSUM_REQ:
        updater.currentState = VERIFY_CHECKSUM_RES;
        otaWriter.OTAVerifyCheckSumCmd(updater.payload.checkSumType, function(err){
          if(err){
            updater.handleError(err)
            return
          }
        })
      break;
      case VERIFY_CHECKSUM_RES:
        otaReader.parseVerifyCheckSum(data, function(err, checkSumStatus){
          if(err){
            updater.handleError(err)
            return
          }
          updater.doState(updater.currentState)
        })
      break;
      case EXIT_BOOTLOADER_REQ:
        otaWriter.OTAExitBootloaderCmd(updater.payload.checkSumType, function(err){
          if(err){
            updater.handleError(err)
            return
          }
        })
      break;
      case EXIT_BOOTLOADER_RES:
        otaReader.parseExitBootloader(data, function(err, response){
          if(err){
            updater.handleError(err)
            return
          }
          updater.doState(updater.currentState)
        })
      break;

      case FINISHED:
        //Cleanup, emit final event
      break;
    }
  }

  this.handleError = function(err){
    console.log("!!!!!!!!!!!!!!!!!!!!!!!ERROR: ", err)
  }
}

module.exports = OTAUpdater
