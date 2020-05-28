$(function(){
    var chat;
    var socketId;
    var source = '0.0.0.0';
    var dest = '192.168.125.93';
    var received_port = 7711;
    var dest_port = 7701;
    var str = 'SMC_DISCOVERY_MAGIC_IDENTIFIER';
    chrome = window['chrome'];

    function str2ab(str) {
        var buf = new ArrayBuffer(str.length*2); // 2 bytes for each char
        var bufView = new Uint16Array(buf);
        for (var i=0, strLen=str.length; i < strLen; i++) {
            bufView[i] = str.charCodeAt(i);
        }
        return buf;
    }

    $("#bind").click(function(){
        chrome.sockets.udp.create({}, function(socketInfo) {
            // The socket is created, now we can send some data
            socketId = socketInfo.socketId;
            console.log(socketId); //This works - tells me an integer
            var ttl = 12;
            chrome.sockets.udp.setMulticastTimeToLive(socketId, ttl, function (result) {
                console.log("setMulticastTimeToLive result bind",result);
                if(result < 0) {
                  console.log("MULTICAST FAILED" + result);
                } else {
                    chrome.sockets.udp.bind(socketId, source, received_port, function(result){
                        console.log("bind result bind",result);
                        if(result < 0)
                        {
                          console.log("BIND FAILED" + result);
                          chrome.sockets.udp.close(socketId);
                        } else {
                            chrome.sockets.udp.onReceive.addListener(function(msg)  //Listen for receiving messages
                            {
                                console.log("received msg", msg);
                                $("#result").val(msg);
                            })

                            chrome.sockets.udp.joinGroup(socketId, "237.132.123.123", function(result) //join Multicast group
                            {
                                if(result < 0)
                                {
                                    console.log("Couldn't join Group!");
                                    chrome.sockets.udp.close(socketId);
                                }
                                else
                                {
                                    // console.log("GOT HERE");          //Outputs this
                                    // $("#send").removeAttr("disabled");
                                    // $("#disconnect").removeAttr("disabled");

                                    // chrome.sockets.udp.onReceive.addListener(function(msg)  //Listen for receiving messages
                                    // {
                                    //     console.log("received msg", msg);
                                    //     $("#result").val(msg);
                                    // })
                                    // chrome.sockets.udp.onReceiveError.addListener(function(error)   //If error while receiving, do this
                                    // {
                                    //     console.log(error.socketId + " " + error.resultCode);
                                    // });
                                }
                            });
                            chrome.sockets.udp.getJoinedGroups(socketId,function(res){
                                // console.log("Joined Groups on "+ port);
                                console.log(res);
                            });
                        }
                    });
                    // // Setup event handler and bind socket.
                    // // chrome.sockets.udp.onReceive.addListener(onReceive);
                    // chrome.sockets.udp.onReceive.addListener(function(result){
                    //     console.log("result listener",result);
                    //     $("#result").val(result);
                    //     // if (result.socketId !== socketId)
                    //     // return;
                    //     // console.log(result.data);
                    // });
                }
            });

        });

    });
    $("#send").click(function(){
        var data = str2ab(str);
        chrome.sockets.udp.send(socketId, data, dest, dest_port, function(result){
            console.log("result send",result);
        });
    });

    $("#disconnect").click(function(){
        chrome.sockets.udp.close(socketId);
        $("#disconnect").attr("disabled", "disabled");
        $("#send").attr("disabled");
        $("#bind").removeAttr("disabled");
        $("#broadcast").removeAttr("disabled");
    });
    // reference from
    // https://busy.org/@anpigon/chrome-app-1
    // https://developer.chrome.com/apps/sockets_udp#method-bind
    // https://stackoverflow.com/questions/59737903/ionic-4-cordova-plugin-chrome-apps-sockets-udp
    // https://github.com/melchi45/chrome-app-udpsocket
    // https://stackoverflow.com/questions/33990159/example-explanation-on-chrome-sockets-udp-multicasting
    // https://bugs.chromium.org/p/chromium/issues/detail?id=399850
});
