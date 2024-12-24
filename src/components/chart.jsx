//These chart components are re-usable so don't hardcode anything. 
//look at realtimetelemetry.jsx for examples of re-usability.
import React, { useRef, useEffect } from "react";
import * as d3 from "d3";

function LineChart({ data, xAccessor, yAccessor, color = "steelblue", width = 600, height = 400 }) {
  const svgRef = useRef(null);

  useEffect(() => {
    const svg = d3.select(svgRef.current);
    svg.selectAll("*").remove(); // Clear previous content

    const margin = { top: 20, right: 30, bottom: 30, left: 40 };
    const innerWidth = width - margin.left - margin.right;
    const innerHeight = height - margin.top - margin.bottom;

    const xScale = d3.scaleTime()
      .domain(d3.extent(data, xAccessor))
      .range([0, innerWidth]);

    const yScale = d3.scaleLinear()
      .domain([0, d3.max(data, yAccessor)])
      .range([innerHeight, 0]);

    const line = d3.line()
      .x(d => xScale(xAccessor(d)))
      .y(d => yScale(yAccessor(d)))
      .curve(d3.curveMonotoneX);

    const g = svg.append("g")
      .attr("transform", `translate(${margin.left},${margin.top})`);

    g.append("g")
      .attr("transform", `translate(0,${innerHeight})`)
      .call(d3.axisBottom(xScale));

    g.append("g")
      .call(d3.axisLeft(yScale));

    g.append("path")
      .datum(data)
      .attr("fill", "none")
      .attr("stroke", color)
      .attr("stroke-width", 1.5)
      .attr("d", line);

  }, [data, xAccessor, yAccessor, color, width, height]);

  return <svg ref={svgRef} width={width} height={height}></svg>;
}

export default LineChart;
