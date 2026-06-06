const rawData = [
  { date: "2023-01-01", seattle: 41, miami: 69 },
  { date: "2023-02-01", seattle: 44, miami: 71 },
  { date: "2023-03-01", seattle: 49, miami: 75 },
  { date: "2023-04-01", seattle: 54, miami: 79 },
  { date: "2023-05-01", seattle: 61, miami: 83 },
  { date: "2023-06-01", seattle: 67, miami: 88 },
  { date: "2023-07-01", seattle: 74, miami: 90 },
  { date: "2023-08-01", seattle: 74, miami: 90 },
  { date: "2023-09-01", seattle: 67, miami: 88 },
  { date: "2023-10-01", seattle: 56, miami: 83 },
  { date: "2023-11-01", seattle: 46, miami: 76 },
  { date: "2023-12-01", seattle: 41, miami: 70 }
];
 
// ─── Layout constants ────────────────────────────────────────────────────────
 
const OUTER_RADIUS = 200;   // max radius (maps to TEMP_MAX)
const INNER_RADIUS = 60;    // centre hole radius (below our data minimum)
const TEMP_MIN     = 30;    // lower bound of radial scale (°F)
const TEMP_MAX     = 100;   // upper bound of radial scale (°F)
 
const SVG_W = 700;
const SVG_H = 580;
const CX    = SVG_W / 2;
const CY    = SVG_H / 2 + 10;
 
const MONTHS = ["Jan","Feb","Mar","Apr","May","Jun",
                 "Jul","Aug","Sep","Oct","Nov","Dec"];
 
// ─── Radial scale: temperature → pixel radius ─────────────────────────────
// d3.scaleLinear maps the temperature domain to pixel radii.
// 30°F → INNER_RADIUS (60px), 100°F → OUTER_RADIUS (200px)
const rScale = d3.scaleLinear()
  .domain([TEMP_MIN, TEMP_MAX])
  .range([INNER_RADIUS, OUTER_RADIUS]);
 
// ─── Angular positions ───────────────────────────────────────────────────────
// Divide the full circle (2π radians) into 12 equal slices.
// Subtract π/2 so that index 0 (January) starts at the top (12 o'clock).
const sliceAngle = (2 * Math.PI) / 12;
 
function angleAt(i) {
  return i * sliceAngle - Math.PI / 2;
}
 
// ─── d3.areaRadial generator ─────────────────────────────────────────────────
// Fills the polar area between the inner hole and the temperature-mapped radius.
// .angle()       — which slice (by month index)
// .innerRadius() — constant hole in the middle
// .outerRadius() — temperature mapped to radius via rScale
// .curve(d3.curveCardinalClosed) — smooth spline that closes back to Jan
function makeArea(accessor) {
  return d3.areaRadial()
    .angle((d, i) => angleAt(i))
    .innerRadius(INNER_RADIUS)
    .outerRadius(d => rScale(accessor(d)))
    .curve(d3.curveCardinalClosed);
}
 
// ─── d3.lineRadial generator (outer edge stroke) ─────────────────────────────
function makeLine(accessor) {
  return d3.lineRadial()
    .angle((d, i) => angleAt(i))
    .radius(d => rScale(accessor(d)))
    .curve(d3.curveCardinalClosed);
}
 
// ─── Build SVG ───────────────────────────────────────────────────────────────
const svg = d3.select("#chart-container")
  .append("svg")
    .attr("width",  SVG_W)
    .attr("height", SVG_H)
    .attr("viewBox", `0 0 ${SVG_W} ${SVG_H}`)
    .attr("preserveAspectRatio", "xMidYMid meet");
 
// All elements translate to chart centre so (0,0) = centre of the radial chart
const g = svg.append("g")
  .attr("transform", `translate(${CX}, ${CY})`);
 
// ─── Draw chart ───────────────────────────────────────────────────────────────
// (No async needed — data is inline, not loaded from a file)
 
// 1. Reference rings at temperature tick marks
const ringTemps = [40, 55, 70, 85, 100];
 
ringTemps.forEach(temp => {
  // Dashed concentric circle at this temperature's radius
  g.append("circle")
    .attr("class", "grid-ring")
    .attr("r", rScale(temp));
 
  // Temperature label at 12 o'clock (top of each ring)
  g.append("text")
    .attr("class", "ring-label")
    .attr("x", 0)
    .attr("y", -rScale(temp) - 4)
    .attr("text-anchor", "middle")
    .text(`${temp}°F`);
});
 
// 2. Radial spoke lines at each month boundary (between slices, not at centres)
MONTHS.forEach((_, i) => {
  const a  = angleAt(i) - sliceAngle / 2; // boundary angle between month i-1 and i
  const x1 = Math.cos(a) * INNER_RADIUS;
  const y1 = Math.sin(a) * INNER_RADIUS;
  const x2 = Math.cos(a) * (OUTER_RADIUS + 14);
  const y2 = Math.sin(a) * (OUTER_RADIUS + 14);
 
  g.append("line")
    .attr("class", "spoke")
    .attr("x1", x1).attr("y1", y1)
    .attr("x2", x2).attr("y2", y2);
});
 
