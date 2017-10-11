/*!
 * Copyright 2002 - 2017 Webdetails, a Hitachi Vantara company. All rights reserved.
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
  '../../../lib/jquery',
  'amd!../../../lib/underscore',
  '../../../lib/mustache',
  '../../../Dashboard.Clean',
  '../../../AddIn',
  '../extensions/renderers',
  '../extensions/sorters'
], function( $, _, Mustache, Dashboard, AddIn, renderers, sorters ) {

  (function(Dashboard, AddIn, Renderers) {
    'use strict';
    var myAddIn = new AddIn({
      name: 'notificationSelectionLimit',
      label: 'Notification that the selection limit has been reached',
      help: 'Acts on the footer of the Root view',
      defaults: {
        hook: 'footer'
      },
      implementation: function($tgt, st, options) {
        return Renderers.notificationSelectionLimit.call(this, $tgt, st.model, st.configuration);
      }
    });
    Dashboard.registerGlobalAddIn('FilterComponent', 'renderRootSelection', myAddIn);
  })(Dashboard, AddIn, renderers);

  (function(Dashboard, AddIn, Renderers) {
    'use strict';
    var myAddIn = new AddIn({
      name: 'sumSelected',
      label: 'Sum the values of the selected items',
      implementation: function($tgt, st, options) {
        return Renderers.sumSelected.call(this, $tgt, st.model, st.configuration);
      }
    });
    Dashboard.registerGlobalAddIn('FilterComponent', 'renderRootSelection', myAddIn);
    Dashboard.registerGlobalAddIn('FilterComponent', 'renderGroupSelection', myAddIn);
  })(Dashboard, AddIn, renderers);

  (function(Dashboard, AddIn) {
    'use strict';
    var myAddIn = new AddIn({
      name: 'randomColor',
      label: 'Programmatically sets a random color',
      defaults: {
        filter: '.filter-item-body'
      },
      implementation: function($tgt, model, options) {
        return $tgt.find(options.filter).css({
          color: "rgb(" + (_.random(255)) + "," + (_.random(255)) + "," + (_.random(255)) + ")"
        });
      }
    });
    Dashboard.registerGlobalAddIn('FilterComponent', 'renderItemSelection', myAddIn);
  })(Dashboard, AddIn);

  (function(Dashboard, AddIn, Sorters) {
    'use strict';

    /*
     * Sorts items, by keeping the selected items on top
     */
    var myAddIn = new AddIn({
      name: 'selectedOnTop',
      label: 'Keep selected items on top ',
      implementation: function($tgt, st, options) {
        var result;
        result = st.model.getSelection() ? 'A' : 'Z';
        result += st.model.index();
        return result;
      }
    });
    Dashboard.registerGlobalAddIn('FilterComponent', 'sortItem', myAddIn);
    Dashboard.registerGlobalAddIn('FilterComponent', 'sortGroup', myAddIn);
  })(Dashboard, AddIn, sorters);

  (function(Dashboard, AddIn, Sorters) {
    'use strict';

    /*
     * Sorts items, by keeping the insertion order
     */
    var myAddIn = new AddIn({
      name: 'insertionOrder',
      label: 'Keep insertion order',
      implementation: function($tgt, st, options) {
        var result;
        result = st.model.index();
        return result;
      }
    });
    Dashboard.registerGlobalAddIn('FilterComponent', 'sortItem', myAddIn);
    Dashboard.registerGlobalAddIn('FilterComponent', 'sortGroup', myAddIn);
  })(Dashboard, AddIn, sorters);

  (function(Dashboard, AddIn) {
    'use strict';

    /*
     * Sorts items/groups by label
     */
    var myAddIn = new AddIn({
      name: 'sortByLabel',
      label: 'Sort items by label, alphabetically',
      defaults: {
        ascending: true
      },
      implementation: function($tgt, st, options) {
        return st.model.get('label');
      }
    });
    Dashboard.registerGlobalAddIn('FilterComponent', 'sortItem', myAddIn);
    Dashboard.registerGlobalAddIn('FilterComponent', 'sortGroup', myAddIn);
  })(Dashboard, AddIn);

  (function(Dashboard, AddIn) {
    'use strict';

    /*
     * Sorts items/groups by value
     */
    var myAddIn = new AddIn({
      name: 'sortByValue',
      label: 'Sort items by value',
      defaults: {
        ascending: false
      },
      implementation: function($tgt, st, options) {
        var result;
        result = st.model.get('value');
        if (options.ascending) {
          return result;
        } else {
          return -1 * result;
        }
      }
    });
    Dashboard.registerGlobalAddIn('FilterComponent', 'sortItem', myAddIn);
    Dashboard.registerGlobalAddIn('FilterComponent', 'sortGroup', myAddIn);
  })(Dashboard, AddIn);

  (function(Dashboard, Mustache, AddIn) {
    'use strict';

    /*
     * Sums the values of all the descendants
     */
    var myAddIn = new AddIn({
      name: 'sumValues',
      label: 'Sums the values of the selected items',
      defaults: {
        formatValue: function(total) {
          return Mustache.render('{{total}}', {
            total: total
          });
        }
      },
      implementation: function($tgt, st, options) {
        var html, filter, total;
        total = st.model.flatten().filter(function(m) {
          return m.children() == null;
        }).filter(function(m) {
          return m.getSelection() === true;
        }).reduce((function(memo, m) {
          return memo + m.get('value');
        }), 0).value();
        filter = st.model.isRoot() ? '.filter-root-selection-value' : '.filter-group-selection-value';
        if (_.isFinite(total)) {
          html = options.formatValue(total);
        } else {
          html = '';
        }
        return $tgt.find(filter + ':eq(0)').html(html);
      }
    });
    Dashboard.registerGlobalAddIn('FilterComponent', 'renderRootSelection', myAddIn);
    Dashboard.registerGlobalAddIn('FilterComponent', 'renderGroupSelection', myAddIn);
  })(Dashboard, Mustache, AddIn);

  (function(Dashboard, Mustache, AddIn) {
    'use strict';

    /*
     * Renders a Mustache template
     */
    var myAddIn = new AddIn({
      name: 'template',
      label: 'Mustache template',
      defaults: {
        template: '{{label}}',
        filter: '',
        postRender: void 0
      },
      implementation: function($tgt, st, options) {
        var $el, html;
        if (!_.isEmpty(options.template)) {
          html = Mustache.render(options.template, st.model.toJSON());
          $el = $tgt;
          if (!_.isEmpty(options.filter)) {
            $el = $tgt.find(options.filter + ':eq(0)');
          }
          $el.html(html);
          if (_.isFunction(options.postRender)) {
            return options.postRender.call(this, $tgt, st, options);
          }
        }
      }
    });
    Dashboard.registerGlobalAddIn('FilterComponent', 'renderRootHeader', myAddIn);
    Dashboard.registerGlobalAddIn('FilterComponent', 'renderRootFooter', myAddIn);
    Dashboard.registerGlobalAddIn('FilterComponent', 'renderRootSelection', myAddIn);
    Dashboard.registerGlobalAddIn('FilterComponent', 'renderGroupSelection', myAddIn);
    Dashboard.registerGlobalAddIn('FilterComponent', 'renderItemSelection', myAddIn);
  })(Dashboard, Mustache, AddIn);

  (function(Dashboard, AddIn) {
    'use strict';

    /*
     * Emulate accordion behaviour on a group of filters
     *
     * When the user expands a filter, a global event on the "Dashboard" object is issued.
     * The filters configured to use this addIn will listen to the event and
     * close themselves accordingly
     */
    var myAddIn = new AddIn({
      name: 'accordion',
      label: 'Makes all filters behave as an accordion',
      defaults: {
        group: 'filters'
      },
      implementation: function($tgt, st, options) {
        st.model.on('change:isCollapsed', function(model, newState) {
          if (newState === false) {
            return st.dashboard.trigger('filters:close', model, options);
          }
        });
        st.model.listenTo(st.dashboard, 'filters:close', function(model, opts) {
          if (opts.group === options.group) {
            if (model !== st.model) {
              if (st.model.get('isDisabled') === false) {
                return st.model.set('isCollapsed', true);
              }
            }
          }
        });
      }
    });
    Dashboard.registerGlobalAddIn('FilterComponent', 'postUpdate', myAddIn);
  })(Dashboard, AddIn);

});
