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

define(['../../../lib/jquery'], function( $ ) {

  /*
   * Default settings
   */
  var privateDefaults = /** @lends cdf.components.filter.base.defaults */ {
    /**
     * Configuration of the log level.
     *
     * @type {string}
     * @default "log"
     */
    loglevel: "log",
    pagination: {
      throttleTimeMilliseconds: 500
    },
    Root: {
      renderers: void 0,
      sorter: void 0,
      view: {
        styles: [],
        throttleTimeMilliseconds: 10,
        templates: {},
        slots: {
          selection: '.filter-root-control',
          header: '.filter-root-header',
          footer: '.filter-root-footer',
          children: '.filter-root-items',
          overlay: '.filter-overlay'
        },
        childConfig: {
          withChildrenPrototype: 'Group',
          withoutChildrenPrototype: 'Item',
          className: 'filter-root-child',
          appendTo: '.filter-root-items'
        },
        overlaySimulateClick: true
      }
    },
    Group: {
      renderers: void 0,
      sorter: void 0,
      view: {
        throttleTimeMilliseconds: 10,
        templates: {},
        slots: {
          selection: '.filter-group-header:eq(0)',
          children: '.filter-group-items'
        },
        childConfig: {
          withChildrenPrototype: 'Group',
          withoutChildrenPrototype: 'Item',
          className: 'filter-group-child'
        }
      }
    },
    Item: {
      renderers: void 0,
      sorter: void 0,
      view: {
        styles: [],
        throttleTimeMilliseconds: 10,
        templates: {},
        slots: {
          selection: '.filter-item-container'
        }
      }
    }
  };

  /**
   * @class cdf.components.filter.base.defaults
   * @amd cdf/components/filter/base/defaults
   * @classdesc Filter component default values.
   * @ignore
   */
  return $.extend(true, {}, privateDefaults, /** @lends cdf.components.filter.base.defaults */ {

    /**
     * Configuration of the pagination.
     *
     * @type {object}
     */
    pagination: {
      pageSize: Infinity
    },
    /**
     * Configuration of the search.
     *
     * @type {object}
     */
    search: {
      serverSide: false,
      matcher: undefined // function(entry, fragment)
    },
    /**
     * Configuration of the selection strategy.
     *
     * @type {object}
     */
    selectionStrategy: {
      type: 'LimitedSelect',
      limit: 500
    },

    /**
     * Configuration of the Root.
     *
     * @type {object}
     */
    Root: {
      options: {
        className: 'multi-select',
        styles: void 0,
        showCommitButtons: true,
        showFilter: false,
        showGroupSelection: true,
        showButtonOnlyThis: false,
        showSelectedItems: false,
        showNumberOfSelectedItems: true,
        showValue: false,
        showIcons: true,
        scrollThreshold: 12,
        isResizable: true,
        useOverlay: true,
        expandMode: 'absolute'
      },
      strings: {
        isDisabled: 'Unavailable',
        allItems: 'All',
        noItems: 'None',
        groupSelection: 'All',
        btnApply: 'Apply',
        btnCancel: 'Cancel'
      },
      view: {
        scrollbar: {
          engine: 'mCustomScrollbar',
          options: {
            theme: 'dark',
            alwaysTriggerOffsets: false,
            onTotalScrollOffset: 100
          }
        }
      }
    },

    /**
     * Configuration of the Group.
     *
     * @type {object}
     */
    Group: {
      options: {
        showFilter: false,
        showCommitButtons: false,
        showGroupSelection: false,
        showButtonOnlyThis: false,
        showButtonCollapse: false,
        showValue: false,
        showIcons: true,
        scrollThreshold: Infinity,
        isResizable: false
      },
      strings: {
        allItems: 'All',
        noItems: 'None',
        groupSelection: 'All',
        btnApply: 'Apply',
        btnCancel: 'Cancel'
      }
    },

    /**
     * Configuration of the Item.
     *
     * @type {object}
     */
    Item: {
      options: {
        showButtonOnlyThis: false,
        showValue: false,
        showIcons: true
      },
      strings: {
        btnOnlyThis: 'Only'
      }
    }
  });

});
