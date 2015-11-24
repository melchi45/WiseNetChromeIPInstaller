(function(exports){
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
    var Chat = function(address, port){
        this.address = address;
        this.port = port;
        this.sock = null;
        this.receive_handler = null;
        this.connect_handler = null;
    };
    Chat.prototype = {
        onReceive: function(handler){
            this.receive_handler = handler;
        },
        onConnect: function(handler){
            this.connect_handler = handler;
        },
        start: function(){
            var self = this;
            //receiving socket
            chrome.sockets.udp.create( {}, function(socketInfo){
                chrome.sockets.udp.bind(socketInfo.socketId, self.address, self.port, function(result) {
                    self.sock = socketInfo;
                    if (self.connect_handler){
                        self.connect_handler(socketInfo);
                    }
                    chrome.sockets.udp.onReceive.addListener(function(recvInfo){
                        console.log("onRecieve", recvInfo);
                        if (recvInfo.resultCode < 0){   // if error 
                            return;
                        }
                        if (self.receive_handler){
                            self.receive_handler(ab2str(recvInfo.data));
                        }
                    });
                });
                chrome.sockets.udp.setBroadcast(socketInfo.socketId, true, function(result){
                    console.log("broadcast result: "+ result);
                });
            });
        },
        send: function(text){
            var data = str2ab(text);
            chrome.sockets.udp.send(this.sock.socketId, data, "255.255.255.255", 12345, function(info){
                console.log("send result", info);
            });
        },
        end: function(){
            chrome.sockets.udp.close(this.sock.socketId);
            this.sock = null;
        }
    };
    exports.Chat = Chat;
})(this);
