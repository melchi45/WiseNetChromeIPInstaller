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
    var listeningSocketId = null;
    var sendingSocketId = null;
    // use node module
    var SENDPORT = 7701;   // camera send port
    var RECEIVEPORT = 7711;   // camera send port
    var BROADCAST_ADDR = "255.255.255.255";
    // var source = '0.0.0.0';
    // var dest = '192.168.125.93';
    var resultElement = null;

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

    window.onload = function() {
      console.log("onload");
    }

    var htonl = function (h) {
      // Mask off 8 bytes at a time then shift them into place
      return [
        (h & 0xFF000000) >>> 24,
        (h & 0x00FF0000) >>> 16,
        (h & 0x0000FF00) >>>  8,
        (h & 0x000000FF) >>>  0,
      ];
    }
    /**
     * Convert a 32-bit quantity (long integer) from network byte order to host byte order (Big-Endian to Little-Endian).
     *
     * @param {Array|Buffer} buffer Array of octets or a nodejs Buffer to read value from
     * @returns {number}
     */
    var ntohl = function (n) {
      return (((0xFF & n[0]) << 24) +
              ((0xFF & n[1]) << 16) +
              ((0xFF & n[2]) << 8) +
              ((0xFF & n[3])) >>> 0);
    }
    /**
     * Convert a 16-bit quantity (short integer) from host byte order to network byte order (Little-Endian to Big-Endian).
     *
     * @param {number} budder Value to convert
     * @returns {Array|Buffer} v Array of octets or a nodejs Buffer
     */
    var htons = function(h) {
      // Mask off 8 bytes at a time then shift them into place
      return [
        (h & 0xFF00) >>>  8,
        (h & 0x00FF) >>>  0,
      ];
    }
    /**
     * Convert a 16-bit quantity (short integer) from network byte order to host byte order (Big-Endian to Little-Endian).
     *
     * @param {Array|Buffer} b Array of octets or a nodejs Buffer to read value from
     * @returns {number}
     */
    var ntohs = function (n, big) {
      if(big) {
        return (((0xFF & n[1]) << 8) +
                ((0xFF & n[0])) >>> 0);
      } else {
        return (((0xFF & n[0]) << 8) +
                ((0xFF & n[1])) >>> 0);
      }
    }

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

    function scrollbottom() {
      if (!('maxlength' in resultElement)) {
        var max = resultElement.attributes.maxLength.value;
        var length = resultElement.value.length;

        if(length > max) {
          resultElement.value = resultElement.value.slice(length - max);
        }
      }

      resultElement.scrollTop = resultElement.scrollHeight;
		}

    function onCreate(socketInfo) {
      // console.log("socket created: " + socketInfo.socketId);
    //   chrome.test.assertTrue(socketId > 0, "failed to create socket");

      if (typeof listeningSocketId !== 'undefined' &&
          listeningSocketId === null) {
        listeningSocketId = socketInfo.socketId;
        console.log("listening socket Id: " + listeningSocketId);
        chrome.sockets.udp.onReceive.addListener(onReceive);
        chrome.sockets.udp.onReceiveError.addListener(onReceiveError);
        chrome.sockets.udp.bind(
            listeningSocketId, "0.0.0.0", RECEIVEPORT, onBindListening);
      } else {
        sendingSocketId = socketInfo.socketId;
        console.log("sending socket Id: " + sendingSocketId);
        chrome.sockets.udp.bind(
            sendingSocketId, "127.0.0.1", SENDPORT, onBindSending);
      }
    }

    function onBindListening(result) {
      //   chrome.test.assertEq(0, result, "Bind failed with error: " + result);
      if (result < 0) {
        console.log("Listening Bind failed with error: " + result + ", last error:" + chrome.runtime.lastError.message);
        chrome.sockets.udp.close(listeningSocketId, function() {
          listeningSocketId = null;
        });

        return;
      }

      chrome.sockets.udp.setBroadcast(
          listeningSocketId, true, onSetBroadcastListening);
    }

    function onBindSending(result) {
      //   chrome.test.assertEq(0, result, "Bind failed with error: " + result);
        if (result < 0) {
          console.log("Sending Bind failed with error: " + result + ", last error: " + chrome.runtime.lastError.message);
          chrome.sockets.udp.close(sendingSocketId, function() {
            sendingSocketId = null;
          });
          return;
        }
  
        chrome.sockets.udp.setBroadcast(sendingSocketId, true, onSetBroadcastSending);
      }

    function onSetBroadcastListening(result) {
      //   chrome.test.assertEq(0, result, "Failed to enable broadcast: " + result);
      if (result < 0) {
        console.log("Failed to enable broadcast: " + result + ", last error: " + chrome.runtime.lastError.message);
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

    function onReceiveError(info) {
    //   chrome.test.fail("Socket receive error: " + info.resultCode);
    }

    function onReceive(info) {
      console.log("Received data on socket" + "(" + info.socketId + ")");
      console.log("received:", ab2str(info.data));     
      var byteData = new Uint8Array(info.data);

      var nModeLength = 1,
          nPacketIDLength = 18,
          nMacAddressLength = 18,
          nIPAddressLength = 16,
          nSubnetMaskLength = 16,
          nGatewayLength = 16,
          nChangePasswordLgenth = 20,
          nReservedLegnth = 1,
          nPortLength = 2,
          nStatusLength = 1,
          nDeviceNameLength = 10,
          nNetworkModeLength = 1,
          nchDDNSLength = 128;


      var result = {};

      var index = 0;
      result.nMode = byteData.subarray(index, 1)[0];

      // console.log("mode:", result.nMode);
      index += nModeLength;
      result.chPacketId = byteData.subarray(index, index + nPacketIDLength);
      index += nPacketIDLength;
      result.chMac = String.fromCharCode.apply(null, byteData.subarray(index, index + nMacAddressLength));
      // console.log("mac address:", result.chMac);
      index += nMacAddressLength;
      result.chIP = String.fromCharCode.apply(null, byteData.subarray(index, index + nIPAddressLength));
      // console.log("IP address:", result.chIP);
      index += nIPAddressLength;
      result.chSubnetMask = String.fromCharCode.apply(null, byteData.subarray(index, index + nSubnetMaskLength));
      // console.log("subnet mask:", result.chSubnetMask);
      index += nSubnetMaskLength;
      result.chGateway = String.fromCharCode.apply(null, byteData.subarray(index, index + nGatewayLength));
      // console.log("gateway:", result.chGateway);
      index += nGatewayLength;
      result.chPassword = String.fromCharCode.apply(null, byteData.subarray(index, index + nChangePasswordLgenth));
      // console.log("chPassword:", result.chPassword);
      index += nChangePasswordLgenth;
      result.Reserved1 = byteData.subarray(index, index + nReservedLegnth);
      index += nReservedLegnth;
      result.nPort = ntohs(byteData.subarray(index, index + nPortLength), true);
      // console.log("port:", result.nPort);
      index += nPortLength;
      result.nStatus = byteData.subarray(index, index + nStatusLength);
      // console.log("status:", result.nStatus);
      index += nStatusLength;
      result.chDeviceName = String.fromCharCode.apply(null, byteData.subarray(index, index + nDeviceNameLength));
      // console.log("device name:", result.chDeviceName);
      index += nDeviceNameLength;
      result.Reserved2 = byteData.subarray(index, index + nReservedLegnth);
      index += nReservedLegnth;
      result.nHttpPort = ntohs(byteData.subarray(index, index + nPortLength), true);
      // console.log("http port:", result.nHttpPort);
      index += nPortLength;
      result.nDevicePort = ntohs(byteData.subarray(index, index + nPortLength), true);
      // console.log("device port:", result.nDevicePort);
      index += nPortLength;
      result.nTcpPort = ntohs(byteData.subarray(index, index + nPortLength), true);
      // console.log("tcp port:", result.nTcpPort);
      index += nPortLength;
      result.nUdpPort = ntohs(byteData.subarray(index, index + nPortLength), true);
      // console.log("udp port:", result.nUdpPort);
      index += nPortLength;
      result.nUploadPort = ntohs(byteData.subarray(index, index + nPortLength), true);
      // console.log("upload port:", result.nUploadPort);
      index += nPortLength;
      result.nMulticastPort = ntohs(byteData.subarray(index, index + nPortLength), true);
      // console.log("multicast port:", result.nMulticastPort);
      index += nPortLength;
      result.nNetworkMode = byteData.subarray(index, index + nNetworkModeLength);
      // console.log("network mode:", result.nNetworkMode);
      index += nNetworkModeLength;
      result.chDDNS = String.fromCharCode.apply(null, byteData.subarray(index, index + nchDDNSLength));
      // console.log("ddns:", result.chDDNS);
      index += nchDDNSLength;

      console.log("result", result);

      var str = resultElement.value;
      var temp = "Device Name:" + result.chDeviceName + ", Mac Address: " + result.chMac + ", IP: " + result.chIP + ", port: " + result.nHttpPort + ", URL: " + result.chDDNS + "\r\n";
      str += temp;
      resultElement.value = str;
      scrollbottom();
    }

    $("#init").click(function(){
      resultElement = $("#result")[0];
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
        chrome.sockets.udp.close(sendingSocketId, function() {
          sendingSocketId = null;
        });
        chrome.sockets.udp.close(listeningSocketId, function() {
          listeningSocketId = null;
        });;
        $("#disconnect").attr("disabled", "disabled");
        $("#broadcast").attr("disabled", "disabled");
        $("#init").removeAttr("disabled");
    });

    function destory() {
      alert('Handler for .unload() called.');
      if(sendingSocketId !== null) {
        chrome.sockets.udp.close(sendingSocketId, function() {
          sendingSocketId = null;
        });
      }
      if(listeningSocketId !== null) {
        chrome.sockets.udp.close(listeningSocketId, function() {
          listeningSocketId = null;
        });;
      }

    }

    // window.addEventListener('beforeunload', function(event) {
    //   alert('Handler for .unload() called.');
    //   if(sendingSocketId !== null) {
    //     chrome.sockets.udp.close(sendingSocketId, function() {
    //       sendingSocketId = null;
    //     });
    //   }
    //   if(listeningSocketId !== null) {
    //     chrome.sockets.udp.close(listeningSocketId, function() {
    //       listeningSocketId = null;
    //     });;
    //   }
    // });
});
