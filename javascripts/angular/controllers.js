// --------------------------------------------------------------------------------------
// controller for presentation page
// --------------------------------------------------------------------------------------
angular.module('etlog').controller('presenstation_controller', ['$scope', '$http', '$q', function ($scope, $http, $q) {
  var graph_title1 = "organizace nejvíce poskytující konektivitu";
  var tag1 = "#most_provided";
  var hook1 = "update_provided";
  var graph_title2 = "organizace nejvíce využívající roaming";
  var tag2 = "#most_used";
  var hook2 = "update_used";
  var max_lines = 16;
  var socket = io();

  advanced_terminal(socket, max_lines);
  //terminal_fun();
  graph_pres_new(graph_title1, tag1, hook1, socket);
  graph_pres_new(graph_title2, tag2, hook2, socket);
}]);
// --------------------------------------------------------------------------------------
function terminal_fun()
{
  var i = 0;
  var styles = [
    {
      "webkitTransform" : "translateX(-4%) rotateY(-5deg)"
    },
    {
      "webkitTransform" : "translateX(0) rotateY(0)"
    },
    {
      "webkitTransform" : "translateX(2.5%) rotateY(3deg)"
    },
  ];

  setInterval(function() {
    var el = document.getElementById("terminal");
    el.style[Object.keys(styles[i])[0]] = styles[i][Object.keys(styles[i])[0]];
    i++;
    i = i % 3;
  }, 60 * 1000); // every 60 seconds
}
// --------------------------------------------------------------------------------------
// handle terminal
// --------------------------------------------------------------------------------------
function advanced_terminal(socket, max_lines)
{
  var lines = [];

  var el = document.getElementById('terminal');
  var pr = '<span class="prompt">root@eduroam.cz:~$ </span>';

  // the array is reversed because of display method
  // the newest elements are added to the front

  socket.on('log_ok', function(data) {
    if(lines.length == max_lines)
      lines.splice(0, 1);       //delete last

    lines.push(pr + '<span class="ok">' + data + '</span>');       // add to start
    el.innerHTML = lines.join("\n");
  });

  socket.on('log_fail', function(data) {
    if(lines.length == max_lines)
      lines.splice(0, 1);       //delete last

    lines.push(pr + '<span class="fail">' + data + '</span>');       // add to start
    el.innerHTML = lines.join("\n");
  });
}
// --------------------------------------------------------------------------------------
function graph_pres_new(title, tag, event_name, socket)
{
  // Setup svg using Bostock's margin convention
  var margin = {top: 80, right: 20, bottom: 180, left: 80};

  var width = $(window).width() / 2 - 130;      // compensate for y axis labels
  var height = 600 - margin.top - margin.bottom;

  var colors = [ "#225885", "#ea3933" ];

  // --------------------------------------------------------------------
  // set the ranges
  var x = d3.scaleBand()
            .range([0, width])
            .padding(0.1);
  var y = d3.scaleLinear()
            .range([height, 0]);

  // --------------------------------------------------------------------

  var svg = d3.select(tag)
  svg = svg.attr("width", width + margin.left + margin.right)
           .attr("height", height + margin.top + margin.bottom)
           .append("g")
           .attr("transform", "translate(" + margin.left + "," + margin.top + ")");

  // ==================================================
  // set graph title
  svg.append("text")
     .attr("x", (width / 2))
     .attr("y", 0 - (margin.top / 2))
     .attr("text-anchor", "middle")
     .style("font-size", "36px")
     .style("fill", "white")
     //.style("text-decoration", "underline")
     .text(title);

  // ==================================================
  // text label for the y axis
  svg.append("text")
     .attr("transform", "rotate(-90)")
     .attr("y", 0 - margin.left)
     .attr("x", 0 - (height / 2))
     .attr("dy", "1em")
     .style("font-size", "24px")
     .style("fill", "white")
     .style("text-anchor", "middle")
     .text("počet autentizací");

  // ==================================================
  // add the x Axis
  var x_axis = svg.append("g")
                  .attr("transform", "translate(0," + height + ")")
                  .attr("class", "x axis")
                  .style("fill", "white")
                  .style("font-size", "18px");

  // ==================================================
  // add the y Axis
  var y_axis = svg.append("g")
                  .attr("class", "y axis")
                  .style("fill", "white")
                  .style("font-size", "18px");


  // ==================================================
  var legend = svg.append("g")
    .attr("transform", "translate(0,530)")
    .attr("class", "legend")
    .attr("width", 200)
    .attr("height", 110)
    .selectAll('.legend')
    .data([0, 1])
    .enter()
    .append('g')

  legend.append("rect")
    .attr("width", 40)
    .attr("height", 40)
    .attr("y", function(d, i) { return -20 + i * 40 - 10; })
    .attr("x", function(d, i) { return 0; })
    .style("fill", function (d, i) { return colors[i]; })
    .style("opacity", "0.8")

  legend.append("text")
    .attr("width", 40)
    .attr("height", 40)
    .attr("y", function(d, i) { return i * 40; })
    .attr("x", function(d, i) { return 45; })
    .style("font-size", "24px")
    .style("fill", "white")
    .text(function (d) { if(d == 0) return "úspěšné autentizace"; return "neúspěšné autentizace"; })


  // ==================================================
  // handle data when they arrive

  socket.on(event_name, function(data) {
    // ==================================================
    // transitions
    var transition = svg.transition().duration(750);
    var delay = function(d, i) { return i * 50; };
    var t = d3.transition().duration(750);

    // ==================================================
    // Scale the range of the data in the domains
    x.domain(data.map(function(d) { return d[0]; }));
    y.domain([0, d3.max(data, function(d) {
      if(d[1].fail > d[1].ok)
        return d[1].fail;
      return d[1].ok;
    })]);

    // ==================================================

    var bars = svg.selectAll(".bar").data(data, function(d) { return d[0]; }); // JOIN new data with old elements

    // ==================================================

    // exit old elements
    bars.exit()
        .attr("class", "remove")      // different class to not be selected by update, class is set on g elements
        .selectAll("rect")        // update rect elements, not g elements
        .transition(t)
        .attr("y", y(0))
        .attr("height", 0)
        .remove();      // EXIT old elements not present in new data

    bars.exit()           // remove parent g elements
        .transition(t)    // wait for removing rect elements
        .remove()      // EXIT old elements not present in new data

    // ==================================================
    // add new data
    // data with realms that were not present in previous data update
    bars = bars.enter()
               .append('g')
               .attr('class', 'bar');

    // blue
    bars.append("rect")
        .attr("class", "blue")
        .attr("y", function(d) { return y(0); })        // just for good looks - bar rises up from x axis
        .attr("width", x.bandwidth())                   // also set bar width in case different number of bars was present
        .attr("x", function(d) { return x(d[0]); });    // move on x

    // red
    bars.append("rect")
        .attr("class", "red")
        .attr("y", function(d) { return y(0); })        // just for good looks - bar rises up from x axis
        .attr("width", x.bandwidth())                   // also set bar width in case different number of bars was present
        .attr("x", function(d) { return x(d[0]); });    // move on x

    // merge new data (new realms only) with old data (realms that didnt change, but the ok/fail count may have changed)
    bars = bars.merge(bars);

    // ==================================================

    // update data present in blue/red bars
    // .bar selection is necessary for update parent data access
    // -> the data are present on all .bar elements

    svg.selectAll(".bar")
       .selectAll(".blue")
       .data(function(d) { return [d]; });

    svg.selectAll(".bar")
       .selectAll(".red")
       .data(function(d) { return [d]; });

    // ==================================================
    // UPDATE old elements present in new data

    //transition.selectAll("rect")        // update the rect elements
    transition.selectAll(".bar rect")        // update the rect elements
              .delay(delay)
              .attr("width", x.bandwidth())                                     // also set bar width in case different number of bars was present
              .attr("x", function(d) { return x(d[0]); });               // move on x

    transition.selectAll(".blue")
              .delay(delay)
              .attr("y", function(d) { return y(d[1].ok); })
              .attr("height", function(d) { return y(0) - y(d[1].ok); });          // update OK

    transition.selectAll(".red")
              .delay(delay)
              .attr("y", function(d) { return y(d[1].fail); })
              .attr("height", function(d) { return y(0) - y(d[1].fail); })         // update FAIL

    // ==================================================
    // dynamic axes transitions
    transition.select(".x.axis")
              .call(d3.axisBottom(x))
              .selectAll("text")
              .attr("dy", ".35em")
              .attr("y", 20)
              .attr("x", 0)
              .attr("transform", "rotate(45)")
              .style("text-anchor", "start")
              .delay(delay);

    transition.select(".y.axis")
              .call(d3.axisLeft(y)
              .tickSize(-width, 0, 0)
              .tickFormat(d3.format("d"))) // custom format - disable comma for thousands
              .delay(delay);
  });
}
// --------------------------------------------------------------------------------------

