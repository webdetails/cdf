/**
 * Define your custom tags inside this block. {@link http://usejsdoc.org/about-plugins.html#tag-definitions}
 *
 * Tag options:
 *
 * @property {boolean}  canHaveType              Default Value (false)
 * @property {boolean}  canHaveName              Default Value (false)
 * @property {boolean}  isNamespace              Default Value (false)
 * @property {boolean}  mustHaveValue            Default Value (false)
 * @property {boolean}  mustNotHaveDescription   Default Value (false)
 * @property {boolean}  mustNotHaveValue         Default Value (false)
 *
 * @property {function} onTagged
 *
 */
exports.defineTags = function ( dictionary ) {

  // region New Tags
  /** Tag to add AMD module information to a class */
  createTagDefinition('amd', {
    canHaveType: true,
    canHaveName: true,

    onTagged: function( doclet, tag ) {
      const value = tag.value;

      doclet.amd = {
        text: tag.text,
        type: firstTypeOf( value ),
        module: value.name
      };
    }
  });

  /** Other tag for code examples in order to have different header */
  const exampleTag = dictionary.lookUp('example');
  createTagDefinition('code', {
    keepsWhitespace: exampleTag.keepsWhitespace,
    removesIndent:   exampleTag.removesIndent,
    mustHaveValue:   exampleTag.mustHaveValue,

    onTagged: function( doclet, tag ) {
      doclet.codeExamples = doclet.codeExamples || [];
      doclet.codeExamples.push( tag.value );
    }
  });

  /**
   * New tag to manually mark classes as static
   */
  createTagDefinition('staticClass', {
    onTagged: function ( doclet/*, tag*/ ) { doclet.static = true; }
  });
  // endregion

  /** (Re)defining extends tag */
  extendTagDefinition('extends', {
    onTagged: function( doclet, tag ) {
      let value = tag.value;
      if ( value.indexOf( "@link" ) < 0 ) {
        value = firstWordOf( value );
      }

      doclet.augment( value );
    }
  });

  // ------ Private -----

  /**
   * Wrapper function of `dictionary.defineTag`
   * to make it clear that we are creating a new tag.
   *
   * @param {string} name    - Tag name.
   * @param {object} options - Tag options.
   */
  function createTagDefinition( name, options ) {
    return dictionary.defineTag( name, options );
  }

  /**
   * Change an existing tag definition, to change the behaviour its default behaviour.
   *
   * @param {string}  name    - Tag name.
   * @param {object}  options - Tag options.
   */
  function extendTagDefinition( name, options ) {
    const tagDefinition = dictionary.lookUp( name );
    const isNewTag = tagDefinition === false;

    if ( isNewTag ) {
      return createTagDefinition( name, options );
    }

    Object.keys( tagDefinition ).map(function( key ) {
      const tagOption = tagDefinition[key];
      if ( tagDefinition.hasOwnProperty( key ) && options[key] === undefined )
        options[key] = tagOption;
    });

    return createTagDefinition( name, options );
  }

};

/**
 * Gets the first word in the {@code string}
 *
 * @param {string} string
 *
 * @return {string} the first word of {@code string} if any exist; otherwise return an empty string
 */
function firstWordOf( string ) {
  const match = /^(\S+)/.exec( string );
  if ( match ) {
    const group0 = 1;
    return match[group0];
  } else {
    return '';
  }
}

/**
 * Gets the first type a {@code tag}
 *
 * @param {object} tag
 *
 * @return {?string} the first type of a {@code tag} if any exist.
 */
function firstTypeOf( tag ) {
  const FIRST_TYPE = 0;
  const types = tag.type ? tag.type.names : [];

  return types[ FIRST_TYPE ];
}
