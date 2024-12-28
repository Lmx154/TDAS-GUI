import React, { useEffect, useState } from "react";
import { useLayout } from '../context/LayoutContext';

const ThreeDChart = ({ telemetry, telemetryData }) => {
  const { componentDimensions } = useLayout();
  const dimensions = componentDimensions?.trajectory || { width: "100%", height: 640 };
  const [plotInstance, setPlotInstance] = useState(null);

  useEffect(() => {
    if (!window.Plotly) return; // Guard against Plotly not being loaded

    const data = [{
      type: 'scatter3d',
      mode: 'lines',
      x: [],  // longitude values
      y: [],  // latitude values
      z: [],  // altitude values
      opacity: 1,
      line: {
        width: 6,
        color: 'red',
      }
    }];

    const containerEl = document.getElementById('trajectory3d');
    if (!containerEl) return;

    const layout = {
      autosize: true,
      height: dimensions.height,
      width: dimensions.width,
      scene: {
        xaxis: { title: 'Longitude' },
        yaxis: { title: 'Latitude' },
        zaxis: { title: 'Altitude (m)' }
      },
      margin: { l: 0, r: 40, t: 0, b: 0 }
    };

    const config = {
      responsive: true,
      displayModeBar: true
    };

    window.Plotly.newPlot('trajectory3d', data, layout, config)
      .then(plot => {
        setPlotInstance(plot);
      })
      .catch(err => console.error('Error creating plot:', err));

    return () => {
      if (plotInstance) {
        window.Plotly.purge('trajectory3d');
      }
    };
  }, [dimensions.width, dimensions.height]);

  useEffect(() => {
    if (!plotInstance || !telemetry.gps_lat || !telemetry.gps_lon) return;

    try {
      const update = {
        x: [[telemetry.gps_lon]],
        y: [[telemetry.gps_lat]],
        z: [[telemetry.bme_altitude]] // Changed from gps_altitude to bme_altitude
      };

      window.Plotly.extendTraces('trajectory3d', update, [0])
        .catch(err => console.error('Error updating plot:', err));
    } catch (err) {
      console.error('Error in plot update:', err);
    }
  }, [telemetry, plotInstance]);

  return (
    <div 
      id="trajectory3d" 
      style={{ 
        width: dimensions.width || "100%", 
        height: dimensions.height || 640,
        transition: 'all 0.3s ease'
      }} 
    />
  );
};

export default ThreeDChart;
