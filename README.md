Chrome packaged app sample.
==========================

* Chrome app receives udp packets.
* Python program, sender.py sends UDP broadcast packet.


### note

Now, you can't send broadcast message on chrome app. Because chrome.socket api hasn't setsockopt function.

- https://code.google.com/p/chromium/issues/detail?id=125586
- http://civic.xrea.jp/2013/04/09/chrome-app-udp-broadcast/


