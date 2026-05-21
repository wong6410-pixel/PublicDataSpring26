
const margin = { top: 70, right: 50, bottom: 65, left: 65 };
const width  = 720 - margin.left - margin.right;
const height = 440 - margin.top  - margin.bottom;

const svg = d3.select("body")
  .append("svg")
    .attr("width",  width  + margin.left + margin.right)
    .attr("height", height + margin.top  + margin.bottom)
  .append("g")
    .attr("transform", `translate(${margin.left}, ${margin.top})`);


const parseDate = d3.timeParse("%Y-%m-%d");

d3.csv("temperatures.csv").then(function(data) {

  data.forEach(d => {
    d.date    = parseDate(d.date);
    d.seattle = +d.seattle;
    d.miami   = +d.miami;
  });

  const x = d3.scaleTime()
    .domain(d3.extent(data, d => d.date)) 
    .range([0, width]);


  const y = d3.scaleLinear()
    .domain([30, 100])   
    .range([height, 0]);

  svg.append("g")
    .attr("class", "grid")
    .call(
      d3.axisLeft(y)
        .tickSize(-width)  
        .tickFormat("")   
    );

  svg.append("g")
    .attr("class", "axis")
    .attr("transform", `translate(0, ${height})`)
    .call(
      d3.axisBottom(x)
        .tickFormat(d3.timeFormat("%b"))  // show abbreviated month name
    );

  svg.append("g")
    .attr("class", "axis")
    .call(d3.axisLeft(y));


  svg.append("text")
    .attr("class", "axis-label")
    .attr("x", width / 2)
    .attr("y", height + 50)
    .attr("text-anchor", "middle")
    .text("Month (2023)");


  svg.append("text")
    .attr("class", "axis-label")
    .attr("transform", "rotate(-90)")
    .attr("x", -height / 2)
    .attr("y", -50)
    .attr("text-anchor", "middle")
    .text("Temperature (°F)");


  svg.append("text")
    .attr("class", "chart-title")
    .attr("x", width / 2)
    .attr("y", -40)
    .attr("text-anchor", "middle")
    .text("Seattle vs. Miami — Average Monthly Temperature (°F)");

  const lineGen = d3.line()
    .x(d => x(d.date))
    .curve(d3.curveMonotoneX);


  svg.append("path")
    .datum(data)                 
    .attr("class", "line-seattle")
    .attr("d", lineGen.y(d => y(d.seattle)));

  svg.append("path")
    .datum(data)
    .attr("class", "line-miami")
    .attr("d", lineGen.y(d => y(d.miami)));

  svg.selectAll(".dot-seattle")
    .data(data)
    .enter()
    .append("circle")
      .attr("class", "dot-seattle")
      .attr("cx", d => x(d.date))
      .attr("cy", d => y(d.seattle))
      .attr("r", 4);

  svg.selectAll(".dot-miami")
    .data(data)
    .enter()
    .append("circle")
      .attr("class", "dot-miami")
      .attr("cx", d => x(d.date))
      .attr("cy", d => y(d.miami))
      .attr("r", 4);

  const legend = svg.append("g")
    .attr("class", "legend")
    .attr("transform", `translate(${width - 130}, 15)`);

  legend.append("line")
    .attr("x1", 0).attr("x2", 20).attr("y1", 0).attr("y2", 0)
    .attr("stroke", "#4a90d9").attr("stroke-width", 2.5);

  legend.append("circle")
    .attr("cx", 10).attr("cy", 0).attr("r", 4).attr("fill", "#4a90d9");

  legend.append("text")
    .attr("x", 27).attr("y", 5)
    .text("Seattle");

  legend.append("line")
    .attr("x1", 0).attr("x2", 20).attr("y1", 26).attr("y2", 26)
    .attr("stroke", "#e07b39").attr("stroke-width", 2.5);

  legend.append("circle")
    .attr("cx", 10).attr("cy", 26).attr("r", 4).attr("fill", "#e07b39");

  legend.append("text")
    .attr("x", 27).attr("y", 31)
    .text("Miami");

});
