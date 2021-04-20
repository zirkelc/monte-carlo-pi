import React from "react";
import "./App.css";
import { AppBar, Box, Button, ButtonGroup, Container, createStyles, Divider, Grid, makeStyles, Toolbar, Typography, useMediaQuery, useTheme } from "@material-ui/core";
import { useInterval } from "./useInterval";
import Plot from 'react-plotly.js';
import { useDimensions } from "./useDimensions";

const useStyles = makeStyles((theme) => createStyles({
  pi: {
    display: 'flex',
    flexDirection: 'column',
    alignItems: 'center',
    justifyContent: 'center',
    textAlign: 'center',
    order: 2,

    [theme.breakpoints.down('xs')]: {
      order: 1,
    },
  },
  plot: {
    order: 1,
    [theme.breakpoints.down('xs')]: {
      order: 2,
    },
  },
  buttons: {
    display: "flex",
    flexDirection: "column",
    alignItems: "center",
    justifyContent: "center",
    margin: '24px 8px',

    [theme.breakpoints.down('xs')]: {
      position: 'absolute',
      bottom: 0,
    },
  },
}));

interface Raindrop {
  x: number;
  y: number;
  distance: number;
  isInside: boolean;
}

// generate random X-Y values and determine if they are inside or outside the circle
function rain(dropCounter: number): Raindrop[] {
  const drops = [];

  for (let i = 0; i < dropCounter; i++) {
    const x = Math.random();
    const y = Math.random();
    const distance = Math.sqrt(x * x + y * y);
    const isInside = distance < 1.0;

    drops.push({
      x,
      y,
      distance,
      isInside
    });
  }

  return drops;
}

// generate the X-Y array for the point clouds
function xy(drops: Raindrop[]): Float32Array {
  const result = new Float32Array(2 * drops.length)

  for (let i = 0; i < drops.length; i++) {
    result[i * 2] = drops[i].x;
    result[i * 2 + 1] = drops[i].y;
  }

  return result;
}

// calculate Y of X to draw the circle
function y(x: number) {
  return Math.sqrt(1 - (x * x));
}

// generate a sequence of numbers
// https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Global_Objects/Array/from#sequence_generator_range
function range(start: number, stop: number, step: number) {
  return Array.from({ length: (stop - start) / step + 1 }, (_, i) => start + (i * step));
}

// circle SVG path
const CIRCLE_PATH = 'M0,1 ' + range(0, 1, 0.001).map(x => `L${x},${y(x)}`).join(' ');

function App() {
  const classes = useStyles();
  const [raindrops, setRaindrops] = React.useState<Raindrop[]>([]);
  const [interval, setInterval] = React.useState<number | null>(null);
  const [dimensions, ref] = useDimensions();
  // rain interval
  useInterval(() => {
    setRaindrops((raindrops) => [...raindrops, ...rain(100)]);
  }, interval);

  const dropsInside = raindrops.filter(d => d.isInside);
  const dropsOutside = raindrops.filter(d => !d.isInside);
  const approximation = 4 * (dropsInside.length / raindrops.length);

  const dropRain = (dropCounter: number) => () => setRaindrops((raindrops) => [...raindrops, ...rain(dropCounter)]);
  const startRain = () => setInterval(500);
  const stopRain = () => setInterval(null);

  return (
    <>
      <AppBar position="static">
        <Toolbar style={{ display: 'flex', justifyContent: 'space-between' }}>
          <Typography variant="h6">Pi Simulation</Typography>

          <Typography variant="h6" style={{ textAlign: 'right' }}>
            Raindrops: {raindrops.length}
          </Typography>
        </Toolbar>
      </AppBar>

      <Grid container>
        <Grid item xs={12} sm={6} className={classes.pi}>
          <Typography variant="h6" style={{ padding: '8px', }}>
            Approximation of Pi:<br />
              π = 4 * ( <span style={{ color: 'blue' }}>{dropsInside.length || 'Inside'}</span> / <span style={{ color: 'red' }}>{dropsOutside.length || 'Outside'}</span> )<br />
            <b>{approximation}</b>
          </Typography>

          <Box className={classes.buttons}>
            <Typography variant="h6">Add Raindrops</Typography>

            <ButtonGroup variant="contained" color="primary">
              <Button disabled={interval !== null} onClick={dropRain(1)}>1</Button>
              <Button disabled={interval !== null} onClick={dropRain(10)}>10</Button>
              <Button disabled={interval !== null} onClick={dropRain(100)}>100</Button>
              <Button disabled={interval !== null} onClick={dropRain(1000)}>1000</Button>
              {interval === null ? (
                <Button variant="contained" color="primary" onClick={startRain}>Let It Rain</Button>
              ) : (
                <Button variant="contained" color="primary" onClick={stopRain}>Stop The Rain</Button>
              )}
            </ButtonGroup>
          </Box>
        </Grid>
        <Grid ref={ref} item xs={12} sm={6} className={classes.plot}>
          <Plot
            data={[
              {
                xy: xy(dropsInside),
                type: 'pointcloud',
                name: 'Inside',
                marker: { color: 'blue' },
              },
              {
                xy: xy(dropsOutside),
                name: 'Outside',
                type: 'pointcloud',
                marker: { color: 'red' },
              }
            ]}
            layout={{
              xaxis: {
                range: [0, 1],
                dtick: 0.5,
                fixedrange: true,
                rangemode: "nonnegative",
              },
              yaxis: {
                range: [0, 1],
                dtick: 0.5,
                fixedrange: true,
                rangemode: "nonnegative",
              },
              shapes: [
                {
                  type: 'path',
                  path: CIRCLE_PATH,
                  line: {
                    color: 'black'
                  }
                },
              ],
              width: dimensions?.width,
              height: dimensions?.width,
              autosize: true,
              margin: {
                l: 25,
                r: 25,
                b: 25,
                t: 25,
              },
              showlegend: false,
              uirevision: false,
              hovermode: false,
              annotations: [
                {
                  xref: 'paper',
                  yref: 'paper',
                  x: 1,
                  xanchor: 'right',
                  y: 1,
                  yanchor: 'bottom',
                  text: `Outside: ${dropsOutside.length}`,
                  showarrow: false,
                  font: {
                    size: 16,
                    color: 'red'
                  }
                },
                {
                  xref: 'paper',
                  yref: 'paper',
                  x: 0,
                  xanchor: 'left',
                  y: 1,
                  yanchor: 'bottom',
                  text: `Inside: ${dropsInside.length}`,
                  showarrow: false,
                  font: {
                    size: 16,
                    color: 'blue'
                  }
                }
              ]
            }}
            config={{
              displayModeBar: false
            }}
          />
        </Grid>
      </Grid>
    </>
  );
}

export default App;
