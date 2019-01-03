var fs = require('fs');
var OTAFlashRow = require('./models/OTAFlashRow')

var PayloadProcessor = function(path){
  var processor = this
  processor.filePath = path
  processor.siliconID = null
  processor.siliconRev = null
  processor.checkSumType = null
  processor.header = null
  processor.flashDataLines = [];
  
  processor.file = fs.readFileSync(processor.filePath, 'utf8')
  processor.file = processor.file.trim()//Remove surrounding whitespace

  processor.analyzeHeader = function(){
    processor.header = processor._getMSBString(processor._getTheHeaderString())
    processor.siliconID = processor._getSiliconID()
    processor.siliconRev = processor._getSiliconRev()
    processor.checkSumType = processor._getCheckSumType()
  }

  processor.readDataLines = function(){
    processor.flashDataLines = [];
    var lines = processor.file.split(/\r?\n/);

    //For each line (except the header)
    for(var i = 1; i < lines.length; i++){
      //[1-byte ArrayID][2-byte RowNumber][2-byte DataLength][N-byte Data][1byte Checksum]
      //create data model
      var model = new OTAFlashRow();
      model.arrayID = parseInt(lines[i].substring(1, 3), 16);//01
      model.rowNumber = processor._getMSBString(lines[i].substring(3, 7));//D500
      model.dataLength = parseInt(lines[i].substring(7, 11), 16);//0080
      model.checksum = parseInt(lines[i].substring(lines[i].length - 3, lines[i].length), 16);//88

      //00400020916A0100F1CB0100F1CB010080B500AF024B83F3088806F0DBF8C0460040002080B500AF374B12221A6007F03FFD364B180007F077FF012007F048FD302007F053FB324B324A1A60324B8022D2051A60314B314A126802210A431A602F4B304A1A60304B00221A602F4B2F4A126808218A431A60FA23DB00180007F08
      var dataCharacters = lines[i].substring(11, lines[i].length - 2)
      var b = 0;
      var dataArray = []//TODO: Byte array
      for (var a = 0; a < model.dataLength; a++) {
        dataArray[a] = parseInt(dataCharacters.substring(b, b + 2), 16);
        b += 2
      }
      model.data = dataArray;
      processor.flashDataLines.push(model)
    }
  }

  processor.getTotalLines = function(){
    return processor.file.split(/\r?\n/).length
  }

  processor._getTheHeaderString = function(){
    return processor.file.substring(0, 12)
  }

  processor._getSiliconID = function(){
    return processor.header.substring(4, 12)
  }

  processor._getSiliconRev = function(){
    return processor.header.substring(2, 4)
  }

  processor._getCheckSumType = function(){
    return processor.header.substring(0, 2)
  }

  processor._getMSBString = function(string){
    var retVal = ""
    for (var i = string.length; i > 0; i -= 2) {
      retVal += string.substring(i - 2, i);
    }
    return retVal;
  }
}

module.exports = PayloadProcessor