// 3. Miami area (drawn first — Seattle overlaps on top where they share space)
g.append("path")
  .datum(rawData)
  .attr("class", "area-miami")
  .attr("d", makeArea(d => d.miami));
 
g.append("path")
  .datum(rawData)
  .attr("class", "line-miami")
  .attr("d", makeLine(d => d.miami));
 
// 4. Seattle area
g.append("path")
  .datum(rawData)
  .attr("class", "area-seattle")
  .attr("d", makeArea(d => d.seattle));
 
g.append("path")
  .datum(rawData)
  .attr("class", "line-seattle")
  .attr("d", makeLine(d => d.seattle));
 
// 5. Data dots with native SVG title tooltips (hover to see exact value)
// Seattle dots
g.selectAll(".dot-seattle")
  .data(rawData)
  .enter()
  .append("circle")
    .attr("class", "dot-seattle")
    .attr("cx", (d, i) => Math.cos(angleAt(i)) * rScale(d.seattle))
    .attr("cy", (d, i) => Math.sin(angleAt(i)) * rScale(d.seattle))
    .attr("r", 4)
  .append("title")
    .text((d, i) => `${MONTHS[i]}: Seattle ${d.seattle}°F`);
 
// Miami dots
g.selectAll(".dot-miami")
  .data(rawData)
  .enter()
  .append("circle")
    .attr("class", "dot-miami")
    .attr("cx", (d, i) => Math.cos(angleAt(i)) * rScale(d.miami))
    .attr("cy", (d, i) => Math.sin(angleAt(i)) * rScale(d.miami))
    .attr("r", 4)
  .append("title")
    .text((d, i) => `${MONTHS[i]}: Miami ${d.miami}°F`);
 
// 6. Month name labels placed just outside the outer ring
// text-anchor flips so labels on the left half don't run off-screen
MONTHS.forEach((name, i) => {
  const a      = angleAt(i);
  const r      = OUTER_RADIUS + 26;
  const x      = Math.cos(a) * r;
  const y      = Math.sin(a) * r;
  const anchor = x < -5 ? "end" : x > 5 ? "start" : "middle";
 
  g.append("text")
    .attr("class", "month-label")
    .attr("x", x)
    .attr("y", y)
    .attr("dy", "0.35em")
    .attr("text-anchor", anchor)
    .text(name);
});
 
// 7. Centre labels
g.append("text")
  .attr("class", "centre-year")
  .attr("x", 0).attr("y", -8)
  .attr("text-anchor", "middle")
  .text("2023");
 
g.append("text")
  .attr("class", "centre-sub")
  .attr("x", 0).attr("y", 12)
  .attr("text-anchor", "middle")
  .text("monthly avg.");
 
// 8. Legend — positioned below the chart
const legendY = OUTER_RADIUS + 65;
const legendX = -110;
 
const legend = g.append("g")
  .attr("class", "legend")
  .attr("transform", `translate(${legendX}, ${legendY})`);
 
legend.append("rect")
  .attr("x", 0).attr("y", 0).attr("width", 16).attr("height", 16).attr("rx", 3)
  .attr("fill", "#4a90d9").attr("opacity", 0.7);
 
legend.append("text")
  .attr("class", "legend-text")
  .attr("x", 24).attr("y", 12)
  .text("Seattle  (seasonal swing: 33°F)");
 
legend.append("rect")
  .attr("x", 0).attr("y", 28).attr("width", 16).attr("height", 16).attr("rx", 3)
  .attr("fill", "#e07b39").attr("opacity", 0.7);
 
legend.append("text")
  .attr("class", "legend-text")
  .attr("x", 24).attr("y", 40)
  .text("Miami  (seasonal swing: 21°F)");
 
// 9. Annotation callouts for January — the most dramatic contrast month
const janAngle  = angleAt(0);
 
// Seattle Jan callout
const seaJanR = rScale(rawData[0].seattle);
const seaTipX = Math.cos(janAngle) * seaJanR;
const seaTipY = Math.sin(janAngle) * seaJanR;
const seaLabX = seaTipX + 50;
const seaLabY = seaTipY - 44;
 
g.append("line")
  .attr("class", "annotation-line")
  .attr("x1", seaTipX + 4).attr("y1", seaTipY - 4)
  .attr("x2", seaLabX).attr("y2", seaLabY + 14);
 
g.append("text")
  .attr("class", "annotation-text")
  .attr("x", seaLabX + 2).attr("y", seaLabY)
  .text("Seattle Jan: 41°F");
 
// Miami Jan callout
const miaJanR = rScale(rawData[0].miami);
const miaTipX = Math.cos(janAngle) * miaJanR;
const miaTipY = Math.sin(janAngle) * miaJanR;
const miaLabX = miaTipX + 10;
const miaLabY = miaTipY - 52;
 
g.append("line")
  .attr("class", "annotation-line")
  .attr("x1", miaTipX + 2).attr("y1", miaTipY - 4)
  .attr("x2", miaLabX + 20).attr("y2", miaLabY + 14);
 
g.append("text")
  .attr("class", "annotation-text")
  .attr("x", miaLabX).attr("y", miaLabY)
  .text("Miami Jan: 69°F");