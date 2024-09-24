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

define([
  'cdf/lib/jquery',
  'amd!cdf/lib/underscore',
  'cdf/components/filter/BaseFilter'
], function($ , _ , Filter) {

  describe('Filter.SelectionStrategies.SingleSelect', function() {

    var model, strategy;
    model = void 0;
    strategy = void 0;
    describe('at a depth of 1 level', function() {
      beforeEach(function() {
        strategy = new Filter.SelectionStrategies.SingleSelect(Filter.Enum.selectionStrategy.SingleSelect);
        return model = new Filter.Models.SelectionTree({
          label: 'Parent',
          id: '#parent',
          isSelected: false,
          nodes: _.map(_.range(10), function(n) {
            var result;
            result = {
              label: 'Child #{n}',
              id: "#child" + n,
              isSelected: false
            };
            return result;
          })
        });
      });
      it('successfully marks a single item as selected', function() {
        strategy.setSelection(Filter.Enum.select.ALL, model.children().first());
        strategy.setSelection(Filter.Enum.select.ALL, model.children().last());
        
        expect( model.where({ isSelected: true }).length ).toBe(1);
        expect( model.where({ isSelected: true })[0] ).toBe( model.children().last() );
      });
      it('cannot unselect an item', function() {
        strategy.setSelection(Filter.Enum.select.ALL, model.children().last());
        strategy.setSelection(Filter.Enum.select.NONE, model.children().last());
        
        expect( model.where({ isSelected: true }).length ).toBe(1);
        expect( model.where({ isSelected: true })[0] ).toBe( model.children().last() );
      });
      it('does not allow the root to be selected', function() {
        var selectedItems;
        strategy.setSelection(Filter.Enum.select.ALL, model);
        selectedItems = model.where({
          isSelected: true
        }).length;
        
        expect(selectedItems).toBe(0);
      });
    });
    describe('at a depth of 2 levels', function() {
      beforeEach(function() {
        strategy = new Filter.SelectionStrategies.SingleSelect(Filter.Enum.selectionStrategy.SingleSelect);
        return model = new Filter.Models.SelectionTree({
          label: 'Root',
          id: '#root',
          isSelected: false,
          nodes: _.map(_.range(3), function(n) {
            var result1;
            return result1 = {
              label: "Group " + n,
              id: "#group " + n,
              nodes: _.map(_.range(5), function(k) {
                var result2;
                return result2 = {
                  label: "#Item " + n + "." + k,
                  id: "#item " + n + k + "."
                };
              })
            };
          })
        });
      });
      it('successfully marks a single item as selected', function() {
        strategy.setSelection(Filter.Enum.select.ALL, model.children().first().children().first());
        strategy.setSelection(Filter.Enum.select.ALL, model.children().last().children().last());
        
        expect( model.where({ isSelected: true }).length ).toBe(1);
        expect( model.where({ isSelected: true })[0] ).toBe( model.children().last().children().last() );
      });
      it('cannot unselect an item', function() {
        strategy.setSelection(Filter.Enum.select.ALL, model.children().last().children().last());
        strategy.setSelection(Filter.Enum.select.NONE, model.children().last().children().last());
        expect( model.where({ isSelected: true }).length ).toBe(1);
        expect( model.where({ isSelected: true })[0] ).toBe( model.children().last().children().last() );
      });
      it('does not allow a group to be selected', function() {
        var selectedItems;
        strategy.setSelection(Filter.Enum.select.ALL, model.children().first());
        selectedItems = model.where({
          isSelected: true
        }).length;
        
        expect( selectedItems ).toBe(0);
      });
    });
  });
});
