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
  margin = { top: 50, right: 30, bottom: 30, left: 50 },
  title = "",
  timeWindow = 30000, // 30 seconds default
}) {
  const svgRef = useRef(null);

  useEffect(() => {
    if (!data || data.length === 0) return;

    // Filter data based on timeWindow
    const now = new Date();
    const filtered = data.filter(d => {
      const timestamp = xAccessor(d);
      return (now - timestamp) <= timeWindow;
    });

    if (filtered.length === 0) return;

    // Clear previous content
    const svg = d3.select(svgRef.current);
    svg.selectAll("*").remove();

    const innerWidth = width - margin.left - margin.right;
    const innerHeight = height - margin.top - margin.bottom;

    // Create scales
    const xScale = d3.scaleTime()
      .domain(d3.extent(filtered, xAccessor))
      .range([0, innerWidth]);

    const yScale = d3.scaleLinear()
      .domain([
        d3.min(filtered, yAccessor) * 0.95,
        d3.max(filtered, yAccessor) * 1.05
      ])
      .range([innerHeight, 0]);

    // Create line generator
    const line = d3.line()
      .x(d => xScale(xAccessor(d)))
      .y(d => yScale(yAccessor(d)))
      .curve(d3.curveMonotoneX);

    const g = svg.append("g")
      .attr("transform", `translate(${margin.left},${margin.top})`);

    // Add gridlines
    g.append("g")
      .attr("class", "grid")
      .attr("transform", `translate(0,${innerHeight})`)
      .call(d3.axisBottom(xScale)
        .ticks(5)
        .tickSize(-innerHeight)
        .tickFormat(""))
      .style("stroke-opacity", 0.1);

    g.append("g")
      .attr("class", "grid")
      .call(d3.axisLeft(yScale)
        .ticks(5)
        .tickSize(-innerWidth)
        .tickFormat(""))
      .style("stroke-opacity", 0.1);

    // Add axes
    g.append("g")
      .attr("transform", `translate(0,${innerHeight})`)
      .call(d3.axisBottom(xScale).ticks(5));

    g.append("g")
      .call(d3.axisLeft(yScale));

    // Add line path
    g.append("path")
      .datum(filtered)
      .attr("fill", "none")
      .attr("stroke", color)
      .attr("stroke-width", 2)
      .attr("d", line);

    // Add title
    if (title) {
      svg.append("text")
        .attr("x", width / 2)
        .attr("y", margin.top / 2)
        .attr("text-anchor", "middle")
        .attr("font-size", "16px")
        .attr("font-weight", "bold")
        .text(title);
    }

  }, [data, xAccessor, yAccessor, color, width, height, margin, title, timeWindow]);

  return (
    <div style={{ width: '100%', height: '100%' }}>
      <svg 
        ref={svgRef} 
        width={width} 
        height={height}
        style={{ 
          backgroundColor: 'rgba(255, 255, 255, 0.1)',
          borderRadius: '8px',
          padding: '10px'
        }}
      />
    </div>
  );
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
  timeWindow: PropTypes.number, // Time window in milliseconds
};

export default LineChart;
