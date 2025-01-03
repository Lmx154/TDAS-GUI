import React, { useRef, useEffect } from "react";
import * as d3 from "d3";
import PropTypes from "prop-types";
import { useLayout } from '../context/LayoutContext';

// Add smoothing function
const smoothData = (data, xAccessor, yAccessor, windowSize = 5) => {
  return data.map((point, index) => {
    const start = Math.max(0, index - windowSize + 1);
    const window = data.slice(start, index + 1);
    const smoothedY = d3.mean(window, yAccessor);
    return {
      ...point,
      smoothedValue: smoothedY
    };
  });
};

function LineChart({
  data,
  xAccessor,
  yAccessor,
  color = "steelblue",
  title = "",
  margin = { top: 20, right: 20, bottom: 30, left: 50 },
}) {
  const { componentDimensions } = useLayout();
  const dimensions = componentDimensions.telemetryCharts || { width: 600, height: 400 };

  const svgRef = useRef(null);
  const pathRef = useRef(null);
  const xAxisRef = useRef(null);
  const yAxisRef = useRef(null);

  useEffect(() => {
    if (!data || data.length === 0) return;

    // Apply smoothing and limit data points
    const smoothedData = smoothData(data, xAccessor, yAccessor);
    const limitedData = smoothedData.slice(-50); // Keep only last 50 points

    const svg = d3.select(svgRef.current);
    const path = d3.select(pathRef.current);
    const xAxisGroup = d3.select(xAxisRef.current);
    const yAxisGroup = d3.select(yAxisRef.current);

    const innerWidth = dimensions.width - margin.left - margin.right;
    const innerHeight = dimensions.height - margin.top - margin.bottom;

    // Update scales to use smoothed values
    const xScale = d3
      .scaleTime()
      .domain(d3.extent(limitedData, xAccessor))
      .range([0, innerWidth]);

    const yScale = d3
      .scaleLinear()
      .domain([
        d3.min(limitedData, d => d.smoothedValue) * 0.95,
        d3.max(limitedData, d => d.smoothedValue) * 1.05,
      ])
      .range([innerHeight, 0]);

    // Update the axes
    const xAxis = d3.axisBottom(xScale)
      .ticks(5)  // Limit the number of ticks
      .tickFormat(d3.timeFormat("%H:%M:%S")); // Format time as HH:MM:SS
    const yAxis = d3.axisLeft(yScale);

    xAxisGroup
      .attr("transform", `translate(0,${innerHeight})`)
      .transition()
      .call(xAxis);

    yAxisGroup.transition().call(yAxis);

    // Update line generator to use smoothed values
    const line = d3
      .line()
      .x(d => xScale(xAccessor(d)))
      .y(d => yScale(d.smoothedValue))
      .curve(d3.curveBasis); // Use curve basis for additional smoothing

    // Update the path with transition
    path
      .datum(limitedData)
      .transition()
      .ease(d3.easeLinear)
      .duration(1000)
      .attr("d", line);
  }, [data, xAccessor, yAccessor, color, dimensions, margin]);

  useEffect(() => {
    // Trigger resize handling when dimensions change
    if (svgRef.current) {
      const svg = d3.select(svgRef.current);
      svg.attr('width', dimensions.width)
         .attr('height', dimensions.height);
      // Re-render chart...
    }
  }, [dimensions, data]);

  return (
    <svg
      ref={svgRef}
      width={dimensions.width}
      height={dimensions.height}
      style={{
        backgroundColor: "rgba(255, 255, 255, 0.1)",
        borderRadius: "8px",
        padding: "10px",
        transition: 'all 0.3s ease'
      }}
    >
      {title && (
        <text
          x={dimensions.width / 2}
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
