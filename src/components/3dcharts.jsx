import React, { useEffect, useState } from "react";
// Remove the Plotly import since we're using the CDN version

const ThreeDChart = ({ telemetry, telemetryData }) => {
  const [plotInstance, setPlotInstance] = useState(null);

  useEffect(() => {
    // Use window.Plotly instead of just Plotly
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

    const layout = {
      height: 640,
      scene: {
        xaxis: { title: 'Longitude' },
        yaxis: { title: 'Latitude' },
        zaxis: { title: 'Altitude (m)' }
      }
    };

    window.Plotly.newPlot('trajectory3d', data, layout).then(plot => {
      setPlotInstance(plot);
    });

    return () => {
      if (plotInstance) {
        window.Plotly.purge('trajectory3d');
      }
    };
  }, []);

  useEffect(() => {
    if (!plotInstance || !telemetry.gps_lat || !telemetry.gps_lon) return;

    // Update plot with new data point
    const update = {
      x: [[telemetry.gps_lon]],
      y: [[telemetry.gps_lat]],
      z: [[telemetry.gps_altitude]]
    };

    window.Plotly.extendTraces('trajectory3d', update, [0]);
  }, [telemetry, plotInstance]);

  return <div id="trajectory3d" style={{ width: "100%", height: "100%" }}></div>;
};

export default ThreeDChart;
