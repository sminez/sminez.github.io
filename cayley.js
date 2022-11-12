d3.functor = function functor(v) {
  return typeof v === "function"
    ? v
    : function () {
        return v;
      };
};

function getColor(d) {
  return activeScale == colorScale ? activeScale(d.value) : activeScale(d.sign);
}

var margin = { top: 20, right: 10, bottom: 10, left: 10 },
  width = 400 - margin.left - margin.right,
  height = 400 - margin.top - margin.bottom;

var signColorScale = d3
  .scaleOrdinal()
  .domain(["+ve", "-ve"])
  .range(["#fbf1c7", "#504945"]);
var colorScale = d3
  .scaleOrdinal()
  .domain([
    "αp",
    "α23",
    "α31",
    "α12",
    "α0",
    "α023",
    "α031",
    "α012",
    "α123",
    "α1",
    "α2",
    "α3",
    "α0123",
    "α01",
    "α02",
    "α03",
  ])
  .range([
    "#dbc78f",
    "#4a778f",
    "#6fa0b0",
    "#8fb5bf",
    "#872e2e",
    "#76718f",
    "#9c8ead",
    "#b49bbf",
    "#4c4861",
    "#bd4442",
    "#d66847",
    "#d98e66",
    "#dbaa56",
    "#498c6b",
    "#84b394",
    "#9fc4a0",
  ]);

var activeScale = colorScale;

