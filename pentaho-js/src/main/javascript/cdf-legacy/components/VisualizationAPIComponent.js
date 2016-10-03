/*!
 * Copyright 2002 - 2016 Webdetails, a Pentaho company. All rights reserved.
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

var VisualizationAPIComponent = (function() {
    var _context;
    var _mapping;
    var BaseView;

    return UnmanagedComponent.extend({

        // Unit tests support.
        __require: (typeof require !== "undefined" ? require : null),
        __reset: function() {
            _context = null;
            _mapping = null;
            GlobalContextVars = null;
            BaseView = null;
        },

        update: function() {
            if(!_context)
                this._requireFilesAndUpdate();
            else
                this._updateCore();
        },

        _requireFilesAndUpdate: function() {
            // Not caring about preExec()...
            var me = this;
            me.__require(["pentaho/data/Table", "pentaho/type/Context", "pentaho/GlobalContextVars", "pentaho/visual/base/View", "pentaho/visual/role/mapping"], function(_Table_,Context, GlobalContextVars, _BaseView_, _mapping) {
                Table = _Table_;
                var contextVars = new GlobalContextVars({application: "pentaho-cdf"});
                _context = new Context(contextVars);
                _mappingType = _context.get("pentaho/visual/role/mapping").type;
                BaseView = _BaseView_;
                me._updateCore();
            });
        },

        _updateCore: function() {
            var render = _.bind(this.render, this);
            this.triggerQuery(this.queryDefinition, render);
        },

        render: function(data) {
            var domElem = this.placeholder()[0];

            var me = this;
            _context.getAsync(this.vizId)
                .then( function (Model) {
                    var createdModel = new Model({});
                    createdModel.data = new Table(data);
                    createdModel.height= me.height;
                    createdModel.width = me.width;

                    $.each(me.vizOptions, function(i, v) {
                        var propName = v[0];
                        var propType = createdModel.type.get(propName);
                        var value = me.dashboard.getParameterValue(v[1]);

                        if(!propType.type.isSubtypeOf(_mappingType)) {
                            createdModel.set(propName, value);
                        } else {
                            createdModel.get(propName).attributes.set(value);
                        }

                    });

                    BaseView.createAsync(domElem, createdModel)
                        .then(function (view) {
                            view.update()
                                .then(function () {
                                })
                                .catch (function (reason) {
                                    Dashboards.error("Unable to update view for visualization component: " + reason);
                                    Dashboards.errorNotification({msg: "Error processing component: render_" + me.name}, domElem);
                                })
                        })
                        .catch(function (reason) {
                            Dashboards.error("Unable to get view for Visualization Component: " + reason);
                            Dashboards.errorNotification({msg: "Error processing component: render_" + me.name}, domElem);
                        });
                })
                .catch (function (reason) {
                    Dashboards.error("Unable to get requested visualization: " + reason);
                    Dashboards.errorNotification({msg: "Error processing component: render_" + me.name}, domElem);
                });
        }
    });
}());
