import './App.css';
import React from 'react';
import * as d3 from 'd3';
import ReactDOM  from 'react-dom';

const { useState, useEffect, useCallback, useRef } = React;

//set universals//
const titleLabel = "Monthly Global Land-Surface Temperature";
const subtitleLabel = "1753 - 2015 | base temperature 8.66 °C";
const width = 1200;
const height = 500;
const margin = { top: 30, right: 170, bottom: 20, left: 100 };
const innerHeight = height - margin.top - margin.bottom;
const innerWidth = width - margin.right - margin.left;

// App Component
const App = () => {
  const data = useData();
  const [hoveredValue, setHoveredValue] = useState(null);
  const [mousePosition, setMousePosition] = useState({ x: 0, y: 0 });

  const handleMouseMove = useCallback(
    (event) => {
      const { clientX, clientY } = event;
      setMousePosition({ x: clientX, y: clientY });
    },
    [setMousePosition]
  );

//loading page
  if (!data) {
    return <pre>Loading...</pre>;
  }

  // const variance = (d) => d.variance;
  const monthNumber = (d) => d.month;
  const xValue = (d) => d.year;
  const bottomAxisLabel = "Year";
  const yValue = (d) => d.monthName;
  const tempValue = (d) => d.temp;

  const xScale = d3
    .scaleLinear()
    .domain(d3.extent(data, xValue))
    .range([0, innerWidth]);

  const yScale = d3
    .scaleBand()
    .domain(data.map(yValue))
    .range([0, innerHeight]);

  const tempColorScale = d3
    .scaleQuantize()
    .domain(d3.extent(data, tempValue))
    .range([
      "#0000ff",
      "#0022ff",
      "#0064ff",
      "#00a4ff",
      "#00e4ff",
      "#00ff83",
      "#17ff00",
      "#b0ff00",
      "#FFf000",
      "#FFc800",
      "#FFa000",
      "#FF7800",
      "#FF5000",
      "#FF2800",
      "#FF0000"
    ]);

  const yearsArr = xScale.domain();
  const yearsSpread = yearsArr[1] - yearsArr[0];

  const barWidth = innerWidth / yearsSpread;
  const barHeight = innerHeight / 12;

  return (
    <div>
      <Tooltip hoveredValue={hoveredValue} mousePosition={mousePosition} />
      <div id="viz-container">
        <div id="title">{titleLabel}</div>
        <div id="description">{subtitleLabel}</div>
        <div id="bottom-axis-label">{bottomAxisLabel}</div>
        <svg id="svg" width={width} height={height}>
          <Legend innerWidth={innerWidth} tempColorScale={tempColorScale} tempValue={tempValue} />
          <g transform={`translate(${margin.left}, ${margin.top})`}>
            <g id="y-axis" className="y-axis">
              <AxisLeft
                yScale={yScale}
                innerWidth={innerWidth}
                tickOffset={12}
              />
            </g>
            <g id="x-axis" className="x-axis">
              <AxisBottom
                xScale={xScale}
                innerHeight={innerHeight}
                tickOffset={8}
              />
            </g>
            <Marks
              data={data}
              xScale={xScale}
              xValue={xValue}
              yScale={yScale}
              yValue={yValue}
              monthNumber={monthNumber}
              tempColorScale={tempColorScale}
              tempValue={tempValue}
              barWidth={barWidth}
              barHeight={barHeight}
              setHoveredValue={setHoveredValue}
              handleMouseMove={handleMouseMove}
            />
          </g>
        </svg>
      </div>
    </div>
  );
};

// Legend Component
const Legend = ({ innerWidth, tempColorScale }) => {
  const ref = useRef();

  //legend component is glitchy//

  // useEffect(() => {
  //   const legendG = d3.select(ref.current);
  //   const colorLegend = d3
  //     .legendColor()
  //     .labelFormat(d3.format(".2f"))
  //     .useClass(false)
  //     .title("Temperature Range in °C")
  //     .titleWidth(100)
  //     .scale(tempColorScale);
  //   legendG.call(colorLegend);
  // }, [tempColorScale]);

  return (
    <g
      ref={ref}
      id="legend"
      className="legendQuant"
      transform={`translate(${innerWidth + 130}, 50)`}
    />
  );
};

