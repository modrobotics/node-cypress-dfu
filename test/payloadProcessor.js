var test = require('tape')
var fs = require('fs')

var PayloadProcessor = require('../payloadProcessor')
var payloadProcessor = new PayloadProcessor(fs.readFileSync('./test/bootloadable.cyacd', 'utf8'))

test('Read Header', function (t) {
  t.plan(3)
  payloadProcessor.analyzeHeader()
  //0E50119E
  t.equal(payloadProcessor.siliconID, "9E11500E", "SiliconID is correct")
  t.equal(payloadProcessor.siliconRev, "00", "SiliconRev is correct")
  t.equal(payloadProcessor.checkSumType, "00", "checkSumType is correct")
})

test('Read Data Lines: first line', function (t) {
  t.plan(5)
  payloadProcessor.readDataLines()

  var firstLine = payloadProcessor.flashDataLines[0]
  t.equal(firstLine.arrayID, 1, "First lines Array ID is correct")
  t.equal(firstLine.rowNumber, "D500", "First lines row number is correct")
  t.equal(firstLine.dataLength, 128, "First lines data length is correct")
  t.equal(firstLine.checksum, 136, "First lines checksum is correct")
  t.equal(firstLine.data.length, firstLine.dataLength, "There are the correct number of data bytes")
})

// test('Read Data Lines: all lines', function (t) {
//   payloadProcessor.readDataLines()
//   for(var i = 0; i < payloadProcessor.flashDataLines.length; i++){
//     var line = payloadProcessor.flashDataLines[i]
//     t.equal(line.arrayID, 1, "Line "+i+": Array ID is correct")
//     t.equal(line.rowNumber, rowNumber, "Line "+i+": row number is correct")
//     //t.equal(line.dataLength, 128, "Lines data length is correct")
//     //t.equal(line.checksum, 136, "Lines checksum is correct")
//     t.equal(line.data.length, line.dataLength, "Line "+i+": There are the correct number of data bytes")
//
//     rowNumber = (parseInt(rowNumber, 16) + 0x100).toString(16).toUpperCase()
//   }
//   t.end()
// })
