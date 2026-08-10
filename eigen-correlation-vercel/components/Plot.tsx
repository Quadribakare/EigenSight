"use client";

import dynamic from "next/dynamic";

// Plotly needs a browser; loading it during SSR breaks the build. Built
// against plotly.js-dist-min (via the factory) instead of full plotly.js
// to keep the client bundle smaller.
const Plot = dynamic(
  async () => {
    const [{ default: createPlotlyComponent }, { default: Plotly }] = await Promise.all([
      import("react-plotly.js/factory"),
      import("plotly.js-dist-min"),
    ]);
    return createPlotlyComponent(Plotly);
  },
  { ssr: false },
);

export default Plot;
