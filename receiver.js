(function(exports){
    function toS(buffer){
        var arr = new Int8Array(buffer);
        var str = "";
        for (var i = 0, l = arr.length; i <l; i++){
            str += String.fromCharCode.call(this, arr[i]);
        }
        return str;
    }

    var Receiver = function(address, port){
        this.address = address;
        this.port = port;
        this.sock = null;
        this.receive_handler = null;
        this.connect_handler = null;
    };
    Receiver.prototype = {
        onReceive: function(handler){
            this.receive_handler = handler;
        },
        onConnect: function(handler){
            this.connect_handler = handler;
        },
        start: function(){
            var self = this;
            //receiving socket
            chrome.socket.create("udp", {}, function(socketInfo){
                chrome.socket.bind(socketInfo.socketId, self.address, self.port, function(result) {
                    self.sock = socketInfo;
                    if (self.connect_handler){
                        self.connect_handler(socketInfo);
                    }
                    var reader = function(){
                        chrome.socket.read(self.sock.socketId, 1024, function(recvInfo){
                            if (recvInfo.resultCode < 0){   // if error 
                                return;
                            }
                            if (self.receive_handler){
                                self.receive_handler(toS(recvInfo.data));
                            }
                            reader();
                        });
                    };
                    reader();
                });
            });
        },
        end: function(){
            chrome.socket.disconnect(this.sock.socketId);
            this.sock = null;
        }
    };
    exports.Receiver = Receiver;
})(this);
