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
  '../../Logger',
  './models/SelectionTree',
  './views/Views',
  './controllers/RootCtrl',
  './controllers/Manager',
  './strategies/AbstractSelect',
  './strategies/LimitedSelect',
  './strategies/MultiSelect',
  './strategies/SingleSelect',
  './data-handlers/InputDataHandler',
  './data-handlers/OutputDataHandler',
  './extensions/sorters',
  './extensions/renderers',
  './base/templates',
  './base/defaults'
], function (
  Logger,
  SelectionTree,
  Views,
  RootCtrl, Manager,
  AbstractSelect, LimitedSelect, MultiSelect, SingleSelect,
  Input, Output,
  sorters, renderers,
  templates,
  defaults
) {

  /*
   * Schmiede, mein Hammer, ein hartes Schwert!
   */

  /**
   * @class  cdf.components.filter.BaseFilter
   * @amd cdf/components/filter/BaseFilter
   * @classdesc MVC-based tree-like filter that supports
   * <ul>
   *   <li>multiple nested groups</li>
   *   <li>server-side pagination and searching</li>
   * </ul>
   * @ignore
   */
  return /** @lends cdf.components.filter.BaseFilter */ {

    Logger: Logger,
    /**
     * MVC Models used internally to represent and manipulate information
     */
    Models: {
      SelectionTree: SelectionTree
    },

    /**
     * MVC views that listen to changes in a model and trigger events that will eventually be handled by a Controller
     */
    Views: Views,

    /**
     * Set of Controllers responsible for handling the interaction between views and models
     */
    Controllers: {
      RootCtrl: RootCtrl,
      Manager: Manager
    },

    /**
     * Controller-like set of classes design to encapsulate the selection strategy
     * and isolate that "business" logic from lower-level view interaction logic.
     *
     * These classes are singletons passed as part of the configuration objects.
     */
    SelectionStrategies: {
      AbstractSelect: AbstractSelect,
      LimitedSelect: LimitedSelect,
      MultiSelect: MultiSelect,
      SingleSelect: SingleSelect
    },

    /**
     * The MVC component consumes data in a specific format.
     * As such, it requires classes that:
     * <ul>
     *   <li> Import data to the filter</li>
     *   <li> Export the selection model</li>
     * </ul>
     */
    DataHandlers: {
      Input: Input,
      Output: Output
    },

    /**
     * Extension points: Sorters and Renderers
     */
    Extensions: {
      Sorters: sorters,
      Renderers: renderers
    },
    defaults: defaults,
    templates: templates,
    /**
     * Enumerations
     */
    Enum: {
      select: SelectionTree.SelectionStates,
      selectionStrategy: {
        'LimitedSelect': {
          Root: {
            options: {
              className: 'multi-select',
              showCommitButtons: true,
              showSelectedItems: false,
              showNumberOfSelectedItems: true,
              showGroupSelection: true,
              label: 'All'
            }
          },
          Item: {
            options: {
              showButtonOnlyThis: true
            }
          },
          selectionStrategy: {
            type: 'LimitedSelect',
            limit: 500
          },
          output: {
            trigger: 'apply'
          }
        },
        'MultiSelect': {
          Root: {
            options: {
              className: 'multi-select',
              showCommitButtons: true,
              showSelectedItems: false,
              showNumberOfSelectedItems: true,
              showGroupSelection: true,
              label: 'All'
            }
          },
          Item: {
            options: {
              showButtonOnlyThis: true
            }
          },
          selectionStrategy: {
            type: 'MultiSelect'
          },
          output: {
            trigger: 'apply'
          }
        },
        'SingleSelect': {
          Root: {
            options: {
              className: 'single-select',
              showCommitButtons: false,
              showSelectedItems: true,
              showNumberOfSelectedItems: false,
              showGroupSelection: false
            }
          },
          Item: {
            options: {
              showButtonOnlyThis: false
            }
          },
          selectionStrategy: {
            type: 'SingleSelect'
          },
          output: {
            trigger: 'apply'
          }
        }
      }
    }
  };
});
