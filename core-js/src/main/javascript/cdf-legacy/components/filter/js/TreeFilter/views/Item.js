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
'use strict';

/**
 * @module TreeFilter
 * @submodule Views
 */
(function(Views, Templates) {
  'use strict';

  /**
   * View for items
   * @class Item
   * @constructor
   * @extends AbstractView
   */
  return Views.Item = Views.AbstractView.extend({
    type: 'Item',
    ID: 'TreeFilter.Views.Root',
    template: {
      selection: Templates['Item-template'],
      skeleton: Templates['Item-template']
    },
    events: {
      'mouseover .filter-item-body': 'onMouseOver',
      'mouseout  .filter-item-body': 'onMouseOut',
      'click     .filter-item-body': 'onSelection',
      'click     .filter-item-only-this': 'onClickOnlyThis'
    },
    bindToModel: function(model) {
      this.base(model);
      this.onChange(model, 'isSelected', this.updateSelection);
      return this.onChange(model, 'isVisible', this.updateVisibility);
    },
    onClickOnlyThis: function(event) {
      event.stopPropagation();
      return this.trigger('control:only-this', this.model);
    }
  });
})(TreeFilter.Views, TreeFilter.templates);