var combined = [
  [
    { val: "p", sign: "+ve" },
    { val: "23", sign: "+ve" },
    { val: "31", sign: "+ve" },
    { val: "12", sign: "+ve" },
    { val: "0", sign: "+ve" },
    { val: "023", sign: "+ve" },
    { val: "031", sign: "+ve" },
    { val: "012", sign: "+ve" },
    { val: "123", sign: "+ve" },
    { val: "1", sign: "+ve" },
    { val: "2", sign: "+ve" },
    { val: "3", sign: "+ve" },
    { val: "0123", sign: "+ve" },
    { val: "01", sign: "+ve" },
    { val: "02", sign: "+ve" },
    { val: "03", sign: "+ve" },
  ],
  [
    { val: "23", sign: "+ve" },
    { val: "p", sign: "-ve" },
    { val: "12", sign: "+ve" },
    { val: "31", sign: "-ve" },
    { val: "023", sign: "+ve" },
    { val: "0", sign: "-ve" },
    { val: "012", sign: "+ve" },
    { val: "031", sign: "-ve" },
    { val: "1", sign: "-ve" },
    { val: "123", sign: "+ve" },
    { val: "3", sign: "+ve" },
    { val: "2", sign: "-ve" },
    { val: "01", sign: "-ve" },
    { val: "0123", sign: "+ve" },
    { val: "03", sign: "+ve" },
    { val: "02", sign: "-ve" },
  ],
  [
    { val: "31", sign: "+ve" },
    { val: "12", sign: "-ve" },
    { val: "p", sign: "-ve" },
    { val: "23", sign: "+ve" },
    { val: "031", sign: "+ve" },
    { val: "012", sign: "-ve" },
    { val: "0", sign: "-ve" },
    { val: "023", sign: "+ve" },
    { val: "2", sign: "-ve" },
    { val: "3", sign: "-ve" },
    { val: "123", sign: "+ve" },
    { val: "1", sign: "+ve" },
    { val: "02", sign: "-ve" },
    { val: "03", sign: "-ve" },
    { val: "0123", sign: "+ve" },
    { val: "01", sign: "+ve" },
  ],
  [
    { val: "12", sign: "+ve" },
    { val: "31", sign: "+ve" },
    { val: "23", sign: "-ve" },
    { val: "p", sign: "-ve" },
    { val: "012", sign: "+ve" },
    { val: "031", sign: "+ve" },
    { val: "023", sign: "-ve" },
    { val: "0", sign: "-ve" },
    { val: "3", sign: "-ve" },
    { val: "2", sign: "+ve" },
    { val: "1", sign: "-ve" },
    { val: "123", sign: "+ve" },
    { val: "03", sign: "-ve" },
    { val: "02", sign: "+ve" },
    { val: "01", sign: "-ve" },
    { val: "0123", sign: "+ve" },
  ],
  [
    { val: "0", sign: "+ve" },
    { val: "023", sign: "+ve" },
    { val: "031", sign: "+ve" },
    { val: "012", sign: "+ve" },
    { val: "p", sign: "+ve" },
    { val: "23", sign: "+ve" },
    { val: "31", sign: "+ve" },
    { val: "12", sign: "+ve" },
    { val: "0123", sign: "+ve" },
    { val: "01", sign: "+ve" },
    { val: "02", sign: "+ve" },
    { val: "03", sign: "+ve" },
    { val: "123", sign: "+ve" },
    { val: "1", sign: "+ve" },
    { val: "2", sign: "+ve" },
    { val: "3", sign: "+ve" },
  ],
  [
    { val: "023", sign: "+ve" },
    { val: "0", sign: "-ve" },
    { val: "012", sign: "+ve" },
    { val: "031", sign: "-ve" },
    { val: "23", sign: "+ve" },
    { val: "p", sign: "-ve" },
    { val: "12", sign: "+ve" },
    { val: "31", sign: "-ve" },
    { val: "01", sign: "-ve" },
    { val: "0123", sign: "+ve" },
    { val: "03", sign: "+ve" },
    { val: "02", sign: "-ve" },
    { val: "1", sign: "-ve" },
    { val: "123", sign: "+ve" },
    { val: "3", sign: "+ve" },
    { val: "2", sign: "-ve" },
  ],
  [
    { val: "031", sign: "+ve" },
    { val: "012", sign: "-ve" },
    { val: "0", sign: "-ve" },
    { val: "023", sign: "+ve" },
    { val: "31", sign: "+ve" },
    { val: "12", sign: "-ve" },
    { val: "p", sign: "-ve" },
    { val: "23", sign: "+ve" },
    { val: "02", sign: "-ve" },
    { val: "03", sign: "-ve" },
    { val: "0123", sign: "+ve" },
    { val: "01", sign: "+ve" },
    { val: "2", sign: "-ve" },
    { val: "3", sign: "-ve" },
    { val: "123", sign: "+ve" },
    { val: "1", sign: "+ve" },
  ],
  [
    { val: "012", sign: "+ve" },
    { val: "031", sign: "+ve" },
    { val: "023", sign: "-ve" },
    { val: "0", sign: "-ve" },
    { val: "12", sign: "+ve" },
    { val: "31", sign: "+ve" },
    { val: "23", sign: "-ve" },
    { val: "p", sign: "-ve" },
    { val: "03", sign: "-ve" },
    { val: "02", sign: "+ve" },
    { val: "01", sign: "-ve" },
    { val: "0123", sign: "+ve" },
    { val: "3", sign: "-ve" },
    { val: "2", sign: "+ve" },
    { val: "1", sign: "-ve" },
    { val: "123", sign: "+ve" },
  ],
  [
    { val: "123", sign: "+ve" },
    { val: "1", sign: "-ve" },
    { val: "2", sign: "-ve" },
    { val: "3", sign: "-ve" },
    { val: "0123", sign: "-ve" },
    { val: "01", sign: "+ve" },
    { val: "02", sign: "+ve" },
    { val: "03", sign: "+ve" },
    { val: "p", sign: "+ve" },
    { val: "23", sign: "-ve" },
    { val: "31", sign: "-ve" },
    { val: "12", sign: "-ve" },
    { val: "0", sign: "-ve" },
    { val: "023", sign: "+ve" },
    { val: "031", sign: "+ve" },
    { val: "012", sign: "+ve" },
  ],
  [
    { val: "1", sign: "+ve" },
    { val: "123", sign: "+ve" },
    { val: "3", sign: "+ve" },
    { val: "2", sign: "-ve" },
    { val: "01", sign: "-ve" },
    { val: "0123", sign: "-ve" },
    { val: "03", sign: "-ve" },
    { val: "02", sign: "+ve" },
    { val: "23", sign: "-ve" },
    { val: "p", sign: "-ve" },
    { val: "12", sign: "+ve" },
    { val: "31", sign: "-ve" },
    { val: "023", sign: "+ve" },
    { val: "0", sign: "+ve" },
    { val: "012", sign: "-ve" },
    { val: "031", sign: "+ve" },
  ],
  [
    { val: "2", sign: "+ve" },
    { val: "3", sign: "-ve" },
    { val: "123", sign: "+ve" },
    { val: "1", sign: "+ve" },
    { val: "02", sign: "-ve" },
    { val: "03", sign: "+ve" },
    { val: "0123", sign: "-ve" },
    { val: "01", sign: "-ve" },
    { val: "31", sign: "-ve" },
    { val: "12", sign: "-ve" },
    { val: "p", sign: "-ve" },
    { val: "23", sign: "+ve" },
    { val: "031", sign: "+ve" },
    { val: "012", sign: "+ve" },
    { val: "0", sign: "+ve" },
    { val: "023", sign: "-ve" },
  ],
  [
    { val: "3", sign: "+ve" },
    { val: "2", sign: "+ve" },
    { val: "1", sign: "-ve" },
    { val: "123", sign: "+ve" },
    { val: "03", sign: "-ve" },
    { val: "02", sign: "-ve" },
    { val: "01", sign: "+ve" },
    { val: "0123", sign: "-ve" },
    { val: "12", sign: "-ve" },
    { val: "31", sign: "+ve" },
    { val: "23", sign: "-ve" },
    { val: "p", sign: "-ve" },
    { val: "012", sign: "+ve" },
    { val: "031", sign: "-ve" },
    { val: "023", sign: "+ve" },
    { val: "0", sign: "+ve" },
  ],
  [
    { val: "0123", sign: "+ve" },
    { val: "01", sign: "-ve" },
    { val: "02", sign: "-ve" },
    { val: "03", sign: "-ve" },
    { val: "123", sign: "-ve" },
    { val: "1", sign: "+ve" },
    { val: "2", sign: "+ve" },
    { val: "3", sign: "+ve" },
    { val: "0", sign: "+ve" },
    { val: "023", sign: "-ve" },
    { val: "031", sign: "-ve" },
    { val: "012", sign: "-ve" },
    { val: "p", sign: "-ve" },
    { val: "23", sign: "+ve" },
    { val: "31", sign: "+ve" },
    { val: "12", sign: "+ve" },
  ],
  [
    { val: "01", sign: "+ve" },
    { val: "0123", sign: "+ve" },
    { val: "03", sign: "+ve" },
    { val: "02", sign: "-ve" },
    { val: "1", sign: "-ve" },
    { val: "123", sign: "-ve" },
    { val: "3", sign: "-ve" },
    { val: "2", sign: "+ve" },
    { val: "023", sign: "-ve" },
    { val: "0", sign: "-ve" },
    { val: "012", sign: "+ve" },
    { val: "031", sign: "-ve" },
    { val: "23", sign: "+ve" },
    { val: "p", sign: "+ve" },
    { val: "12", sign: "-ve" },
    { val: "31", sign: "+ve" },
  ],
  [
    { val: "02", sign: "+ve" },
    { val: "03", sign: "-ve" },
    { val: "0123", sign: "+ve" },
    { val: "01", sign: "+ve" },
    { val: "2", sign: "-ve" },
    { val: "3", sign: "+ve" },
    { val: "123", sign: "-ve" },
    { val: "1", sign: "-ve" },
    { val: "031", sign: "-ve" },
    { val: "012", sign: "-ve" },
    { val: "0", sign: "-ve" },
    { val: "023", sign: "+ve" },
    { val: "31", sign: "+ve" },
    { val: "12", sign: "+ve" },
    { val: "p", sign: "+ve" },
    { val: "23", sign: "-ve" },
  ],
  [
    { val: "03", sign: "+ve" },
    { val: "02", sign: "+ve" },
    { val: "01", sign: "-ve" },
    { val: "0123", sign: "+ve" },
    { val: "3", sign: "-ve" },
    { val: "2", sign: "-ve" },
    { val: "1", sign: "+ve" },
    { val: "123", sign: "-ve" },
    { val: "012", sign: "-ve" },
    { val: "031", sign: "+ve" },
    { val: "023", sign: "-ve" },
    { val: "0", sign: "-ve" },
    { val: "12", sign: "+ve" },
    { val: "31", sign: "-ve" },
    { val: "23", sign: "+ve" },
    { val: "p", sign: "+ve" },
  ],
];

