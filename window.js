// reference from
// https://busy.org/@anpigon/chrome-app-1
// https://developer.chrome.com/apps/sockets_udp#method-bind
// https://stackoverflow.com/questions/59737903/ionic-4-cordova-plugin-chrome-apps-sockets-udp
// https://github.com/melchi45/chrome-app-udpsocket
// https://stackoverflow.com/questions/33990159/example-explanation-on-chrome-sockets-udp-multicasting
// https://bugs.chromium.org/p/chromium/issues/detail?id=399850
// https://stackoverflow.com/questions/47480990/chrome-sockets-udp-how-to-successfully-broadcast
// https://groups.google.com/a/chromium.org/forum/#!topic/chromium-checkins/IlTiIwXsaGI
// https://stackoverflow.com/questions/47480990/chrome-sockets-udp-how-to-successfully-broadcast
$(function(){
    var chat;
    var listeningSocketId;
    var sendingSocketId;
    // use node module
    var SENDPORT = 7701;   // camera send port
    var RECEIVEPORT = 7711;   // camera send port
    var BROADCAST_ADDR = "255.255.255.255";
    // var source = '0.0.0.0';
    // var dest = '192.168.125.93';

    var cameraFormat = new Parser()
    .endianess('big')
    .uint8('nMode')
    .string('chPacketID',{length : 18})
    .string('chMAC',{length : 18, stripNull   : true })
    .string('chIP',{length : 16, stripNull   : true })
    .string('chSubnetMask',{length : 16})
    .string('chGateway',{length : 16})
    .string('chPassword',{length : 20})
    .uint8('Reserved1')
    .uint16('nPort')
    .uint8('nStatus')
    .string('chDeviceName',{length : 10,  stripNull : true })
    .uint8('Reserved2')
    .uint16('nHttpPort')
    .uint16('nDevicePort')
    .uint16('nTcpPort')
    .uint16('nUdpPort')
    .uint16('nUploadPort')
    .uint16('nMulticastPort')
    .uint8('nNetworkMode')
    .string('chDDNS',{length : 128, zeroTerminated   : true });

    var str = 'SMC_DISCOVERY_MAGIC_IDENTIFIER';
    chrome = window['chrome'];

    function ab2str(buf) {
        return String.fromCharCode.apply(null, new Uint16Array(buf));
    }
    function str2ab(str) {
        var buf = new ArrayBuffer(str.length*2); // 2 bytes for each char
        var bufView = new Uint16Array(buf);
        for (var i=0, strLen=str.length; i < strLen; i++) {
            bufView[i] = str.charCodeAt(i);
        }
        return buf;
    }

    function hexStringToArrayBuffer(hexString) {
        // remove the leading 0x
        hexString = hexString.replace(/^0x/, '');

        // ensure even number of characters
        if (hexString.length % 2 != 0) {
            console.log('WARNING: expecting an even number of characters in the hexString');
        }

        // check for some non-hex characters
        var bad = hexString.match(/[G-Z\s]/i);
        if (bad) {
            console.log('WARNING: found non-hex characters', bad);
        }

        // split the string into pairs of octets
        var pairs = hexString.match(/[\dA-F]{2}/gi);

        // convert the octets to integers
        var integers = pairs.map(function(s) {
            return parseInt(s, 16);
        });

        var array = new Uint8Array(integers);
        console.log(array);

        return array.buffer;
    }

    function onCreate(socketInfo) {
      console.log("socket created: " + socketInfo.socketId);
    //   chrome.test.assertTrue(socketId > 0, "failed to create socket");

      if (listeningSocketId == undefined) {
        listeningSocketId = socketInfo.socketId;
        chrome.sockets.udp.onReceive.addListener(onReceive);
        chrome.sockets.udp.onReceiveError.addListener(onReceiveError);
        chrome.sockets.udp.bind(
            listeningSocketId, "0.0.0.0", RECEIVEPORT, onBindListening);
      } else {
        sendingSocketId = socketInfo.socketId;
        chrome.sockets.udp.bind(
            sendingSocketId, "127.0.0.1", SENDPORT, onBindSending);
      }
    }

    function onBindListening(result) {
      //   chrome.test.assertEq(0, result, "Bind failed with error: " + result);
      if (result < 0) {
        console.log("Bind failed with error: " + result);
        return;
      }

      chrome.sockets.udp.setBroadcast(
          listeningSocketId, true, onSetBroadcastListening);
    }

    function onSetBroadcastListening(result) {
      //   chrome.test.assertEq(0, result, "Failed to enable broadcast: " + result);
      if (result < 0) {
        console.log("Failed to enable broadcast: " + result);
        return;
      }

      // Create the sending socket.
      chrome.sockets.udp.create({}, onCreate);
    }

    function onSetBroadcastSending(result) {
    //   chrome.test.assertEq(0, result, "Failed to enable broadcast: " + result);
      if (result < 0) {
          console.log("Failed to enable broadcast: " + result);
        return;
      }

      $("#init").attr("disabled", "disabled");
      $("#disconnect").removeAttr("disabled");
      $("#broadcast").removeAttr("disabled");
    //   var buf = "018750735306465625ef6da75b047d7bcd1c3c001800000000000000f0eacf00000000000000000000000000faf8ec76000000000000000050ea18001a01ec76f0e9180000000000e4ea18008000ec76f0eacf0000000000f00000000000000000000000fc3841007226881300000000b972c1746121c274881310272e2724271a2742270000000000000000b10200000100000000000000f00000000100000001000000f0eacf00d00b20000000000074ea18007a61c274f0eacf0000000000fc38410000000000000000000100000078f418008cea180076784100d00b2000f00000000000000001000000a4ea18000e7f4000c4ea18000904000050fe180078f41800f0ea";
    // //   var message = hexStringToArrayBuffer(buf);
    // var message = str2ab(str);
    //   var message = new Uint8Array(buf.match(/[\da-f]{2}/gi).map(function (h) {
    //     return parseInt(h, 16)
    //   }));

    //   chrome.sockets.udp.send(listeningSocketId, message, BROADCAST_ADDR,
    //                         SENDPORT, function(sendInfo) {
    //     // chrome.test.assertEq(0, sendInfo.resultCode);
    //     console.log("send result: " + sendInfo.resultCode);
    //     // chrome.test.assertEq(sendInfo.bytesSent, arrayBuffer.byteLength);
    //   });

    //   string2ArrayBuffer("broadcast packet", onArrayBuffer);
    }

    function onBindSending(result) {
    //   chrome.test.assertEq(0, result, "Bind failed with error: " + result);
      if (result < 0) {
          console.log("Bind failed with error: " + result);
        return;
      }

      chrome.sockets.udp.setBroadcast(sendingSocketId, true, onSetBroadcastSending);
    }

    function onReceiveError(info) {
    //   chrome.test.fail("Socket receive error: " + info.resultCode);
    }

    function onReceive(info) {
      console.log("Received data on socket" + "(" + info.socketId + ")");
     
      var byteData = new Uint8Array(info.data);

      result = {};

      var index = 0;
      result.nMode = byteData.subarray(index, 1);
      index += 1;
      result.chPacketId = byteData.subarray(index, 18);
      index += 18;
      result.chMAC = byteData.subarray(index, 18);
      index += 18;
      result.chIP = byteData.subarray(index, 16);
      index += 16;
      result.chSubnetMask = byteData.subarray(index, 16);
      index += 16;
      result.chGateway = byteData.subarray(index, 16);
      index += 16;
      result.chPassword = byteData.subarray(index, 20);
      index += 20;
      result.Reserved1 = byteData.subarray(index, 1);
      index += 1;
      result.nPort = byteData.subarray(index, 2);
      index += 2;
      result.nStatus = byteData.subarray(index, 1);
      index += 1;
      result.chDeviceName = byteData.subarray(index, 10);
      index += 10;
      result.Reserved2 = byteData.subarray(index, 1);
      index += 1;
      result.nHttpPort = byteData.subarray(index, 2);
      index += 2;
      result.nDevicePort = byteData.subarray(index, 2);
      index += 2;
      result.nTcpPort = byteData.subarray(index, 2);
      index += 2;
      result.nUdpPort = byteData.subarray(index, 2);
      index += 2;
      result.nUploadPort = byteData.subarray(index, 2);
      index += 2;
      result.nMulticastPort = byteData.subarray(index, 2);
      index += 2;
      result.nNetworkMode = byteData.subarray(index, 1);
      index += 2;
      result.chDDNS = byteData.subarray(index, 128);

      console.log("result", result);
    //   console.log("received:", ab2str(info.data));
    // var cameraInfo = cameraFormat.parse(info.data);

    //   var mac = info.data.subarray(19, 18);
    //   var ip = info.data.subarray(37, 18);

    //   console.log("mac", mac, "ip", ip);
    }

    $("#init").click(function(){
        chrome.sockets.udp.create({}, onCreate);
    });

    $("#broadcast").click(function(){
        var buf = "018750735306465625ef6da75b047d7bcd1c3c001800000000000000f0eacf00000000000000000000000000faf8ec76000000000000000050ea18001a01ec76f0e9180000000000e4ea18008000ec76f0eacf0000000000f00000000000000000000000fc3841007226881300000000b972c1746121c274881310272e2724271a2742270000000000000000b10200000100000000000000f00000000100000001000000f0eacf00d00b20000000000074ea18007a61c274f0eacf0000000000fc38410000000000000000000100000078f418008cea180076784100d00b2000f00000000000000001000000a4ea18000e7f4000c4ea18000904000050fe180078f41800f0ea";
        //   var message = hexStringToArrayBuffer(buf);
        var message = str2ab(str);
          var message = new Uint8Array(buf.match(/[\da-f]{2}/gi).map(function (h) {
            return parseInt(h, 16)
          }));

          chrome.sockets.udp.send(listeningSocketId, message, BROADCAST_ADDR,
                                SENDPORT, function(sendInfo) {
            // chrome.test.assertEq(0, sendInfo.resultCode);
            console.log("send result: " + sendInfo.resultCode);
            // chrome.test.assertEq(sendInfo.bytesSent, arrayBuffer.byteLength);
          });
    });

    $("#disconnect").click(function(){
        chrome.sockets.udp.close(sendingSocketId);
        chrome.sockets.udp.close(listeningSocketId);
        $("#disconnect").attr("disabled", "disabled");
        $("#broadcast").attr("disabled", "disabled");
        $("#init").removeAttr("disabled");
    });
});
