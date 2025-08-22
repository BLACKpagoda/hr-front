import React from 'react';
import { BrowserRouter as Router, Route, Switch, Redirect } from 'react-router-dom';
import Login from '../src/model/login';
import ExportEX from '../src/model/export/export'
import SyncData from '../src/model/sync/sync'
// import Dashboard from './Dashboard';

const App = () => {
  const isAuthenticated = () => {
    return localStorage.getItem('token') ? true : false;
  };

  const PrivateRoute = ({ component: Component, ...rest }) => (
    <Route
      {...rest}
      render={(props) =>
        isAuthenticated() ? (
          <Component {...props} />
        ) : (
          <Redirect to={{ pathname: '/login' }} />
        )
      }
    />
  );

  return (
    <Router>
      <Switch>
        <Route path="/login" component={Login} />
        <Route path="/export" component={ExportEX} />
         <Route path="/sync" component={SyncData} />
        {/* <PrivateRoute path="/dashboard" component={Dashboard} /> */}
        <Redirect from="/" to="/login" />
      </Switch>
    </Router>
  );
};

export default App;