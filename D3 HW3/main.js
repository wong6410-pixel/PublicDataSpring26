// ─────────────────────────────────────────────────────────────
//  HW3 — Interactive Temperature Comparison: Seattle vs Miami
//  Data: Monthly average temperatures (°F), 2023
//  Source: NOAA Climate Data Online (https://www.ncdc.noaa.gov/)
//  Interactions:
//    1. Dropdown — select which city/cities to show
//    2. Range slider — filter how many months are visible
// ─────────────────────────────────────────────────────────────

// ── SVG dimensions & margins ──────────────────────────────────
const margin = { top: 40, right: 120, bottom: 50, left: 60 };
const width  = 700 - margin.left - margin.right;
const height = 400 - margin.top  - margin.bottom;

// ── Color encoding: cool blue = Seattle, warm coral = Miami
const COLORS = {
  seattle: "#4A90D9",
  miami:   "#E8654A"
};

// ── Month names for x-axis and slider label
const MONTHS = ["Jan","Feb","Mar","Apr","May","Jun",
                "Jul","Aug","Sep","Oct","Nov","Dec"];

// ── Track current state
let selectedCity = "both";   // from dropdown
let maxMonth     = 12;        // from slider (1–12)

// ─────────────────────────────────────────────────────────────
// 1. CREATE SVG
// ─────────────────────────────────────────────────────────────
const svg = d3.select("#chart")
  .append("svg")
  .attr("width",  width  + margin.left + margin.right)
  .attr("height", height + margin.top  + margin.bottom);

// Main group — shifted in by margins
const g = svg.append("g")
  .attr("transform", `translate(${margin.left},${margin.top})`);

// Gridlines behind everything else
const gridG  = g.append("g").attr("class", "grid");
const xAxisG = g.append("g").attr("class", "axis x-axis")
                 .attr("transform", `translate(0,${height})`);
const yAxisG = g.append("g").attr("class", "axis y-axis");

// Y-axis label (rotated)
g.append("text")
  .attr("class", "axis-label")
  .attr("transform", "rotate(-90)")
  .attr("x", -(height / 2))
  .attr("y", -46)
  .attr("text-anchor", "middle")
  .text("Temperature (°F)");

// Tooltip div (sits inside .container so position:absolute works)
const tooltip = d3.select(".container")
  .append("div")
  .attr("class", "tooltip")
  .style("opacity", 0);

