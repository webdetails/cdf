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

define([
    'amd!../lib/underscore',
    './UnmanagedComponent',
    '../Logger',
    '../lib/jquery',
    'pentaho/data/Table',
    'pentaho/type/Context',
    'pentaho/GlobalContextVars',
    'pentaho/visual/base/View',
    'pentaho/visual/role/mapping'
], function(_, UnmanagedComponent, Logger, $, Table, Context, GlobalContextVars, BaseView, mapping) {

    var _context = null;
    var _mappingType = null;

    return UnmanagedComponent.extend({

        update: function() {
            this.beginQuery(this.queryDefinition, this.render);
        },

        render: function(data) {
            var domElem = this.placeholder()[0];

            if (!_context) {
                var contextVars = new GlobalContextVars({application: "pentaho-cdf"});
                _context = new Context(contextVars);
                _mappingType = _context.get("pentaho/visual/role/mapping").type;
            }
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
                                .then(_.bind(me.endExec, me), _.bind(me.failExec, me))
                                .catch (function (reason) {
                                    Logger.error("Unable to update view for visualization component: " + reason);
                                    me.failExec();
                                })
                        })
                        .catch(function (reason) {
                            Logger.error("Unable to get view for Visualization Component: " + reason);
                            me.failExec();
                        });
                })
                .catch (function (reason) {
                    Logger.error("Unable to get requested visualization: " + reason);
                    me.failExec();
                });
        }

    });

});
