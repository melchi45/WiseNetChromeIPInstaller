$(function(){
    var chat;

    $("#connect").click(function(){
        chat = new Chat("0.0.0.0", 12345);

        chat.onConnect(function(socketInfo){
            console.log(socketInfo);
            $("#connect").attr("disabled", "disabled");
            $("#disconnect").removeAttr("disabled");
            $("#send").removeAttr("disabled");
        });
        chat.onReceive(function(msg){
            console.log(msg);
            $("#receive").append("<div>" + msg + "</div>");
        });

        chat.start();
    });
    $("#send").click(function(){
        var text = $("#textbox").val();
        chat.send(text);
        $("#textbox").val("");
    });

    $("#disconnect").click(function(){
        chat.end();
        $("#disconnect").attr("disabled", "disabled");
        $("#send").attr("disabled");
        $("#connect").removeAttr("disabled");
    });

});