// ─────────────────────────────────────────────────────────────
// 2. LOAD CSV
// ─────────────────────────────────────────────────────────────
d3.csv("temperatures.csv").then(raw => {

  // Parse every row: date string → month label, temps → numbers
  const allData = raw.map((d, i) => ({
    month:   i + 1,           // 1–12
    label:   MONTHS[i],
    seattle: +d.seattle,
    miami:   +d.miami
  }));

  // ── Scales ────────────────────────────────────────────────
  // X: one band per month label
  const xScale = d3.scaleBand()
    .domain(MONTHS)
    .range([0, width])
    .padding(0.25);

  // Helper: get the center x of a month band
  const xMid = label => xScale(label) + xScale.bandwidth() / 2;

  // Y: fixed 25–100°F so transitions look smooth and meaningful
  const yScale = d3.scaleLinear()
    .domain([25, 100])
    .range([height, 0]);

  // ── Line generator factory ────────────────────────────────
  // Takes a city key ("seattle" or "miami"), returns a d3.line()
  const makeLine = city => d3.line()
    .x(d => xMid(d.label))
    .y(d => yScale(d[city]))
    .curve(d3.curveCatmullRom.alpha(0.5));

  // ── Draw static axes (they don't change) ──────────────────
  xAxisG.call(d3.axisBottom(xScale).tickSize(0))
    .select(".domain").remove();

  yAxisG.call(d3.axisLeft(yScale).ticks(6).tickFormat(d => d + "°"))
    .select(".domain").remove();

  // ── Draw horizontal gridlines ─────────────────────────────
  gridG.selectAll("line.grid-line")
    .data(yScale.ticks(6))
    .join("line")
    .attr("class", "grid-line")
    .attr("x1", 0).attr("x2", width)
    .attr("y1", d => yScale(d))
    .attr("y2", d => yScale(d));

  // ─────────────────────────────────────────────────────────
  // 3. DRAW / UPDATE FUNCTION
  //    Called once on load, then again on every interaction
  // ─────────────────────────────────────────────────────────
  function update() {

    // Filter data to only the months the slider allows
    const data = allData.filter(d => d.month <= maxMonth);

    // Which cities should be drawn?
    const cities = selectedCity === "both"
      ? ["seattle", "miami"]
      : [selectedCity];

    // Shared transition — all changes animate together
    const t = d3.transition().duration(500).ease(d3.easeCubicInOut);

    // ── Draw a line + dots + end-label for each active city ──
    ["seattle", "miami"].forEach(city => {
      const visible = cities.includes(city);
      const color   = COLORS[city];

      // -- Line path --
      const pathData = visible ? [data] : [];

      g.selectAll(`.line-${city}`)
        .data(pathData)
        .join(
          enter => enter.append("path")
            .attr("class", `line-${city}`)
            .attr("fill", "none")
            .attr("stroke", color)
            .attr("stroke-width", 2.5)
            .attr("stroke-linejoin", "round")
            .attr("opacity", 0),
          update => update,
          exit => exit.transition(t).attr("opacity", 0).remove()
        )
        .transition(t)
        .attr("opacity", 1)
        .attr("d", makeLine(city)(data));

      // -- Dots (one per month) --
      g.selectAll(`.dot-${city}`)
        .data(visible ? data : [], d => d.month)
        .join(
          enter => enter.append("circle")
            .attr("class", `dot-${city}`)
            .attr("r", 5)
            .attr("fill", color)
            .attr("stroke", "#fff")
            .attr("stroke-width", 1.5)
            .attr("cx", d => xMid(d.label))
            .attr("cy", d => yScale(d[city]))
            .attr("opacity", 0)
            .on("mouseover", (event, d) => {
              tooltip.style("opacity", 1)
                .html(`<strong style="color:${color}">${city === "seattle" ? "Seattle" : "Miami"}</strong><br>
                       ${d.label}: <strong>${d[city]}°F</strong>`);
            })
            .on("mousemove", event => {
              const [mx, my] = d3.pointer(event, d3.select(".container").node());
              tooltip.style("left", (mx + 14) + "px").style("top", (my - 30) + "px");
            })
            .on("mouseout", () => tooltip.style("opacity", 0)),
          update => update,
          exit => exit.transition(t).attr("opacity", 0).remove()
        )
        .transition(t)
        .attr("opacity", 1)
        .attr("cx", d => xMid(d.label))
        .attr("cy", d => yScale(d[city]));

      // -- City label at the end of each line --
      const lastPoint = data[data.length - 1];
      g.selectAll(`.label-${city}`)
        .data(visible && lastPoint ? [lastPoint] : [])
        .join(
          enter => enter.append("text")
            .attr("class", `label-${city}`)
            .attr("fill", color)
            .attr("font-size", 12)
            .attr("font-weight", "600")
            .attr("dominant-baseline", "middle")
            .attr("opacity", 0),
          update => update,
          exit => exit.transition(t).attr("opacity", 0).remove()
        )
        .transition(t)
        .attr("opacity", 1)
        .attr("x", xMid(lastPoint.label) + 10)
        .attr("y", yScale(lastPoint[city]))
        .text(city === "seattle" ? "Seattle" : "Miami");
    });
  }

  // ─────────────────────────────────────────────────────────
  // 4. EVENT LISTENERS — the two required interactions
  // ─────────────────────────────────────────────────────────

  // INTERACTION 1: Dropdown — update selectedCity, redraw
  d3.select("#city-select").on("change", function() {
    selectedCity = this.value;
    update();
  });

  // INTERACTION 2: Range slider — update maxMonth, update label, redraw
  d3.select("#month-slider").on("input", function() {
    maxMonth = +this.value;
    d3.select("#slider-label").text(MONTHS[maxMonth - 1]);
    update();
  });

  // ── First draw ────────────────────────────────────────────
  update();

}).catch(err => {
  // If the CSV doesn't load, show a clear error message
  d3.select("#chart")
    .append("p")
    .style("color", "red")
    .style("padding", "1rem")
    .text("Error: could not load temperatures.csv — make sure it is in the same folder and you are using a local server.");
  console.error(err);
});