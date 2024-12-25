import React, { useRef, useEffect } from "react";
import * as d3 from "d3";
import PropTypes from "prop-types";

function LineChart({
  data,
  xAccessor,
  yAccessor,
  color = "steelblue",
  width = 600,
  height = 400,
  margin = { top: 50, right: 30, bottom: 30, left: 40 }, // Increased top margin for title
  title = "", // Default empty title
}) {
  const svgRef = useRef(null);

  useEffect(() => {
    // Select the SVG element
    const svg = d3.select(svgRef.current);
    svg.selectAll("*").remove(); // Clear previous content

    const innerWidth = width - margin.left - margin.right;
    const innerHeight = height - margin.top - margin.bottom;

    // Compute the maximum y-value and round it up to the nearest multiple
    const yMax = d3.max(data, yAccessor);
    const yDomainMax = Math.ceil(yMax / 10) * 10 || 10; // Avoid yDomainMax being 0

    // Create scales
    const xScale = d3.scaleTime()
      .domain(d3.extent(data, xAccessor))
      .range([0, innerWidth]);

    const yScale = d3.scaleLinear()
      .domain([0, yDomainMax])
      .range([innerHeight, 0]);

    // Create axes
    const xAxis = d3.axisBottom(xScale).ticks(6);
    const yAxis = d3.axisLeft(yScale).ticks(5);

    // Create gridlines
    const xGrid = d3.axisBottom(xScale)
      .ticks(6)
      .tickSize(-innerHeight)
      .tickFormat("");

    const yGrid = d3.axisLeft(yScale)
      .ticks(5)
      .tickSize(-innerWidth)
      .tickFormat("");

    // Define the line generator
    const line = d3.line()
      .x(d => xScale(xAccessor(d)))
      .y(d => yScale(yAccessor(d)))
      .curve(d3.curveMonotoneX);

    // Append a group element translated by the margins
    const g = svg.append("g")
      .attr("transform", `translate(${margin.left},${margin.top})`);

    // Add X gridlines
    g.append("g")
      .attr("class", "grid")
      .attr("transform", `translate(0,${innerHeight})`)
      .call(xGrid)
      .selectAll("line")
      .attr("stroke", "#e0e0e0") // Light gray color
      .attr("stroke-opacity", 0.7);

    // Add Y gridlines
    g.append("g")
      .attr("class", "grid")
      .call(yGrid)
      .selectAll("line")
      .attr("stroke", "#e0e0e0") // Light gray color
      .attr("stroke-opacity", 0.7);

    // Add X axis
    g.append("g")
      .attr("transform", `translate(0,${innerHeight})`)
      .call(xAxis)
      .selectAll("text")
      .attr("fill", "#333"); // Darker text for readability

    // Add Y axis
    g.append("g")
      .call(yAxis)
      .selectAll("text")
      .attr("fill", "#333"); // Darker text for readability

    // Add the line path
    g.append("path")
      .datum(data)
      .attr("fill", "none")
      .attr("stroke", color)
      .attr("stroke-width", 1.5)
      .attr("d", line);

    // Add Title
    if (title) {
      svg.append("text")
        .attr("x", width / 2)
        .attr("y", margin.top / 2)
        .attr("text-anchor", "middle")
        .attr("font-size", "16px")
        .attr("font-weight", "bold")
        .text(title);
    }

  }, [data, xAccessor, yAccessor, color, width, height, margin, title]);

  return <svg ref={svgRef} width={width} height={height}></svg>;
}

// PropTypes for better type checking
LineChart.propTypes = {
  data: PropTypes.arrayOf(PropTypes.object).isRequired,
  xAccessor: PropTypes.func.isRequired,
  yAccessor: PropTypes.func.isRequired,
  color: PropTypes.string,
  width: PropTypes.number,
  height: PropTypes.number,
  margin: PropTypes.shape({
    top: PropTypes.number,
    right: PropTypes.number,
    bottom: PropTypes.number,
    left: PropTypes.number,
  }),
  title: PropTypes.string,
};

export default LineChart;
