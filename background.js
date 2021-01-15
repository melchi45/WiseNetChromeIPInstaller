var extensionApp = null;
var useWindow = false;

var apps = {
  onLaunched: function (launchData) {
    console.log("Discovery App onLaunched:" + JSON.stringify(launchData));
    if (useWindow) {
      // Center window on screen.
      var screenWidth = screen.availWidth;
      var screenHeight = screen.availHeight;
      var width = 800;
      var height = 600;
  
      chrome.app.window.create('window.html', {
        'id': 'UDPBroadcastApp',
        'width': width,
        'height': height,
        'left': Math.round((screenWidth - width) / 2),
        'top': Math.round((screenHeight - height) / 2),
        'minWidth': 800,
        'minHeight': 600
      });
    }
    if (chrome.app.runtime.lastError) console.error(chrome.app.runtime.lastError);
  
    socket.cleanup_create();
    // // Make a simple request:
    // chrome.runtime.sendMessage(extensionId, {getTargetData: true},
    // function(response) {
    //   //if (targetInRange(response.targetData))
    //   // chrome.runtime.sendMessage(extensionId, {activateLasers: true});
    //   if (typeof response !== 'undefined' &&
    //       !response.targetData) {
    //         // handleError(data);
    //         console.log(response);
    //       }
    // });
  
    // // Start a long-running conversation:
    // extensionApp = chrome.runtime.connect(extensionId);
  },
  onRestarted: function () {
    // Do some simple clean-up tasks.
    console.log("Discovery App onRestarted");
  }
};

chrome.app.runtime.onLaunched.addListener(apps.onLaunched());
chrome.app.runtime.onRestarted.addListener(apps.onRestarted());

chrome.runtime.onMessageExternal.addListener(
  function (message, sender, sendResponse) {
    console.log("sender" + JSON.stringify(sender));
    console.log("message" + JSON.stringify(message));
    if (sender.id === socket.extensionId &&
      message.discovery) {
      socket.cleanup_create();
    }
  }
);

chrome.runtime.onMessage.addListener(
  function (message, sender, sendResponse) {
    console.log("sender" + JSON.stringify(sender));
    console.log("message" + JSON.stringify(message));
  }
);

// eventPage.js

chrome.runtime.onStartup.addListener(function() { 
  console.log("I started up!");
  socket.cleanup_create();
});

chrome.runtime.onSuspend.addListener(function() {
  console.log("I am being suspended!");
});