/*! ******************************************************************************
 *
 * Pentaho
 *
 * Copyright (C) 2024 by Hitachi Vantara, LLC : http://www.pentaho.com
 *
 * Use of this software is governed by the Business Source License included
 * in the LICENSE.TXT file.
 *
 * Change Date: 2028-08-13
 ******************************************************************************/


define(function () {

  return {
    getModelAndDefaultViewClassesAsync: function(vizTypeId) {

      function ModelMock(vizSpec) {
        this.width = vizSpec && vizSpec.width;
        this.height = vizSpec && vizSpec.height;

        this.update = function () {
          return Promise.resolve();
        };

        this.configure = function(spec) {
        };
      }

      ModelMock.type = {
        id: vizTypeId
      };

      function ViewMock(viewSpec) {
        this.__model = viewSpec && viewSpec.model;
        this.__domContainer = viewSpec && viewSpec.domContainer;

        this.dispose = function () {
        };
      }

      return Promise.resolve({
        Model: ModelMock,
        View: ViewMock,
        viewTypeId: vizTypeId + "View"
      });
    },

    getCssClasses: function() {
      return "style-a style-b";
    }
  }
});
