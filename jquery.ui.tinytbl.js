/**
 * jQuery UI TinyTbl
 * Creates a scrollable table with fixed thead, tfoot and columns
 *
 * Copyright (c) 2012-2014 Michael Keck <http://michaelkeck.de/>
 * Released:  2014-02-10
 * Version:   3.1.2
 * License:   Dual licensed under the MIT or GPL Version 2 licenses.
 *            http://jquery.org/license
 * Depends:   jquery.ui.core
 *            jquery.ui.widget
 */
(function($) {

    var scrollbarsize = null,
        tinytables = 0;


    /**
     * Some prepare-function if DOM is ready
     */
    $(document).ready(function() {

        /* Get Scollbarsize */
        if (scrollbarsize === null) {
            var elem = $('<div id="ui-tinytbl-helper-scrollbarsize"></div>');
            elem.css({
                'width': '100px', 'height': '100px', 'overflow': 'scroll',
                'position': 'absolute', 'top': '-10000px','left': '-10000px',
                '-webkit-overflow-scrolling': 'touch'
            });
            $('body').append(elem);
            scrollbarsize = elem.width() - elem[0].clientWidth;
            elem.remove();
        }

    });

    /**
     * Get properties from a element
     * @param    {jQuery} element
     * @return   {String} properties
     * @internal
     */
    var _row_props = function(element) {
        var gets = ['id','class', 'style'], sets = ['data-id', 'class', 'style'], properties = '';
        $.each(gets, function(id, key) {
            var attr;
            if (attr = element.attr(key)) {
                properties += ' '+sets[id]+'="'+attr+'"';
            }
        });
        return properties;
    };


    $.widget('ui.tinytbl', {

        version: '3.1.2',

        options: {
            'autofocus':    false,
            'classname':    null,
            'colresizable':    false,
            'colmoveable':     false,
            'colautosize':  true,
            'height':       'auto',
            'id':           null,
            'resizable':    false,
            'rtl':          false,
            'tfoot':        true,
            'thead':        true,
            'width':        'auto',
            'rowAdd':       null, // function() {},
            'rowRemove':    null, // function() {},
            'rowSelect':    null  // function() {}
        },

        classnames: {
            'tbody': 'ui-tinytbl-body',
            'thead': 'ui-tinytbl-head',
            'tfoot': 'ui-tinytbl-foot'
        },

        tinytbl: false,


        _actions: function() {
            if (!this.tinytbl || !this.tinytbl.thead || !this.tinytbl.thead.body1) {
                return;
            }
            var these = this, tinytbl = this.tinytbl, options = this.options;
            if (!(options.colresizable && options.colmoveable)) {
                return;
            }
            var colresize = !options.colresizable ? null : options.colresizable;
            var colorder = !options.colmoveable ? null : $.extend(options.colmoveable, {
                sortable: function() {

                }
            });

            if (colresize) {
                var useclass = '.ui-resizable', addclass = useclass.substr(1);
                $('*[data-coltype="thead"]').each(function(i) {
                        if ($(useclass, this).size() !== 1) {
                            $(this).wrapInner('<div class="'+addclass+'" />');
                            $(useclass, this).resizable({
                                'maxWidth': colresize.maxWidth,
                                'minWidth': colresize.maxWidth,
                                'handles':  colresize.handles,
                                'helper': colresize.helper,
                                'resize': function() {
                                    console.log($(this).width());
                                }
                            });
                        }
                });
            }
            /*
            if (colorder) {
                $(cells).each(function() {
                    $('.ui-resizable', this).sort(colorder);
                });
            }*/

        },


        /**
         * Check if element has an attribute
         * @param   {String} attribute
         * @param   {jQuery} element
         * @return  {Boolean|String|Number}
         * @private
         */
        _get_attr: function(attribute, element) {
            if (element && attribute && element.attr(attribute)) {
                return element.attr(attribute);
            }
            return false;
        },


        /**
         * Get the parent of an element
         * @param   {jQuery}          [element]
         * @return  {jQuery|boolean}  parent  jQuery-Object or false
         * @private
         */
        _get_parent: function(element) {
            element = element || this.element;
            var parent = element.parent(), tagname = (''+parent.get(0).tagName).toLowerCase();
            if (tagname !== 'body' && tagname !== 'html') {
                return parent;
            }
            return false;
        },


        /**
         * Check if element ele has a property key
         * @param   {String} property
         * @param   {Object} element
         * @return  {Object|Boolean|String|Number}
         * @private
         */
        _get_prop: function(property, element) {
            if (!(element && property && element.hasOwnProperty(property))) {
                return false;
            }
            var value = element[property];
            if (value !== null && value !== 0 && value !== false && value !== '') {
                return value
            }
            return false;
        },


        /**
         * Makes the parent of an element to be hidden
         * @return  {void}
         * @private
         */
        _hide_parent: function() {
            var parent = this._get_parent();
            if (!this.tinytbl || !(parent && parent.is(':visible')) ) {
                return;
            }
            if (parent.hasClass('ui-tinytbl-helper-hide')) {
                parent.css({ display:'none' }).removeClass('ui-tinytbl-helper-hide');
            } else if (parent.hasClass('ui-tinytbl-helper-show')) {
                parent.css({ display:'' }).removeClass('ui-tinytbl-helper-show');
            }
        },


        /**
         * Force the parent of an element to be visible
         * @return  {void}
         * @private
         */
        _show_parent: function() {
            var parent = this._get_parent();
            if (!this.tinytbl || !(parent && !parent.is(':visible')) ) {
                return;
            }
            if (parent.css('display') === 'none') {
                parent.css({ display:'block' }).addClass('ui-tinytbl-helper-hide');
            } else if (parent.css('display') !== 'block' && parent.css('display') !== 'static') {
                parent.css({ display:'block' }).addClass('ui-tinytbl-helper-show');
            }
        },


        /**
         * Add rows to TinyTbl
         * @param   {Object}   rows     // rows (width cells) to add
         * @param   {String}   key      // table object key ('tbody'; 'thead'; 'tfoot')
         * @param   {String}   [clss]   // css class to use ('ui-widget-header'; 'ui-widget-content')
         * @return  {void}
         * @private
         */
        _create_rows: function(rows, key, clss) {
            if (!this.tinytbl) {
                return;
            }
            var tinytbl = this.tinytbl,
                options = this.options,
                table1  = this.tinytbl[key].body1,
                table2  = this.options.fixed ? this.tinytbl[key].body2 : null;

            // check some function arguments
            clss = (clss ? ''+clss : ((key === 'thead' || key === 'tfoot') ? 'ui-widget-header' : 'ui-widget-content'));
            rows = rows || [];

            if (!(rows.length > 0 && table1) || (options.fixed && !table2)) {
                return;
            }

            // without fixed columns
            if (!table2) {
                if (key === 'tbody') {
                    $(rows).each(function(num) {
                        var cells = $(rows.get(num).cells).each(function(i) { $(this).attr('data-col',i); });
                        $('<tr data-row="'+num+'"'+_row_props(rows.eq(num))+' />').addClass(clss).append(cells).appendTo(table1);
                    });
                } else {
                    $(rows).each(function(num) {
                        var cells = $(rows.get(num).cells).each(function(i) { $(this).attr({ 'data-col':i, 'data-coltype':key  }); });
                        $('<tr data-row="'+num+'"'+_row_props(rows.eq(num))+' />').addClass(clss).append(cells).appendTo(table1);
                    });
                }
                if ((''+table1.get(0).tagName).toLowerCase() === 'tbody') {
                    tinytbl[key].height = table1.outerHeight();
                }
                return;
            }

            // with fixed columns
            if (key === 'tbody') {
                $(rows).each(function(num) {
                    var cells = $(rows.get(num).cells).each(function(i) { $(this).attr('data-col', i); }),
                        create = '<tr data-row="'+num+'"'+_row_props(rows.eq(num))+' />';
                    $(create).addClass(clss).append(cells.slice(options.fixed)).appendTo(table1);
                    $(create).addClass('ui-widget-header').append(cells.slice(0, options.fixed)).appendTo(table2);
                });
            } else {
                $(rows).each(function(num) {
                    var cells = $(rows.get(num).cells).each(function(i) { $(this).attr({ 'data-col':i, 'data-coltype':key  }) }),
                        create = '<tr data-row="'+num+'"'+_row_props(rows.eq(num))+' />';
                    $(create).addClass(clss).append(cells.slice(options.fixed)).appendTo(table1);
                    $(create).addClass('ui-widget-header').append(cells.slice(0, options.fixed)).appendTo(table2);
                });
            }

        },


        /**
         * Calculates and syncs the width of each column
         * from source table with another table
         * @return  {void}
         * @private
         */
        _cell_width: function() {
            if (!this.tinytbl) {
                return;
            }
            var fixed = this.options.fixed, tinytbl = this.tinytbl, tables = {}, colwidth = [], colgroup, tblwidth;

            var get_tables = function(index) {
                colwidth = [];
                colgroup = $('<colgroup />');
                tblwidth = 0;
                $.each(['thead','tbody','tfoot'], function(id, key) {
                    if (!tinytbl[key]['table'+index]) {
                        return;
                    }
                    var dom = tinytbl[key]['table'+index].get(0);
                    if (!(dom.rows.length > 0 && dom.rows[0].cells.length > 0)) {
                        return;
                    }
                    tables[key] = tinytbl[key]['table'+index];
                });
            };

            // get column width
            get_tables(1);
            $.each(tables, function(id, table) {
                var cols = table.get(0).rows[table.get(0).rows.length-1].cells;
                $.each(cols, function(i) {
                    var val = cols[i].offsetWidth;
                    if (!(colwidth[i] && colwidth[i] >= val)) {
                        colwidth[i] = val;
                    }
                });
            });

            // set column width to all tables
            $.each(colwidth, function(key, val) {
                colgroup.append('<col data-col="'+(key+fixed)+'" style="width:'+val+'px" width="'+val+'" />');
                tblwidth+=val;
            });
            $.each(tables, function(id, table) {
                //table.children('colgoup').remove();
                table.prepend(colgroup.clone()).width(tblwidth);
                if (!(tinytbl['size1'] && tinytbl['size1'] >= table.outerWidth())) {
                    tinytbl['size1'] = table.outerWidth();
                }
            });
            colgroup = null;

            // exit: no fixed columns
            if (!fixed) {
                return;
            }

            // get column width
            get_tables(2);
            $.each(tables, function(id, table) {
                var cols = table.get(0).rows[table.get(0).rows.length-1].cells;
                $.each(cols, function(i) {
                    var val = cols[i].offsetWidth;
                    if (!(colwidth[i] && colwidth[i] >= val)) {
                        colwidth[i] = val;
                    }
                });
            });

            // set column width to all tables
            $.each(colwidth, function(key, val) {
                colgroup.append('<col data-col="'+key+'" style="width:'+val+'px" width="'+val+'" />');
                tblwidth+=val;
            });
            $.each(tables, function(id, table) {
                table.children('colgoup').remove();
                table.prepend(colgroup.clone()).width(tblwidth);
                if (!(tinytbl['size2'] && tinytbl['size2'] >= table.outerWidth())) {
                    tinytbl['size2'] = table.outerWidth();
                }
            });
            colgroup = null;
        },

        /**
         * Calculates and syncs the height of each row
         * from source table with another table
         * @return  {void}
         * @private
         */
        _cell_height: function() {
            if (!this.tinytbl || !this.options.fixed) {
                return;
            }
            var tinytbl = this.tinytbl, options = this.options,
                tables = { 'tbody': tinytbl.tbody, 'thead': tinytbl.thead, 'tfoot': tinytbl.tfoot },
                height = [];

            $.each(tables, function(id, table) {
                if (!table.body1 || !table.body2) {
                    return;
                }
                var rows1 = table.body1.get(0).rows;
                $.each(rows1, function(i) {
                    height.push(rows1[i].cells[0].offsetHeight);
                });
                var rows2 = table.body2.get(0).rows;
                $.each(rows2, function(i) {
                    var value = rows2[i].offsetHeight;
                    if (height[i] < value) {
                        height[i] = value;
                    }
                });
                $.each(rows1, function(i) {
                    rows1[i].cells[0].style.height = (height[i]-options.cellheight)+'px';
                    rows2[i].cells[0].style.height = (height[i]-options.cellheight)+'px';
                });
                if ((''+table.body1.get(0).tagName).toLowerCase() === 'tbody') {
                    table.height = table.body1.parent('table').outerHeight();
                }
            });
        },


        /**
         * Resizes the table objects
         * @return  {void}
         * @private
         */
        _layout: function() {
            if (!this.tinytbl) {
                return;
            }
            var tinytbl = this.tinytbl,
                options = this.options,
                outerw = (tinytbl.size1 + tinytbl.size2),
                outerh = (tinytbl.thead.height + tinytbl.tfoot.height + tinytbl.tbody.height),
                maxw = options.tblwidth,
                maxh = options.tblheight,
                wrap = tinytbl.tbody.wrap1.get(0),
                usew, useh,
                innerw, innerh, clientw;

            /**
             * Set styles to the table wrapper
             * @param    {String} key     // table-id ('thead'|'tfoot'|'tbody')
             * @param    {Number} id      // 1 (scrollable) | 2 (fixed columns)
             * @param    {Object} css     // object with css-styles
             * @return   {void}
             * @internal
             */
            var set_styles = function(key, id, css) {
                if (!tinytbl[key] || !tinytbl[key]['body'+id]) {
                    tinytbl[key]['wrap'+id].css({'display':'none'});
                    return;
                }
                tinytbl[key]['wrap'+id].css({'display':'block'}).css(css);
            };

            /**
             * Get clientWidth or clientHeight of the scrollable table area
             * @param    {String} type                     // 'width'|'height'
             * @return   {Number} clientWidth|clientHeight
             * @internal
             */
            var get_inner = function(type) {
                return wrap[type === 'height' ? 'clientHeight' : 'clientWidth'];
            };

            // check if document has a scrollbar
            if ($(window).height() < $(document).height()) {
                maxw = options.tblwidth-scrollbarsize;
            }

            // check the outer size
            usew = outerw < maxw ? outerw : maxw;
            useh = outerh < maxh ? outerh : maxh;

            // check the size of scrollable table area
            innerh = useh-(tinytbl.thead.height+tinytbl.tfoot.height);
            innerw = usew-tinytbl.size2;

            // apply inner size to the scrollable table area
            set_styles('tbody',1, { 'overflow':'auto', 'width':innerw+'px', 'height':innerh+'px', 'z-index':1 });

            // check if inner width of scrollable table area has a scrollbar
            clientw = get_inner('width');
            if (clientw < innerw && (usew+scrollbarsize) < maxw) {
                innerw += scrollbarsize;
                usew += scrollbarsize;
                set_styles('tbody',1, { 'width':innerw+'px'});
            }

            // get inner size and apply them to the fixed table objects
            clientw = get_inner('width');
            set_styles('tbody',2, { 'width':tinytbl.size2+'px', 'height':get_inner('height')+'px' });
            set_styles('thead',2, { 'width':tinytbl.size2+'px', height:tinytbl.thead.height+'px' });
            set_styles('tfoot',2, { 'width':tinytbl.size2+'px', height:tinytbl.tfoot.height+'px' });
            set_styles('thead',1, { 'width':clientw+'px', height:tinytbl.thead.height+'px' });
            set_styles('tfoot',1, { 'width':clientw+'px', height:tinytbl.tfoot.height+'px' });

            // resize the table widget
            tinytbl.outer.css({ 'width':usew+'px', 'height':useh+'px' });
        },


        /**
         * Creates the TinyTbl widget
         * @return  {void}
         * @private
         */
        _create: function() {
            if (!((''+this.element.get(0).tagName).toLowerCase() === 'table' && this.element.parent('td')  && this.element.parent('th'))) {
                return;
            }
            var element = this.element,
                options = this.options,
                these = this,
                tinytbl,
                $body = $('body'),
                $parent = this._get_parent(element) || $body,
                items = element.get(0).rows,
                rows = items.length,
                cols, value,
                createInner = '<div class="ui-helper-clearfix" />',
                createWrap1 = '<div class="has-scroll" />',
                createWrap2 = '<div class="non-scroll" />';

            // exit: table is empty
            if ( !(rows > 0 && (cols = items[rows-1].cells.length) > 0) ) {
                return;
            }

            // check options
            options.fixed = (!isNaN(parseInt(options.fixed)) && options.fixed > 0 && options.fixed < cols) ? options.fixed : 0;
            options.id = (options.id || 'tinytbl-'+tinytables);
            $.each(['tfoot', 'thead'], function(id, key) {
                if (!(options[key] && element.children('tbody') && element.children(key).size() === 1 && element.children(key).children().size() > 0)) {
                    options[key] = false;
                    return;
                }
                if (key === 'tfoot') {
                    options[key] = $.extend({ 'classname': null, 'top': false }, options[key]);
                    return;
                }
                options[key] = $.extend({ 'classname': null }, options[key]);
            });

            // exit: no fixed header, footer or columns
            if (!(options.thead || options.tfoot || options.fixed)) {
                return;
            }

            /**
             * Checks if table object exists
             * @param    {String} key     // table-id ('thead'|'tfoot'|'tbody')
             * @param    {Number} id      // 1 (scrollable) | 2 (fixed columns)
             * @param    {String} tag     // container ('thead'|'tfoot'|'tbody')
             * @return   {jQuery | null}
             * @internal
             */
            var table_exists = function(key, id, tag) {
                if ( !(key && id && tinytbl.hasOwnProperty(key)) ) {
                    return null;
                }
                var element = tinytbl[key]['table'+id];
                if (!element) {
                    return null;
                }
                return (element.children(tag).size() === 1 ? element.children(tag) : null);
            };

            /**
             * Creates an table object if it not exists
             * @param    {String} key     // source-id ('thead'|'tfoot'|'tbody')
             * @param    {String} add     // destination-id ('thead'|'tfoot'|'tbody')
             * @param    {String} tag     // container ('thead'|'tfoot'|'tbody')
             * @return   {void}
             * @internal
             */
            var table_create = function(key, add, tag) {
                var create = '<tbody />';
                if (key !== add && tag) {
                    create = '<' +tag+' />';
                }
                tinytbl[key].body1 = table_exists(add, 1, tag) || $(create).prependTo(tinytbl[add].table1);
                if (options.fixed && tinytbl[add].table2) {
                    tinytbl[key].body2 = table_exists(add, 2, tag) || $(create).prependTo(tinytbl[add].table2);
                }
            };

            /**
             * Get available max sizes (width and height)
             * for the table object
             * @param    {Number|String} input
             * @param    {Number}        value
             * @returns  {Number}
             * @internal
             */
            var calc_maxsize = function(input, value) {
                switch(input.replace(/\d/g, '')) {
                    case 'em':
                        return Math.floor(parseInt(input) * options.emsize);
                    case 'pt':
                        return Math.floor(parseInt(input) * (4/3));
                    case '%':
                        return Math.floor(value * (parseInt(input) / 100));
                    default:
                        return parseInt(input) || value;
                }
            };

            /**
             * Get styles for correct the available max sizes
             * @param    {jQuery} element
             * @param    {String} size    // 'width'|'height'
             * @return   {Number}
             * @internal
             */
            var parse_styles = function(element, size) {
                var value = 0;
                if (!(element && (size === 'height' || size === 'width'))) {
                    return value;
                }
                switch(size) {
                    case 'width':
                        $.each(['marginLeft', 'marginRight', 'paddingLeft', 'paddingRight', 'borderLeftWidth', 'borderRightWidth'], function(id, key) { value += parseInt(element.css(key), 10); });
                        return value;
                    case 'height':
                        $.each(['marginTop', 'marginBottom', 'paddingTop', 'paddingBottom', 'borderTopWidth', 'borderBottomWidth'], function(id, key) { value+= parseInt(element.css(key), 10); });
                        return value;
                }
                return value;
            };

            // extend options
            options.rtl = !!(options.rtl);
            if (options.colresizable) {
                options.colresizable = $.extend({}, {
                    'disable': '',
                    'helper': null,
                    'maxWidth': null,
                    'minWidth': 30
                }, options.colresizable);
                options.colresizable = $.extend({}, options.colresizable, { 'handles':(options.rtl ? 'w' : 'e') });
            }
            if (options.colmoveable) {
                options.colmoveable = $.extend({ 'disabled': [] }, options.colmoveable, { 'axis':'y' });
            }
            if (options.resizable) {
                options.resizable = $.extend({
                    'handles': (options.rtl ? 'w,s' : 'e,s'),
                    'helper': null,
                    'maxHeight': null,
                    'maxWidth': ($parent.width() - parse_styles($parent, 'width')),
                    'minHeight': 100,
                    'minWidth': 100
                }, options.resizable);
            }
            options.tbody = $.extend({ 'classname': null }, this.options.tbody);
            options.tblwidth = 0;
            options.tblheight = 0;
            options.cellwidth = 0;
            options.cellheight = 0;
            options.emsize = $parent.css('font-size') || 16;

            // create table objects
            tinytbl = {
                'cols': cols, 'rows': rows,
                'thead':{
                    'inner': $(createInner), 'wrap1': $(createWrap1), 'wrap2': $(createWrap2),
                    'table1': null, 'body1': null, 'table2': null, 'body2': null, 'height': 0
                },
                'tbody':{
                    'inner': $(createInner), 'wrap1': $(createWrap1), 'wrap2': $(createWrap2),
                    'table1': null, 'body1': null, 'table2': null, 'body2': null, 'height': 0
                },
                'tfoot':{
                    'inner': $(createInner), 'wrap1': $(createWrap1), 'wrap2': $(createWrap2),
                    'table1': null, 'body1': null, 'table2': null, 'body2': null, 'height': 0
                },
                'outer': $('<div class="ui-tinytbl ui-widget-content ui-corner-all ui-helper-clearfix" />'),
                'size1': 0, 'size2': 0
            };
            if (value = this._get_attr('class', element)) {
                tinytbl.outer.addClass(value);
            }
            if (value = this._get_attr('id', element)) {
                tinytbl.outer.attr('role', value);
            }
            if (value = this._get_prop('id', this.options)) {
                tinytbl.outer.attr('id', value);
            }
            if (value = this._get_prop('classname', this.options))  {
                tinytbl.outer.addClass(value);
            }

            // rows from original (source) table
            items = {};

            // init row containers for TinyTbl
            rows = ['thead','tbody','tfoot'];
            if (options.tfoot.top) {
                rows = ['thead','tfoot','tbody'];
                if (''+options.tfoot.top === 'before') {
                    rows = ['tfoot','thead','tbody'];
                }
            }

            // each available table row container
            $.each(rows, function(id, key) {
                var child = element.children(key) || null,
                    cname = these.classnames[key],
                    value = child;
                if (key === 'tbody' && !value) {
                    value = element;
                }
                items[key] = value;
                tinytbl[key].data = (value ? value.clone().children() : null);
                tinytbl[key].inner.append(tinytbl[key].wrap2, tinytbl[key].wrap1);
                tinytbl.outer.append(tinytbl[key].inner.addClass(cname));
                if (!((options[key] && value) || key === 'tbody')) {
                    return;
                }
                tinytbl[key].table1 = $('<table />').appendTo(tinytbl[key].wrap1);
                if (options.fixed) {
                    tinytbl[key].table2 = $('<table />').appendTo(tinytbl[key].wrap2);
                }
                if (options[key] && element !== child && (value = these._get_prop('classname', options))) {
                    tinytbl[key].inner.addClass(value);
                }
                if ((!options[key] && element === child) || (options[key] && element !== child)) {
                    if (value = these._get_attr('class', child)) {
                        tinytbl[key].inner.addClass(value);
                    }
                    if (value = these._get_attr('id', child)) {
                        tinytbl[key].inner.attr('role', value);
                    }
                }
            });

            // append TinyTbl after original (source) table
            element
                .after(tinytbl.outer)
                .empty()
                .hide()
                .data(items);

            // get available max-height and max-width
            $.each(['height','width'], function(id,key) {
                var tbl = 'tbl'+key;
                if ((''+options[key]) === 'auto' || (''+options[key]).substr(-1,1) === '%') {
                    options[tbl] = (($parent !== $body) ? $parent[key]() : $(window)[key]());
                    options[tbl] -= parse_styles($parent, key);
                }
                if ((''+options[key]) !== 'auto') {
                    options[tbl] = calc_maxsize(options[key], options[tbl]);
                }
                options[tbl] -= parse_styles(tinytbl.outer, key);
            });

            // save options
            this.options = options;

            // save TinyTbl object
            this.tinytbl = tinytbl;

            // append tables
            $.each(['tbody','tfoot','thead'], function(id, key) {
                if (options[key] || key === 'tbody') {
                    table_create(key,key,'tbody');
                    return;
                }
                table_create(key,'tbody',key);
            });

            // append rows
            value = (options.rtl ? 'right':'left');
            $.each(['tbody','thead','tfoot'], function(id, key) {
                var zindex = (key === 'tbody' ? 1 : 3), overflow = (key === 'tbody' ? 'auto' : 'hidden');
                if (!tinytbl[key].body1) {
                    return;
                }
                tinytbl[key].wrap1.css({'float':value, 'overflow':overflow, 'z-index':zindex });
                if (tinytbl[key].table2) {
                    tinytbl[key].wrap2.css({'float':value, 'overflow':'hidden', 'z-index':(zindex+1) });
                    if (options.rtl) {
                        tinytbl[key].table1.css({ 'margin-right':'-1px' });
                    } else {
                        tinytbl[key].table1.css({ 'margin-left':'-1px' });
                    }
                }
                these._create_rows(tinytbl[key].data, key, ((key === 'tbody' || !options[key]) ? 'ui-widget-content' : 'ui-widget-header'));
            });

            if (tinytbl.tbody.body1) {
                /*
                $('.ui-tinytbl-body>div>table>tbody').selectable({
                    filter:'tr',
                    stop: function(event, ui) {
                        console.log('You selected the following rows: ' + $(this).find('.ui-selected').map(function(id) {
                            return id;
                        }).get().join(', '));
                    }
                });
                */
            }

            // init layout
            this._show_parent();
            this._cell_width();
            this._cell_height();
            this._layout();
            this._hide_parent();

            // actions
            this._actions();

            /*
            if (tinytbl.thead.height || (options.tfoot.top && tinytbl.tfoot.height)) {
                tinytbl.tbody.table1.css({ 'margin-top':'-1px' });
                if (tinytbl.tbody.table2) {
                    tinytbl.tbody.table2.css({ 'margin-top':'-1px' });
                }
            }
            if (options.tfoot.top && tinytbl.tfoot.height) {
                tinytbl.tfoot.table1.css({ 'margin-top':'-1px' });
                if (tinytbl.tfoot.table2) {
                    tinytbl.tfoot.table2.css({ 'margin-top':'-1px' });
                }
            }
            */

            // iterate TinyTbl objects
            tinytables++;

        },


        /**
         * Intializing
         * @return  {void}
         * @private
         */
        _init: function() {
            if (!this.tinytbl) {
                return;
            }
            var these = this;

            // scroll function
            these.tinytbl.tbody.wrap1.on('scroll.tinytbl', function() {
                these._scroll();
            });

            // autofocus
            if (these.options.autofocus) {
                these.tinytbl.tbody.wrap1.focus();
            }
        },


        /**
         * Add new row(s) to TinyTbl body object
         * @param   {jQuery}  rows
         * @param   {Boolean} [before]
         * @return  {void}
         * @private
         */
        _append: function(rows, before) {
            if (!this.tinytbl || !this.tinytbl.tbody) {
                return;
            }
            var options = this.options,
                tinytbl = this.tinytbl,
                table1 = tinytbl.tbody.body1,
                table2 = (options.fixed) ? tinytbl.tbody.body2 : null,
                append = before ? 'prependTo' : 'appendTo',
                start = this.element.data('tbody').get(0).rows.length;
            if (!table1 || (options.fixed && !table2)) {
                return;
            }
            if (!before) {
                this.element.data('tbody').append(rows.clone());
            } else {
                this.element.data('tbody').prepend(rows.clone());
            }
            if (options.colautosize || !options.colresizable) {
                $.each(['tfoot','thead','tbody'], function(id, key) {
                    var element;
                    if (element = tinytbl[key].body1) {
                        element.parent('table').css({width:''});
                    }
                });
            }
            if (!table2) {
                $(rows).each(function(num) {
                    var cells = $(rows.get(num).cells).each(function(i) { $(this).attr('data-col',i); });
                    $('<tr data-row="'+(num+start)+'"'+_row_props(rows.eq(num))+' />').addClass('ui-widget-content').append(cells)[append](table1);
                });
            } else {
                $(rows).each(function(num) {
                    var cells = $(rows.get(num).cells).each(function(i) { $(this).attr('data-col', i); }),
                        create = '<tr data-row="'+num+'"'+_row_props(rows.eq(num))+' />';
                    $(create).addClass('ui-widget-content').append(cells.slice(options.fixed))[append](table1);
                    $(create).addClass('ui-widget-header').append(cells.slice(0, options.fixed))[append](table2);
                    var h1 = cells.get(0).offsetHeight, h2 = cells.get(options.fixed).offsetHeight, hn = (((h1 < h2) ? h2 : h1)-options.cellheight)+'px';
                    cells.get(0).style.height = hn;
                    cells.get(options.fixed).style.height = hn;
                });
            }
            if (options.height === 'auto' || options.colautosize || !options.colresizable) {
                this._show_parent();
                if (options.colautosize || !options.colresizable) {
                    this._cell_width();
                }
                if (options.height === 'auto') {
                    tinytbl.tbody.height = table1.outerHeight();
                }
                this._layout();
                this._hide_parent();
            }
            if (typeof(this.options.rowAdd) === 'function') {
                this.options.rowAdd(rows, (!before ? start : 0), this.tinytbl.tbody);
            }
        },


        /**
         * Removes row(s) from TinyTbl body object
         * @param   {Object|Number} rows
         * @param   {Number}        [start]
         * @return  {void}
         * @private
         */
        _remove: function(rows, start) {
            if (!this.tinytbl) {
                return;
            }
            var table1 = this.tinytbl.tbody.body1,
                table2 = this.options.fixed ? this.tinytbl.tbody.body2 : null,
                tbody = this.element.data('tbody'),
                row = 0, beg;
            if (!table1 || (this.options.fixed && !table2)) {
                return;
            }
            if (typeof(rows) === 'number') {
                if (typeof(start) !== 'number') {
                    row = 0;
                } else {
                    row = parseInt(start, 10);
                }
                beg = row;
                if (!table2) {
                    for(;row < rows; row++) {
                        $(table1.get(0).rows[row]).remove();
                        $(tbody.get(0).rows[row]).remove();
                    }
                } else {
                    for(;row < rows; row++) {
                        $(table1.get(0).rows[row]).remove();
                        $(table2.get(0).rows[row]).remove();
                        $(tbody.get(0).rows[row]).remove();
                    }
                }
            } else if (typeof(rows) === 'object') {
                if (table2) {
                    $(rows).each(function(row) {
                        $(table1.get(0).rows[row]).remove();
                        $(table2.get(0).rows[row]).remove();
                        $(tbody.get(0).rows[row]).remove();
                    });
                } else {
                    $(rows).each(function(row) {
                        $(table1.get(0).rows[row]).remove();
                        $(tbody.get(0).rows[row]).remove();
                    });
                }
                beg = null;
            }
            if (this.options.height === 'auto') {
                this.tinytbl.tbody.height = table1.outerHeight();
                this._show_parent();
                this._layout();
                this._hide_parent();
            }
            if (typeof(this.options.rowRemove) === 'function') {
                this.options.rowRemove(rows, beg, this.tinytbl.tbody);
            }
        },


        /**
         * Syncs scroll positions
         * @return  {void}
         * @private
         */
        _scroll: function() {
            var tinytbl = this.tinytbl, options = this.options;
            if ( !(tinytbl && (options.fixed || options.thead || options.tfoot)) ) {
                return;
            }
            if (options.fixed) {
                var y = tinytbl.tbody.wrap1.scrollTop();
                tinytbl.tbody.wrap2.scrollTop(y);
            }
            if (options.thead || options.tfoot) {
                var x = tinytbl.tbody.wrap1.scrollLeft();
                if (options.thead) {
                    tinytbl.thead.wrap1.scrollLeft(x);
                }
                if (options.tfoot) {
                    tinytbl.tfoot.wrap1.scrollLeft(x);
                }
            }
        },


        /**
         * Removes the TinyTbl and restores the original table
         * @return  {void}
         * @public
         */
        destroy: function() {
            if (!this.tinytbl) {
                return;
            }
            this.tinytbl.outer.remove();
            this.tinytbl = null;
            this.element
                .show()
                .append(this.element.data('thead'))
                .append(this.element.data('tfoot'))
                .append(this.element.data('tbody'))
                .removeData();
        },


        /**
         * Append new rows to the TinyTbl body object
         * @param   {jQuery|Object} rows
         * @return  {void}
         * @public
         */
        append: function(rows) {
            this._append(rows, false);
        },


        /**
         * Prepend new rows to the TinyTbl body object
         * @param   {jQuery|Object} rows
         * @return  {void}
         * @public
         */
        prepend: function(rows) {
            this._append(rows, true);

        },


        /**
         * Remove rows from the TinyTbl body object
         * @param   {jQuery|Number} rows       // jQuery object of table rows or integer of rows to be deleted
         * @param   {Number}        [start]    // if rows is integer, then set start
         * @return  {void}
         * @public
         */
        remove: function(rows, start) {
            this._remove(rows, start);
        },

        '':''
    });

})(jQuery);

