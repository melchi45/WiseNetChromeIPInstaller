$(function(){
    var receiver;

    chrome.socket.getNetworkList(function(interfaces){
        interfaces.forEach(function(ni){
            console.log(ni);
        });
    });

    $("#connect").click(function(){
        receiver = new Receiver("0.0.0.0", 12345);

        receiver.onConnect(function(socketInfo){
            console.log(socketInfo);
            $("#connect").attr("disabled", "disabled");
            $("#disconnect").removeAttr("disabled");
        });
        receiver.onReceive(function(msg){
            console.log(msg);
            $("#receive").append("<div>" + msg + "</div>");
        });

        receiver.start();
    });

    $("#disconnect").click(function(){
        receiver.end();
        $("#disconnect").attr("disabled", "disabled");
        $("#connect").removeAttr("disabled");
    });

});
