import { Dashboard } from "./tabs/Dashboard";
import React from "react";

const SEL_LOCALSTORAGE_KEY = "selections";
const initialSelections = JSON.parse(
  localStorage.getItem(SEL_LOCALSTORAGE_KEY) || "[]"
);
class App extends React.Component {
  state = {
    selections: initialSelections,
    selection: initialSelections.length ? initialSelections[0].label : null,
    processing: false,
    formInput: "",
  };
  render() {
    const { selections, selection } = this.state;
    return (
      <div>
        <nav class="navbar navbar-expand-lg navbar-light px-3 bg-light">
          <a class="navbar-brand" href="#">
            Olbarsanalyzer
          </a>
          <button
            class="navbar-toggler"
            type="button"
            data-toggle="collapse"
            data-target="#navbarNavDropdown"
            aria-controls="navbarNavDropdown"
            aria-expanded="false"
            aria-label="Toggle navigation"
          >
            <span class="navbar-toggler-icon"></span>
          </button>
          <div class="collapse navbar-collapse" id="navbarNavDropdown">
            <ul class="navbar-nav">
              <li class="nav-item dropdown">
                <a
                  class="nav-link dropdown-toggle"
                  href="#"
                  id="navbarDropdownMenuLink"
                  data-toggle="dropdown"
                  aria-haspopup="true"
                  aria-expanded="false"
                >
                  Select view
                </a>
                <div
                  class="dropdown-menu"
                  aria-labelledby="navbarDropdownMenuLink"
                >
                  {selections.map((sel) => (
                    <a
                      class="dropdown-item"
                      type="button"
                      onClick={() => {
                        this.setState({
                          selection: sel.label,
                        });
                      }}
                    >
                      {sel.label}
                    </a>
                  ))}
                  <a
                    class="dropdown-item"
                    type="button"
                    onClick={() => {
                      this.setState({
                        selection: null,
                      });
                    }}
                  >
                    Add new datapoint
                  </a>
                </div>
              </li>
            </ul>
          </div>
        </nav>
        <div className="container p-5">
          {selection ? (
            <div>
              <Dashboard
                {...selections.find((sel) => sel.label === selection)}
                key={selections.find((sel) => sel.label === selection).dataUrl}
              ></Dashboard>
            </div>
          ) : (
            <div className="card">
              <div className="card-body">
                <h2>Add new datapoint</h2>
                <form
                  onSubmit={async (e) => {
                    e.preventDefault();
                    console.log(this.state.formInput);
                    this.setState({
                      processing: true,
                    });
                    const response = await fetch(this.state.formInput);
                    const viewName = (await response.json()).title;
                    console.log(viewName);
                    this.setState({
                      selection: viewName,
                      processing: false,
                      formInput: "",
                      selections: [
                        ...this.state.selections,
                        {
                          label: viewName,
                          dataUrl: this.state.formInput,
                        },
                      ],
                    });
                  }}
                >
                  <div className="form-group mt-3">
                    <label for="1">Heroku JSON url</label>
                    <input
                      className="form-control"
                      id="1"
                      required
                      value={this.state.formInput}
                      onChange={(e) => {
                        this.setState({
                          formInput: e.target.value,
                        });
                      }}
                    ></input>
                  </div>
                  <button
                    disabled={this.state.processing}
                    className="btn btn-primary mt-3"
                  >
                    Submit
                  </button>
                </form>
              </div>
            </div>
          )}
        </div>
      </div>
    );
  }
  componentDidUpdate() {
    localStorage.setItem(
      SEL_LOCALSTORAGE_KEY,
      JSON.stringify(this.state.selections)
    );
  }
}

export default App;
