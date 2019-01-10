var OTAFlashRow = function (arrayID, rowNumber, dataLength, data, checksum) {
  this.arrayID = arrayID
  this.rowNumber = rowNumber
  this.dataLength = dataLength
  this.data = data
  this.checksum = checksum
}

module.exports = OTAFlashRow
