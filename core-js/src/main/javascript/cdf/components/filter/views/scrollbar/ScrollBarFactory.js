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

/**
 * @summary factory to be used to create the proper scrollbar implementation
 * @submodule factory to be used to create the proper scrollbar implementation
 */
define([
  './OptiScrollBarEngine',
  './MCustomScrollBarEngine'
], function(OptiScrollBarEngine, MCustomScrollBarEngine) {
  return {
    createScrollBar: function(engine, view) {
      switch (engine) {
        case 'optiscroll':
          return new OptiScrollBarEngine(view);
        case 'mCustomScrollbar':
          return new MCustomScrollBarEngine(view);
      };
    }
  }
});