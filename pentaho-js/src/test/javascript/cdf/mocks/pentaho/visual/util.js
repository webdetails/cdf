/*!
 * Copyright 2019 Webdetails, a Hitachi Vantara company. All rights reserved.
 *
 * This software was developed by Webdetails and is provided under the terms
 * of the Mozilla Public License, Version 2.0, or any later version. You may not use
 * this file except in compliance with the license. If you need a copy of the license,
 * please go to http://mozilla.org/MPL/2.0/. The Initial Developer is Webdetails.
 *
 * Software distributed under the Mozilla Public License is distributed on an "AS IS"
 * basis, WITHOUT WARRANTY OF ANY KIND, either express or implied. Please refer to
 * the license for the specific language governing your rights and limitations.
 */

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
