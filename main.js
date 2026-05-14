
const svg = d3.select("svg");

const width = 800;
const height = 500;

const margin = {
    top: 40,
    right: 40,
    bottom: 80,
    left: 80
};


d3.csv("airports_data.csv").then(function(data) {


    data.forEach(function(d) {
        d.PassengersMillions = +d.PassengersMillions;
    });

    const xScale = d3.scaleBand()
        .domain(data.map(d => d.Airport))
        .range([margin.left, width - margin.right])
        .padding(0.2);


    const yScale = d3.scaleLinear()
        .domain([0, d3.max(data, d => d.PassengersMillions)])
        .range([height - margin.bottom, margin.top]);

    svg.selectAll("rect")
        .data(data)
        .enter()
        .append("rect")
        .attr("x", d => xScale(d.Airport))
        .attr("y", d => yScale(d.PassengersMillions))
        .attr("width", xScale.bandwidth())
        .attr("height", d => height - margin.bottom - yScale(d.PassengersMillions))
        .attr("fill", "steelblue");

    svg.selectAll(".label")
        .data(data)
        .enter()
        .append("text")
        .attr("class", "label")
        .attr("x", d => xScale(d.Airport) + xScale.bandwidth() / 2)
        .attr("y", d => yScale(d.PassengersMillions) - 5)
        .attr("text-anchor", "middle")
        .text(d => d.PassengersMillions + "M");

    svg.append("g")
        .attr("transform", `translate(0,${height - margin.bottom})`)
        .call(d3.axisBottom(xScale));

    svg.append("g")
        .attr("transform", `translate(${margin.left},0)`)
        .call(d3.axisLeft(yScale));

    svg.append("text")
        .attr("x", width / 2)
        .attr("y", height - 20)
        .attr("text-anchor", "middle")
        .style("font-size", "16px")
        .text("Airport");

    svg.append("text")
        .attr("transform", "rotate(-90)")
        .attr("x", -height / 2)
        .attr("y", 25)
        .attr("text-anchor", "middle")
        .style("font-size", "16px")
        .text("Passengers (Millions)");

});