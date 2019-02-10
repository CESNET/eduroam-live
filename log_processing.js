module.exports = function(io) {
  // --------------------------------------------------------------------------------------
  var Tail = require('tail').Tail;
  var fs = require('fs');
  tail = new Tail("/home/etlog/logs/fticks/fticks-" + (new Date().getFullYear()) + "-" + ("0" + (new Date().getMonth() + 1)).slice(-2) + "-" + ("0" + (new Date().getDate())).slice(-2));       // process current fticks log
  // --------------------------------------------------------------------------------------

  var most_used = {};
  var most_provided = {};
  var idx = 0;
  // --------------------------------------------------------------------------------------

  // nebude tohle nejak interferovat s kodem ktery resi zpracovani radky?
  // vypada to, ze tohle nijak se zpracovanim aktualni radky neinterferuje
  setInterval(function() {
    // clear data
    most_used = {};
    most_provided = {};
  }, 300 * 1000); // every 300 seconds

  // --------------------------------------------------------------------------------------
  tail.on("line", function(data) {
    get_data(data, most_provided, most_used);
  });

  // --------------------------------------------------------------------------------------
  tail.on("error", function(error) {
    console.log('ERROR: ', error);
  });
  // --------------------------------------------------------------------------------------

  // --------------------------------------------------------------------------------------
  function get_data(data, most_provided, most_used)
  {
    var fields = data.split("#");

    if(fields.length != 7)      // malformed record
      return;

    var realm = fields[1].split("=")[1];
    var visinst = fields[3].split("=")[1].replace(/^1/, "");
    var result = fields[6].split("=")[1];
    var csi = fields[4].split("=")[1].replace(/\./g, "").replace(/-/g,"").toLowerCase();

    if(realm.indexOf(".cz") == -1 || visinst.indexOf(".cz") == -1)      // only .cz
      return;

    var line = data.replace(/PN=.*@/, "PN=***@")                            // hide username, 
                   .replace(/195\.113\.187\.41 fticks\[\d+\]: /, "")        // remove IP and process number
                   .replace(/CSI=.*#PN/, "CSI=xx-xx-xx-xx-xx-xx#PN");       // hide MAC address

    if(csi.match(/706f6c6[9-f]/))       // monitoring
      return;

    if(result == "OK") {        // OK
      if(!most_used[realm])
        most_used[realm] = { ok : 0, fail : 0 };
      if(!most_provided[visinst])
        most_provided[visinst] = { ok : 0, fail : 0 };

      io.emit("log_ok", line);
      most_used[realm].ok++;
      most_provided[visinst].ok++;
    }
    else {          // FAIL
      if(!most_used[realm])
        most_used[realm] = { ok : 0, fail : 0 };
      if(!most_provided[visinst])
        most_provided[visinst] = { ok : 0, fail : 0 };

      io.emit("log_fail", line);
      most_used[realm].fail++;
      most_provided[visinst].fail++;
    }

    // --------------------------------------------------------------------------------------

    // TODO - obcas jsou na frontendu prazdne sloupce
    // viz debug.sh

    var most_used_data = Object.entries(most_used).sort(sort_by_ok).slice(0, 10);
    var most_provided_data = Object.entries(most_provided).sort(sort_by_ok).slice(0, 10);

    // do no send data to frotend on any line
    // just on the best
    for(var i = 0; i < 10; i++) {
      if(realm == most_used_data[i][0]) {      // realm amongst 10 best realms, update frontend
        io.emit('update_used', most_used_data);
        break;
      }
    }

    // do no send data to frotend on any line
    // just on the best
    for(var i = 0; i < 10; i++) {
      if(visinst == most_provided_data[i][0]) {      // visinst amongst 10 best visinsts, update frontend
        io.emit('update_provided', most_provided_data);
        break;
      }
    }
  }
  // --------------------------------------------------------------------------------------
  function sort_by_ok(a, b) {
    return b[1].ok - a[1].ok;
  }
  // --------------------------------------------------------------------------------------
};
