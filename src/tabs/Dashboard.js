import React from "react";
import {
  VictoryBar,
  VictoryChart,
  VictoryTheme,
  VictoryAxis,
  VictoryTooltip,
} from "victory";
import _ from "lodash";
import moment from "moment";
import { getData } from "../dumps";

const formats = {
  month: (v) => moment(v).format("M.YY"),
  sum: (v) => Math.round(parseFloat(v)),
  default: (v) => Math.round(parseFloat(v)),
};

export class Dashboard extends React.Component {
  state = {
    selection: [],
    data: null,
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
    const { ylabel, xlabel, xformat, selectionlabel, yformat, data } =
      this.state;
    const cleaned = _.chain(data)
      // sum up cities
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
    const selection = this.state.selection;
    const setSelection = (selection) => {
      this.setState({ selection });
    };

    function selectionFilter(city) {
      if (selection.length) return selection.includes(city);
      return true;
    }
    return (
      <section className="w-100">
        <h1>By {selectionlabel}</h1>
        <div className="py-3">
          <label for="selection" className="form-label">
            Choose {selectionlabel}
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
            id="selection"
            multiple
          >
            {selectionKeys.map((key) => (
              <option value={key}>{key}</option>
            ))}
          </select>
        </div>
        <VictoryChart theme={VictoryTheme.grayscale}>
          <VictoryBar
            labelComponent={<VictoryTooltip />}
            data={Object.keys(xgrouped).map((key) => ({
              x: key,
              label: selectionKeys
                .filter(selectionFilter)
                .reduce(
                  (acc, city) =>
                    acc +
                    (xgrouped[key][city] ? xgrouped[key][city][ylabel] : 0),
                  0
                ),
              y: selectionKeys
                .filter(selectionFilter)
                .reduce(
                  (acc, city) =>
                    acc +
                    (xgrouped[key][city] ? xgrouped[key][city][ylabel] : 0),
                  0
                ),
            }))}
          />
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
        <div style={{ overflow: "hidden" }} className="card">
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
                    {selectionKeys.filter(selectionFilter).map((skey) => {
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
  async componentDidMount() {
    const response = await fetch(this.props.dataUrl);
    const { data, ylabel, xlabel, xformat, selectionlabel, yformat } = getData(
      await response.json()
    );
    this.setState({ data, ylabel, xlabel, xformat, selectionlabel, yformat });
  }
}
