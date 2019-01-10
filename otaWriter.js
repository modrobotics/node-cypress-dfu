var BootLoaderCommands = require('./otaCommands')
var OTAUtil = require('./otaUtil.js')
var debug = require('debug')('cypressDFU:otaWriter')

var OTAFirmwareWrite = function (writeMethod) {
  var BYTE_START_CMD = 0
  var BYTE_CMD_TYPE = 1
  var BYTE_CMD_DATA_SIZE = 2
  var BYTE_CMD_DATA_SIZE_SHIFT = 3
  var BYTE_CHECKSUM = 4
  var BYTE_CHECKSUM_SHIFT = 5
  var BYTE_PACKET_END = 6

  var BYTE_PACKET_END_VER_ROW = 9
  var BYTE_ARRAY_ID = 4
  var BYTE_ROW = 5
  var BYTE_ROW_SHIFT = 6
  var BYTE_CHECKSUM_VER_ROW = 7
  var BYTE_CHECKSUM_VER_ROW_SHIFT = 8

  var RADIX = 16
  var ADDITIVE_OP = 8

  this.OTAEnterBootLoaderCmd = function (checkSumType, callback) {
    var startCommand = 0x01
    var dataLength0 = 0x00
    var dataLength1 = 0x00

    var commandBytes = []
    commandBytes[BYTE_START_CMD] = startCommand
    commandBytes[BYTE_CMD_TYPE] = BootLoaderCommands.ENTER_BOOTLOADER
    commandBytes[BYTE_CMD_DATA_SIZE] = dataLength0
    commandBytes[BYTE_CMD_DATA_SIZE_SHIFT] = dataLength1
    var checksum = OTAUtil.calculateCheckSum(parseInt(checkSumType, RADIX), commandBytes)
    commandBytes[BYTE_CHECKSUM] = checksum
    commandBytes[BYTE_CHECKSUM_SHIFT] = (checksum >> ADDITIVE_OP)
    commandBytes[BYTE_PACKET_END] = BootLoaderCommands.PACKET_END
    debug('OTAEnterBootLoaderCmd')
    writeOTABootLoaderCommand(commandBytes, callback)
  }

  this.OTAGetFlashSizeCmd = function (data, checkSumType, dataLength, callback) {
    debug('OTAGetFlashSizeCmd', data, checkSumType, dataLength)
    var commandBytes = []
    var startCommand = 0x01
    commandBytes[BYTE_START_CMD] = startCommand
    commandBytes[BYTE_CMD_TYPE] = BootLoaderCommands.GET_FLASH_SIZE
    commandBytes[BYTE_CMD_DATA_SIZE] = dataLength
    commandBytes[BYTE_CMD_DATA_SIZE_SHIFT] = (dataLength >> ADDITIVE_OP)
    var dataByteLocationStart = 4
    var datByteLocationEnd
    for (var count = 0; count < dataLength; count++) {
      commandBytes[dataByteLocationStart] = data[count]
      dataByteLocationStart++
    }
    datByteLocationEnd = dataByteLocationStart
    var checksum = OTAUtil.calculateCheckSum(parseInt(checkSumType, RADIX), commandBytes)
    commandBytes[datByteLocationEnd] = checksum
    commandBytes[datByteLocationEnd + 1] = (checksum >> ADDITIVE_OP)
    commandBytes[datByteLocationEnd + 2] = BootLoaderCommands.PACKET_END
    debug('OTAGetFlashSizeCmd')
    writeOTABootLoaderCommand(commandBytes, callback)
  }

  this.OTAProgramRowSendDataCmd = function (data, checksumType, callback) {
    var totalSize = BootLoaderCommands.BASE_CMD_SIZE +
                data.length
    var checksum
    var commandBytes = []
    var startCommand = 0x01

    commandBytes[BYTE_START_CMD] = startCommand
    commandBytes[BYTE_CMD_TYPE] = BootLoaderCommands.SEND_DATA
    commandBytes[BYTE_CMD_DATA_SIZE] = (data.length)
    commandBytes[BYTE_CMD_DATA_SIZE_SHIFT] = (((data.length) >> ADDITIVE_OP))

    debug('OTAProgramRowSendDataCmd', commandBytes)
    debug(data)

    for (var i = 1; i < data.length; i++) { commandBytes[i + 4] = data[i] }
    checksum = OTAUtil.calculateCheckSum(parseInt(checksumType, RADIX), commandBytes)
    commandBytes[totalSize - 3] = checksum
    commandBytes[totalSize - 2] = (checksum >> ADDITIVE_OP)
    commandBytes[totalSize - 1] = BootLoaderCommands.PACKET_END
    debug('OTAProgramRowSendDataCmd Send size--->' + commandBytes.length)
    writeOTABootLoaderCommand(commandBytes, callback)
  }

  this.OTAProgramRowCmd = function (rowMSB, rowLSB, arrayID, data, checkSumType, callback) {
    var COMMAND_DATA_SIZE = 3
    var totalSize = BootLoaderCommands.BASE_CMD_SIZE + COMMAND_DATA_SIZE +
                data.length
    var checksum
    var i
    var commandBytes = []
    var startCommand = 0x01

    commandBytes[BYTE_START_CMD] = startCommand
    commandBytes[BYTE_CMD_TYPE] = BootLoaderCommands.PROGRAM_ROW
    commandBytes[BYTE_CMD_DATA_SIZE] = (data.length + COMMAND_DATA_SIZE)
    commandBytes[BYTE_CMD_DATA_SIZE_SHIFT] = (((data.length + COMMAND_DATA_SIZE) >> ADDITIVE_OP))
    commandBytes[BYTE_ARRAY_ID] = arrayID
    commandBytes[BYTE_ROW] = rowMSB
    commandBytes[6] = rowLSB
    for (i = 0; i < data.length; i++) { commandBytes[i + 7] = data[i] }
    checksum = OTAUtil.calculateCheckSum(parseInt(checkSumType, RADIX), commandBytes)
    commandBytes[totalSize - 3] = checksum
    commandBytes[totalSize - 2] = (checksum >> ADDITIVE_OP)
    commandBytes[totalSize - 1] = BootLoaderCommands.PACKET_END
    debug('OTAProgramRowCmd send size--->' + commandBytes.length)
    writeOTABootLoaderCommand(commandBytes, callback)
  }

  this.OTAVerifyRowCmd = function (rowMSB, rowLSB, model, checkSumType, callback) {
    var COMMAND_DATA_SIZE = 3
    var checksum
    var commandBytes = []
    var startCommand = 0x01

    commandBytes[BYTE_START_CMD] = startCommand
    commandBytes[BYTE_CMD_TYPE] = BootLoaderCommands.VERIFY_ROW
    commandBytes[BYTE_CMD_DATA_SIZE] = (COMMAND_DATA_SIZE)
    commandBytes[BYTE_CMD_DATA_SIZE_SHIFT] = (COMMAND_DATA_SIZE >> ADDITIVE_OP)
    commandBytes[BYTE_ARRAY_ID] = model.arrayID
    commandBytes[BYTE_ROW] = rowMSB
    commandBytes[BYTE_ROW_SHIFT] = rowLSB
    checksum = OTAUtil.calculateCheckSum(parseInt(checkSumType, RADIX), commandBytes)
    commandBytes[BYTE_CHECKSUM_VER_ROW] = checksum
    commandBytes[BYTE_CHECKSUM_VER_ROW_SHIFT] = (checksum >> ADDITIVE_OP)
    commandBytes[BYTE_PACKET_END_VER_ROW] = BootLoaderCommands.PACKET_END
    debug('OTAVerifyRowCmd')
    writeOTABootLoaderCommand(commandBytes, callback)
  }

  this.OTAVerifyCheckSumCmd = function (checkSumType, callback) {
    var checksum
    var commandBytes = []
    var startCommand = 0x01

    commandBytes[BYTE_START_CMD] = startCommand
    commandBytes[BYTE_CMD_TYPE] = BootLoaderCommands.VERIFY_CHECK_SUM
    commandBytes[BYTE_CMD_DATA_SIZE] = (0)
    commandBytes[BYTE_CMD_DATA_SIZE_SHIFT] = (0)
    checksum = OTAUtil.calculateCheckSum(parseInt(checkSumType, RADIX), commandBytes)
    commandBytes[BYTE_CHECKSUM] = checksum
    commandBytes[BYTE_CHECKSUM_SHIFT] = (checksum >> ADDITIVE_OP)
    commandBytes[BYTE_PACKET_END] = BootLoaderCommands.PACKET_END
    debug('OTAVerifyCheckSumCmd')
    writeOTABootLoaderCommand(commandBytes, callback)
  }

  this.OTAExitBootloaderCmd = function (checkSumType, callback) {
    var COMMAND_DATA_SIZE = 0x00
    var checksum
    var commandBytes = []
    var startCommand = 0x01

    commandBytes[BYTE_START_CMD] = startCommand
    commandBytes[BYTE_CMD_TYPE] = BootLoaderCommands.EXIT_BOOTLOADER
    commandBytes[BYTE_CMD_DATA_SIZE] = (COMMAND_DATA_SIZE)
    commandBytes[BYTE_CMD_DATA_SIZE_SHIFT] = (COMMAND_DATA_SIZE >> ADDITIVE_OP)
    checksum = OTAUtil.calculateCheckSum(parseInt(checkSumType, RADIX), commandBytes)
    commandBytes[BYTE_CHECKSUM] = checksum
    commandBytes[BYTE_CHECKSUM_SHIFT] = (checksum >> ADDITIVE_OP)
    commandBytes[BYTE_PACKET_END] = BootLoaderCommands.PACKET_END
    debug('OTAExitBootloaderCmd')
    writeOTABootLoaderCommand(commandBytes, callback)
  }

  function writeOTABootLoaderCommand (commandBytes, callback) {
    writeMethod(commandBytes, callback)
  }
}

module.exports = OTAFirmwareWrite
