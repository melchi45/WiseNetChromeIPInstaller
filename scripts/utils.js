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
