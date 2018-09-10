import React from 'react'
import { BrowserRouter, Route, Switch } from 'react-router-dom'

import App from './App'
import ComingSoon from './ComingSoon'

const Router = () => (
  <BrowserRouter>
    <Switch>
      <Route exact path="/" component={ComingSoon} />
      <Route path="/tools" component={App} />
    </Switch>
  </BrowserRouter>
)

export default Router