var xScale = d3.scaleLinear().range([0, width]).domain([0, combined[0].length]);
var yScale = d3.scaleLinear().range([0, height]).domain([0, combined.length]);
var div = d3
  .select("body")
  .append("div")
  .attr("class", "tooltip")
  .style("opacity", 0);

var svg = d3
  .select("#chart")
  .append("svg")
  .attr("width", width + margin.left + margin.right)
  .attr("height", height + margin.top + margin.bottom)
  .append("g")
  .attr("transform", "translate(" + margin.left + "," + margin.top + ")")
  .on("click", function () {
    activeScale = activeScale == colorScale ? signColorScale : colorScale;
    row.selectAll(".cell").style("fill", function (d) {
      return getColor(d);
    });
  });

var row = svg
  .selectAll(".row")
  .data(combined)
  .enter()
  .append("svg:g")
  .attr("class", "row");

var col = row
  .selectAll(".cell")
  .data(function (d, i) {
    return d.map(function (a) {
      return { value: a.val, sign: a.sign, row: i };
    });
  })
  .enter()
  .append("svg:rect")
  .attr("class", "cell")
  .attr("x", function (_, i) {
    return xScale(i);
  })
  .attr("y", function (d, _) {
    return yScale(d.row);
  })
  .attr("width", xScale(1))
  .attr("height", yScale(1))
  .style("fill", function (d) {
    return getColor(d);
  });
