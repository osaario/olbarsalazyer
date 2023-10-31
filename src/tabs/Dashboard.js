import React from "react";
import {
  VictoryBar,
  VictoryChart,
  VictoryTheme,
  VictoryGroup,
  VictoryAxis,
  VictoryLegend,
  VictoryTooltip,
} from "victory";
import _ from "lodash";
import moment from "moment";
import { getData } from "../dumps";
const BAR_WIDTH = 4;

const stringToColour = (str) => {
  let hash = 0;
  str.split("").forEach((char) => {
    hash = char.charCodeAt(0) + ((hash << 5) - hash);
  });
  let colour = "#";
  for (let i = 0; i < 3; i++) {
    const value = (hash >> (i * 8)) & 0xff;
    colour += value.toString(16).padStart(2, "0");
  }
  return colour;
};
const formats = {
  month: (v) => moment(v).format("M.YY"),
  sum: (v) => Math.round(parseFloat(v)),
  default: (v) => Math.round(parseFloat(v)),
};

export class Dashboard extends React.Component {
  state = {
    selection: [],
    data: null,
    groups: [],
    showAll: true,
    normalize: false,
  };
  render() {
    if (!this.state.data)
      return (
        <div>
          <div class="progress">
            <div
              class="progress-bar progress-bar-striped progress-bar-animated"
              role="progressbar"
              style={{ width: "75%" }}
              aria-valuenow="75"
              aria-valuemin="0"
              aria-valuemax="100"
            ></div>
          </div>
        </div>
      );
    const {
      ylabel,
      xlabel,
      xformat,
      selectionlabel,
      yformat,
      xgrouped,
      selectionKeys,
    } = this.state;
    const selection = this.state.selection;
    const setSelection = (selection) => {
      this.setState({ selection });
    };

    function selectionFilter(city) {
      if (selection.length) return selection.includes(city);
      return true;
    }
    let chartData = Object.keys(xgrouped).map((key) => ({
      x: key,
      label: selectionKeys.reduce(
        (acc, city) =>
          acc + (xgrouped[key][city] ? xgrouped[key][city][ylabel] : 0),
        0
      ),
      y: selectionKeys.reduce(
        (acc, city) =>
          acc + (xgrouped[key][city] ? xgrouped[key][city][ylabel] : 0),
        0
      ),
    }));
    if (this.state.normalize) {
      const max = _.max(chartData.map((e) => e.y));
      chartData = chartData.map((entry) => ({
        ...entry,
        label: (entry.label * 1000) / max,
        y: (entry.y * 1000) / max,
      }));
    }
    let additionalBarsData = _.take(selection, 4).map((city) => {
      let arr = Object.keys(xgrouped).map((key) => {
        return {
          x: key,
          city,
          label: xgrouped[key][city]?.[ylabel] || 0,
          y: xgrouped[key][city]?.[ylabel] || 0,
        };
      });
      if (this.state.normalize) {
        const max = _.max(arr.map((e) => e.y));
        return arr.map((entry) => ({
          ...entry,
          label: (entry.label * 1000) / max,
          y: (entry.y * 1000) / max,
        }));
      }
      return arr;
    });

    return (
      <section className="w-100">
        <h1>{this.props.label}</h1>
        <div className="row mt-4">
          <div className="col-xs-12 col-md-6 col-lg-3">
            <div className="card">
              <div className="card-header">Settings</div>
              <div className="card-body">
                <div className="form-group">
                  <label for="selection" className="form-label">
                    Choose {selectionlabel} (Hold ⌘ to select multiple){" "}
                  </label>
                  <select
                    value={selection}
                    className="form-control"
                    onChange={(e) => {
                      const selected = Array.from(e.target.selectedOptions).map(
                        (o) => o.value
                      );
                      setSelection(selected);
                    }}
                    name="selection"
                    style={{ height: 300 }}
                    id="selection"
                    multiple
                  >
                    {selectionKeys.map((key) => (
                      <option value={key}>{key} </option>
                    ))}
                  </select>
                  <div className="d-flex pt-2">
                    <button
                      disabled={!selection.length}
                      onClick={() => {
                        const name = window.prompt(
                          "Enter group name (leave blank for default)"
                        );
                        const expandedSelection = selection.flatMap((sel) => {
                          const g = this.state.groups.find(
                            (g) => g.name === sel
                          );
                          if (g) return g.group;
                          else return [sel];
                        });
                        const group = {
                          name: (name || selection[0]) + " (Group)",
                          group: expandedSelection,
                        };
                        this.setState(
                          {
                            groups: [...this.state.groups, group],
                          },
                          () => {
                            console.log(this.state);
                            const recalculated = this.recalculateData(
                              this.state.data,
                              this.state.selectionlabel,
                              this.state.xlabel,
                              this.state.ylabel,
                              this.state.groups
                            );
                            this.setState({
                              ...recalculated,
                              selection: [group.name],
                            });
                          }
                        );
                      }}
                      className="btn btn-sm btn-primary me-2"
                    >
                      Group selection
                    </button>
                    <button
                      className="btn btn-sm btn-danger"
                      onClick={() => {
                        const recalculated = this.recalculateData(
                          this.state.data,
                          this.state.selectionlabel,
                          this.state.xlabel,
                          this.state.ylabel,
                          []
                        );
                        this.setState({
                          ...recalculated,
                          groups: [],
                          selection: [],
                        });
                      }}
                    >
                      Remove groups
                    </button>
                  </div>
                </div>
              </div>
            </div>
          </div>
          <div className="col-xs-12 col-md-6 col-lg-9">
            <div className="card">
              <div className="card-header">
                <div className="d-flex">
                  <div style={{ marginRight: "0.5rem" }}>
                    <input
                      className="form-check-input"
                      style={{ marginRight: "0.25rem" }}
                      type="checkbox"
                      checked={this.state.showAll}
                      onChange={(e) => {
                        this.setState({ showAll: e.target.checked });
                      }}
                      id="flexSwitchCheckDefault"
                    />
                    <label
                      className="pl-2 form-check-label"
                      for="flexSwitchCheckDefault"
                    >
                      Show all
                    </label>
                  </div>
                  <div style={{ marginRight: "0.5rem" }}>
                    <input
                      className="form-check-input"
                      style={{ marginRight: "0.25rem" }}
                      type="checkbox"
                      checked={this.state.normalize}
                      onChange={(e) => {
                        this.setState({ normalize: e.target.checked });
                      }}
                      id="flexSwitchCheckDefault"
                    />
                    <label
                      className="form-check-label"
                      for="flexSwitchCheckDefault"
                    >
                      Normalize
                    </label>
                  </div>
                </div>
              </div>
              <div className="card-body">
                <VictoryChart theme={VictoryTheme.grayscale}>
                  <VictoryLegend
                    orientation="horizontal"
                    gutter={10}
                    style={{
                      border: { stroke: "black" },
                      labels: { fontSize: 8 },
                    }}
                    data={selection.map((key) => ({
                      name: key,
                      symbol: { fill: stringToColour(key) },
                    }))}
                  />
                  <VictoryGroup offset={BAR_WIDTH} colorScale={"qualitative"}>
                    {this.state.showAll && (
                      <VictoryBar
                        barWidth={BAR_WIDTH}
                        labelComponent={<VictoryTooltip />}
                        style={{
                          data: {
                            fill: "black",
                          },
                        }}
                        data={chartData}
                      />
                    )}
                    {!!additionalBarsData &&
                      additionalBarsData.map((data) => (
                        <VictoryBar
                          barWidth={BAR_WIDTH}
                          labelComponent={<VictoryTooltip />}
                          style={{
                            data: {
                              fill: stringToColour(data[0].city),
                            },
                          }}
                          data={data}
                        />
                      ))}
                  </VictoryGroup>
                  <VictoryAxis
                    style={{
                      tickLabels: { fontSize: 6, padding: 8 },
                    }}
                    tickFormat={
                      xformat === "month" ? formats["month"] : formats.default
                    }
                  ></VictoryAxis>
                  <VictoryAxis
                    style={{
                      tickLabels: { fontSize: 8, padding: 0 },
                    }}
                    dependentAxis
                  ></VictoryAxis>
                </VictoryChart>
              </div>
            </div>
          </div>
        </div>
        <div style={{ overflow: "hidden" }} className="card mt-4">
          <div className="table-responsive">
            <table className="table table-bordered">
              <thead>
                <tr>
                  <th>{xlabel}</th>
                  <th>All</th>
                  {selectionKeys.filter(selectionFilter).map((key) => (
                    <th className="text-truncate">{key}</th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {Object.keys(xgrouped).map((key) => (
                  <tr>
                    <td>
                      {xformat ? formats[xformat](key) : formats.default(key)}
                    </td>
                    <td>
                      {
                        <td>
                          {selectionKeys
                            .filter(selectionFilter)
                            .reduce(
                              (acc, city) =>
                                acc +
                                (xgrouped[key][city]
                                  ? xgrouped[key][city][ylabel]
                                  : 0),
                              0
                            )}
                        </td>
                      }
                    </td>
                    {selectionKeys.map((skey) => {
                      const formatter = yformat
                        ? formats[yformat]
                        : formats.default;
                      return (
                        <td>
                          {formatter(
                            xgrouped[key][skey]
                              ? xgrouped[key][skey][ylabel]
                              : 0
                          )}
                        </td>
                      );
                    })}
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      </section>
    );
  }
  recalculateData(data, selectionlabel, xlabel, ylabel, groups) {
    console.log(groups);
    const cleaned = _.chain(JSON.parse(JSON.stringify(data)))
      // sum up cities
      .map((dp) => {
        Object.keys(dp).forEach((key) => {
          if (typeof dp[key] === "string") dp[key] = _.trim(dp[key]);
        });
        return dp;
      })
      .map((row) => {
        const g = groups.find((group) => {
          return group.group.includes(row[selectionlabel]);
        });
        if (g) {
          row[selectionlabel] = g.name;
        }
        return row;
      }, [])
      .reduce((acc, val) => {
        const entry = acc.find(
          (v) =>
            v[selectionlabel] === val[selectionlabel] &&
            v[xlabel] === val[xlabel]
        );
        if (entry) {
          entry[ylabel] += val[ylabel];
          return acc;
        }
        return [...acc, val];
      }, [])
      // groups reducer
      .value();

    const xgrouped = _.chain(cleaned)
      .groupBy((row) => {
        return row[xlabel];
      })
      .mapValues((arr) => _.keyBy(arr, (row) => row[selectionlabel]))
      .value();

    const selectionbased = _.chain(cleaned)
      .groupBy((row) => {
        return row[selectionlabel];
      })
      .value();
    const selectionKeys = _.sortBy(
      Object.keys(selectionbased),
      (city) => -selectionbased[city][0][ylabel]
    );
    return {
      cleaned,
      xgrouped,
      selectionKeys,
      selectionbased,
    };
  }
  async componentDidMount() {
    const response = await fetch(this.props.dataUrl);
    const { data, ylabel, xlabel, xformat, selectionlabel, yformat } = getData(
      await response.json()
    );
    this.setState({
      data,
      ylabel,
      xlabel,
      xformat,
      selectionlabel,
      yformat,
      ...this.recalculateData(
        data,
        selectionlabel,
        xlabel,
        ylabel,
        this.state.groups
      ),
    });
  }
}
