import React, { useRef, useEffect } from "react";
import * as d3 from "d3";
import PropTypes from "prop-types";

function LineChart({
  data,
  xAccessor,
  yAccessor,
  color = "steelblue",
  width = 800,
  height = 300,
  margin = { top: 20, right: 20, bottom: 30, left: 50 },
  title = "",
}) {
  const svgRef = useRef(null);
  const pathRef = useRef(null);
  const xAxisRef = useRef(null);
  const yAxisRef = useRef(null);

  useEffect(() => {
    if (!data || data.length === 0) return;

    const svg = d3.select(svgRef.current);
    const path = d3.select(pathRef.current);
    const xAxisGroup = d3.select(xAxisRef.current);
    const yAxisGroup = d3.select(yAxisRef.current);

    const innerWidth = width - margin.left - margin.right;
    const innerHeight = height - margin.top - margin.bottom;

    // Create scales
    const xScale = d3
      .scaleTime()
      .domain(d3.extent(data, xAccessor))
      .range([0, innerWidth]);

    const yScale = d3
      .scaleLinear()
      .domain([
        d3.min(data, yAccessor) * 0.95,
        d3.max(data, yAccessor) * 1.05,
      ])
      .range([innerHeight, 0]);

    // Update the axes
    const xAxis = d3.axisBottom(xScale);
    const yAxis = d3.axisLeft(yScale);

    xAxisGroup
      .attr("transform", `translate(0,${innerHeight})`)
      .transition()
      .call(xAxis);

    yAxisGroup.transition().call(yAxis);

    // Create the line generator
    const line = d3
      .line()
      .x((d) => xScale(xAccessor(d)))
      .y((d) => yScale(yAccessor(d)))
      .curve(d3.curveLinear);

    // Update the path with transition
    path
      .datum(data)
      .transition()
      .ease(d3.easeLinear)
      .duration(1000)
      .attr("d", line);
  }, [data, xAccessor, yAccessor, color, width, height, margin]);

  return (
    <svg
      ref={svgRef}
      width={width}
      height={height}
      style={{
        backgroundColor: "rgba(255, 255, 255, 0.1)",
        borderRadius: "8px",
        padding: "10px",
      }}
    >
      {title && (
        <text
          x={width / 2}
          y={margin.top / 2}
          textAnchor="middle"
          fontSize="16px"
          fontWeight="bold"
        >
          {title}
        </text>
      )}
      <g
        transform={`translate(${margin.left},${margin.top})`}
        ref={svgRef}
      >
        <g ref={xAxisRef} />
        <g ref={yAxisRef} />
        <path ref={pathRef} fill="none" stroke={color} strokeWidth={2} />
      </g>
    </svg>
  );
}

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
