/**
 * Define your custom tags inside this block
 */
exports.defineTags = function (dictionary) {
  /**
   * Tag options:
   * 
   * @property {boolean}  canHaveType              Default Value (false)
   * @property {boolean}  canHaveName              Default Value (false)
   * @property {boolean}  isNamespace              Default Value (false)
   * @property {boolean}  mustHaveValue            Default Value (false)
   * @property {boolean}  mustNotHaveDescription   Default Value (false)
   * @property {boolean}  mustNotHaveValue         Default Value (false)
   * @property {function} onTagged
   */
  dictionary.defineTag('amd', {

    /**
     * A callback function executed when the tag is found
     * @param  {Object} doclet Doclet where the tag was "tagged"
     * @param  {Object} tag    The tag data
     */
    onTagged: function (doclet, tag) {
      doclet.amd = tag;
    }
  });

  /**
   * (Re)defining extends tag
   */
  dictionary.defineTag('extends', {
    mustHaveValue: true,
    // Allow augments value to be specified as a normal type, e.g. {Type}
    //onTagText: parseTypeText,
    onTagged: function(doclet, tag) {
      var value = tag.value;
      if(value.indexOf("@link") < 0) {
        value = firstWordOf(value);
      }
      doclet.augment( value );
    }
  });

  /**
   * New code for examples in order to have different header
   */
  dictionary.defineTag('code', {
    keepsWhitespace: true,
    removesIndent: true,
    mustHaveValue: true,
    onTagged: function(doclet, tag) {
      doclet.codeExamples = doclet.codeExamples || [];
      doclet.codeExamples.push(tag.value);
    }
  });

  /**
   * New tag to manually mark classes as static
   */
  dictionary.defineTag('staticClass', {
    onTagged: function (doclet, tag) {
      doclet.static = true;
    }
  });
  //TODO: Check what this is doing in the default tag
  /*function parseTypeText(text) {
    var tagType = jsdoc.tag.type.parse(text, false, true);
    return tagType.typeExpression || text;
  }*/

  function firstWordOf(string) {
    var m = /^(\S+)/.exec(string);
    if (m) { 
      return m[1]; 
    } else { 
      return '';
    }
  }
};