// Marks (Cells) Component
const Marks = ({
  data,
  xScale,
  xValue,
  yScale,
  yValue,
  monthNumber,
  tempColorScale,
  tempValue,
  barWidth,
  barHeight,
  setHoveredValue,
  handleMouseMove
}) =>
  data.map((d, i) => (
    <>
      <rect
        key={xValue(d) + yValue(d) + tempValue(d)}
        id={xValue(d) + yValue(d) + tempValue(d)}
        data-year={xValue(d)}
        data-month={monthNumber(d) - 1}
        data-temp={tempValue(d)}
        className="cell"
        x={xScale(xValue(d))}
        y={yScale(yValue(d))}
        fill={tempColorScale(tempValue(d))}
        width={barWidth}
        height={barHeight}
        onMouseEnter={() => setHoveredValue(d)}
        onMouseLeave={() => setHoveredValue(null)}
        onMouseMove={handleMouseMove}
      />
    </>
  ));

// Tooltip Component
const Tooltip = ({ hoveredValue, mousePosition }) => {
  if (!hoveredValue) {
    return <div id="tooltip-container" style={{ visibility: "hidden" }}></div>;
  } else {
    const xPosition = mousePosition.x;
    const yPosition = mousePosition.y;
    return (
      <div
        id="tooltip-container"
        style={{ left: `${xPosition + 15}px`, top: `${yPosition - 25}px` }}
      >
        <div>
          <div id="tooltip" data-year={hoveredValue.year}>
            <div>
              <span style={{ fontSize: "1.3rem" }}>{hoveredValue.year}</span>
            </div>
            <div>
              <strong>{hoveredValue.monthName}</strong>
            </div>
            <div>{Number.parseFloat(hoveredValue.temp).toFixed(2)} °C</div>
            <div>{Number.parseFloat(hoveredValue.variance).toFixed(2)}</div>
          </div>
        </div>
      </div>
    );
  }
};

// AxisLeft Component
const AxisLeft = ({ yScale, innerWidth, tickOffset }) =>
  yScale.domain().map((tickValue) => (
    <g
      key={tickValue}
      className="tick"
      transform={`translate(0,${yScale(tickValue) + yScale.bandwidth() / 2})`}
    >
      <line x2={innerWidth} stroke="#f1f2f3" />
      <text style={{ textAnchor: "end" }} x={-tickOffset} dy=".32em">
        {tickValue}
      </text>
    </g>
  ));

// AxisBottom Component
const AxisBottom = ({ xScale, innerHeight, tickOffset }) =>
  xScale.ticks().map((tickValue) => (
    <g
      key={tickValue}
      className="tick"
      transform={`translate(${xScale(tickValue)},0)`}
    >
      <line y2={innerHeight} stroke="#f1f2f3" />
      <text
        style={{ textAnchor: "middle" }}
        dy=".71em"
        y={innerHeight + tickOffset}
      >
        {tickValue}
      </text>
    </g>
  ));

// Custom Hook
const useData = () => {
  const [data, setData] = useState(null);
  const [loaded, setLoaded] = useState(false);
  
  const url =
  "https://raw.githubusercontent.com/freeCodeCamp/ProjectReferenceData/master/global-temperature.json";
  
  useEffect(() => {
    d3.json(url).then((json) => {
      setData(json.monthlyVariance);
    });
  }, []);

  useEffect(() => {
    if (data) {
      data.forEach((d) => {
        let month = d.month - 1;
        d.monthName = new Date(1976, month, 28).toLocaleString("default", {
          month: "long"
        });
        d.temp = d.variance + 8.66;
      });
      setLoaded(true);
    }
  }, [data]);
  
  return data
}

const rootElement = document.getElementById("root");
ReactDOM.render(<App />, rootElement);
export default App;
