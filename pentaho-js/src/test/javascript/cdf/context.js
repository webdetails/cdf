/*! ******************************************************************************
 *
 * Pentaho
 *
 * Copyright (C) 2024 by Hitachi Vantara, LLC : http://www.pentaho.com
 *
 * Use of this software is governed by the Business Source License included
 * in the LICENSE.TXT file.
 *
 * Change Date: 2029-07-20
 ******************************************************************************/


var KARMA_RUN = true;

var requireCfg = {
  waitSeconds: 30,
  paths: {},
  shim: {},
  map: {
    "*": {}
  },
  bundles: {},
  config: {
    "pentaho/modules": {}
  },
  packages: []
};

var contextObj = {
  "locale": "en_US",
  "params": {},
  "path": "/test/fake_from_module_configuration.xcdf",
  "queryData": {},
  "roles": ["Administrator", "Authenticated"],
  "serverLocalDate": 1412605395782,
  "serverUTCDate": 1412601795782,
  "sessionAttributes": {},
  "sessionTimeout": 7200,
  "user": "admin"
};

var storageObj = {
  test: 1
};

var viewObj = {
  param: 1
};

requireCfg.config['cdf/dashboard/Dashboard'] = {
  context: contextObj,
  storage: storageObj,
  view: viewObj
};
