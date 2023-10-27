import _ from "lodash";

export function getData(data) {
  return {
    xlabel: data.fields[0],
    xformat: data.fields[0],
    ylabel: data.fields[1],
    yformat: data.fields[1],
    selectionlabel: data.fields[2],
    data: data.values.map((arr) => {
      return data.fields.reduce((acc, fieldName, idx) => {
        return {
          ...acc,
          [fieldName]: arr[idx],
        };
      }, {});
    }),
  };
}
