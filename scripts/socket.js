// var extensionApp = chrome.runtime.connect(extensionId);

var socket = {
  // The ID of the extension we want to talk to.
  // var extensionId = "loliolhohbdkfmiieliikgpdmohhfnhm";
  extensionId: "knldjmfmopnpolahpmmgbagdohdnhkik",
  listeningSocketId: null,
  sendingSocketId: null,
  // use node module
  SENDPORT: 7701,   // camera send port
  RECEIVEPORT: 7711,   // camera send port
  BROADCAST_ADDR: "255.255.255.255",

  create: function() {
    chrome.sockets.udp.create({}, socket.onCreate);

    // reference from:
    // https://stackoverflow.com/questions/24198322/how-to-launch-a-chrome-app-from-a-chrome-extension
    chrome.runtime.sendMessage(socket.extensionId, { launch: true });
  },
  cleanup_create: function () {
    // reference from:
    // https://stackoverflow.com/questions/28393684/not-getting-onreceive-callback-for-udp-socket-on-chrome-after-event-page-is-unlo
    chrome.sockets.udp.getSockets(function cleanup_create_cb(socketInfos) {
      console.log("Cleaning up existing sockets  " + socketInfos.length);
      
      // chrome.sockets.udp.close(socket.listeningSocketId, function socket_close_cb(data) {
      //   socket.listeningSocketId = null;
      //     console.log(data);
      // });
      // chrome.sockets.udp.close(socket.sendingSocketId, function socket_close_cb(data) {
      //   socket.sendingSocketId = null;
      //   console.log(data);
      // });
      if (socketInfos.length > 0) {
        for (i = 0; i < socketInfos.length; i++) {
          if (socket.listeningSocketId === socketInfos[i].socketId) {
            console.log("close the listening socket: " + socketInfos[i].socketId);
          }

          if (socket.sendingSocketId === socketInfos[i].socketId) {
            console.log("close the sending socket: " + socketInfos[i].socketId);
          }
          chrome.sockets.udp.close(socketInfos[i].socketId,
            function socket_close_cb() {
              console.log("socket closed.");
              chrome.sockets.udp.getSockets(function cleanup_create_cb(socketInfos) {
                if (socketInfos.length === 0) {
                  socket.listeningSocketId = null;
                  socket.sendingSocketId = null;
                  socket.create();
                }
              });
          }); // end socket close
        } // end for
      } else {
        socket.create();
      } // end if
    });
  },
  onCreate: function(socketInfo) {
    if(socketInfo.socketId < 0) {
      console.log("Listening Bind failed with error: " + result + ", last error:" + chrome.runtime.lastError.message);
    }
    console.log("socket created: " + socketInfo.socketId);
    if (typeof socket.listeningSocketId !== 'undefined' &&
    socket.listeningSocketId === null) {
      socket.listeningSocketId = socketInfo.socketId;
      console.log("listening socket Id: " + socket.listeningSocketId);
      chrome.sockets.udp.onReceive.addListener(socket.onReceive);
      chrome.sockets.udp.onReceiveError.addListener(socket.onReceiveError);
      chrome.sockets.udp.bind(
        socket.listeningSocketId, "0.0.0.0", socket.RECEIVEPORT, socket.onBindListening);
    } else {
      socket.sendingSocketId = socketInfo.socketId;
      console.log("sending socket Id: " + socket.sendingSocketId);
      chrome.sockets.udp.bind(
        socket.sendingSocketId, "127.0.0.1", socket.SENDPORT, socket.onBindSending);
    }
  },
  onBindListening: function(result) {
    //   chrome.test.assertEq(0, result, "Bind failed with error: " + result);
    if (result < 0) {
      console.log("Listening Bind failed with error: " + result + ", last error:" + chrome.runtime.lastError.message);
      chrome.sockets.udp.close(socket.listeningSocketId, function() {
        socket.listeningSocketId = null;
      });

      return;
    }

    chrome.sockets.udp.setBroadcast(
      socket.listeningSocketId, true, socket.onSetBroadcastListening);
  },
  onBindSending: function(result) {
    //   chrome.test.assertEq(0, result, "Bind failed with error: " + result);
    if (result < 0) {
      console.log("Sending Bind failed with error: " + result + ", last error: " + chrome.runtime.lastError.message);
      chrome.sockets.udp.close(socket.sendingSocketId, function() {
        socket.sendingSocketId = null;
      });
      return;
    }

    chrome.sockets.udp.setBroadcast(socket.sendingSocketId, true, socket.onSetBroadcastSending);
  },
  onSetBroadcastListening: function(result) {
    //   chrome.test.assertEq(0, result, "Failed to enable broadcast: " + result);
    if (result < 0) {
      console.log("Failed to enable broadcast: " + result + ", last error: " + chrome.runtime.lastError.message);
      return;
    }

    // Create the sending socket.
    chrome.sockets.udp.create({}, socket.onCreate);
  },
  onSetBroadcastSending: function(result) {
    //   chrome.test.assertEq(0, result, "Failed to enable broadcast: " + result);
    if (result < 0) {
      console.log("Failed to enable broadcast: " + result + ", last error: " + chrome.runtime.lastError.message);
      return;
    }

    var buf = "018750735306465625ef6da75b047d7bcd1c3c001800000000000000f0eacf00000000000000000000000000faf8ec76000000000000000050ea18001a01ec76f0e9180000000000e4ea18008000ec76f0eacf0000000000f00000000000000000000000fc3841007226881300000000b972c1746121c274881310272e2724271a2742270000000000000000b10200000100000000000000f00000000100000001000000f0eacf00d00b20000000000074ea18007a61c274f0eacf0000000000fc38410000000000000000000100000078f418008cea180076784100d00b2000f00000000000000001000000a4ea18000e7f4000c4ea18000904000050fe180078f41800f0ea";
    //   var message = hexStringToArrayBuffer(buf);
    // var message = str2ab(str);
    var message = new Uint8Array(buf.match(/[\da-f]{2}/gi).map(function (h) {
      return parseInt(h, 16)
    }));

    chrome.sockets.udp.send(socket.listeningSocketId, message, socket.BROADCAST_ADDR,
                          socket.SENDPORT, function(sendInfo) {
      // chrome.test.assertEq(0, sendInfo.resultCode);
      console.log("send result: " + sendInfo.resultCode);
      // chrome.test.assertEq(sendInfo.bytesSent, arrayBuffer.byteLength);
    });
  },
  onReceive: function(info) {
    console.log("Received data on socket" + "(" + info.socketId + ")");
    console.log("received:", ab2str(info.data));     
    var byteData = new Uint8Array(info.data);

    // Make a simple request:
    // chrome.runtime.sendMessage(editorExtensionId, {data: byteData},
    //   function(response) {
    //     if (typeof response !== 'undefined' &&
    //         !response.success)
    //       handleError(data);
    // });

    // reference from:
    // https://developer.chrome.com/extensions/messaging#external
    // Start a long-running conversation:
    // var port = chrome.runtime.connect(laserExtensionId);
    // port.postMessage(...);

    chrome.runtime.onMessageExternal.addListener(
      function(request, sender, sendResponse) {
        if (typeof sender.data !== 'undefined' )
        {

        }
        if (request.openUrlInEditor)
          openUrl(request.openUrlInEditor);
      });
    // chrome.runtime.sendMessage(editorExtensionId, {openUrlInEditor: "chrome-extension://loliolhohbdkfmiieliikgpdmohhfnhm/newtab.html"},
    //   function(response) {
    //     if (typeof response !== 'undefined' &&
    //         !response.success)
    //       handleError(url);
    // });


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
    result.chMac = String.fromCharCode.apply(null, byteData.subarray(index, index + nMacAddressLength)).replace(/\0/g, '');
    // console.log("mac address:", result.chMac);
    index += nMacAddressLength;
    // result.chIP = String.fromCharCode.apply(null, byteData.subarray(index, index + nIPAddressLength)).replace(/\s$/gi, "");// 문자열 맨 뒤의 공백만 제거;
    result.chIP = String.fromCharCode.apply(null, byteData.subarray(index, index + nIPAddressLength)).replace(/\0/g, '');
    // console.log("IP address:", result.chIP);
    index += nIPAddressLength;
    result.chSubnetMask = String.fromCharCode.apply(null, byteData.subarray(index, index + nSubnetMaskLength)).replace(/\0/g, '');
    // console.log("subnet mask:", result.chSubnetMask);
    index += nSubnetMaskLength;
    result.chGateway = String.fromCharCode.apply(null, byteData.subarray(index, index + nGatewayLength)).replace(/\0/g, '');
    // console.log("gateway:", result.chGateway);
    index += nGatewayLength;
    result.chPassword = String.fromCharCode.apply(null, byteData.subarray(index, index + nChangePasswordLgenth)).replace(/\0/g, '');
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
    result.chDeviceName = String.fromCharCode.apply(null, byteData.subarray(index, index + nDeviceNameLength)).replace(/\0/g, '');
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

    chrome.runtime.sendMessage(socket.extensionId, result);
    console.log("result", result);
  },
  onReceiveError: function (info) {
    //   chrome.test.fail("Socket receive error: " + info.resultCode);
  }
};