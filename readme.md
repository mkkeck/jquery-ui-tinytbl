jQuery UI TinyTable
===========================================================================

Light weight and fully themeable jQuery UI Plugin to generate tables on the
fly with fixed columns, header and/or footer.  Simple usage and a very small
with basic functions like append, prepend or remove one row to the table.



API description
---------------------------------------------------------------------------

### Create

Convert a normal table into a TinyTable, simple use this command:
`$('.selector').tinytbl(object options);`


#### You can use follow options:

- `direction (string 'ltr' | 'rtl')`
  This option set the text-direction. Default is 'ltr'.

- `thead (bool true or false | object { 'classname':'your-css-classname' })`
  If your table has a thead and tbody, you can set with this option thead
  as fixed. Default is true. Notice: If your table has not a thead or
  tbody this option is always set to false.

- `tfoot (bool true or false | object { 'classname':'your-css-classname'[, 'top':true|'after'|'before'] })`
  If your table has a tfoot and tbody, you can set with this option tfoot
  as fixed. Default is true. Notice: If your table has not a tfoot or
  tbody this option is always set to false.

- `tbody (object { 'classname':'your-css-classname' })`

- `fixed (integer 0)`
  Makes the first columns (counted from ltr or rtl, see also direction)
  fixed. Default is 0, no columns are fixed.

- `width (mixed 'auto')`
  Set the width of TinyTable. You can use values with px, pt, em or %.
  If you use only a numeric value,  the width is calculated in pixels.
  When setting this option to a percentage (%) value the  width of
  TinyTable is calculated to its parent element or $('body').
  __NEW:__
  If you use 'auto', TinyTable width is calculated to its parent element
  maximum available width. If the generated Table is smaller than maximum
  available width, TinyTable would be resized to its outer width.

- `height (mixed 'auto')`
  Set the height of TinyTable. You can use values with px, pt, em or %.
  If you use only a numeric value,  the height is calculated in pixels.
  When setting this option to a percentage (%) value the height of
  TinyTable is calculated to its parent element or $('body').
  __NEW:__
  If you use 'auto', TinyTable height is calculated to its parent element
  maximum available height. If the generated Table is smaller than maximum
  available height, TinyTable would be resized to its outer height.

- `autofocus (bool true | false)`
  Set the focus after TinyTable was created to the scrollable area.
  Default is false.


### Destroy

`$('.selector').tinytbl('destroy');`
Removes the TinyTable and restores the original table.


### Focus

`$('.selector').tinytbl('focus');`
Set the focus to the scrollable area.


### Append a row

`$('.selector').tinytbl('append', object tr-element);`
Add a new row to TinyTable to the bottom of the body section.


### Prepend a row

`$('.selector').tinytbl('prepend', object tr-element);`
Add a new row to TinyTable to the top of the body section.


### Remove a row

`$('.selector').tinytbl('remove', object tr-element);`
Removes a specified row from the body section.



Changelog
---------------------------------------------------------------------------

### Version 3.1.2, under development
__Complete reprogrammed__
- Ready for jQuery 1.10.2 and jQuery UI 1.10.3.
- Faster implementation, and easier interface
- Option 'renderer' removed
- Prepared to support col-resizing
__Please do not use this in production environment.__


### Version 2.1.2beta
__Support interlock tables__
[https://github.com/mkkeck/jquery-ui-tinytbl/tree/2.1.2beta](https://github.com/mkkeck/jquery-ui-tinytbl/tree/2.1.2beta)

### Version 2.1.1
__Official public release__
[https://github.com/mkkeck/jquery-ui-tinytbl/tree/2.1.1](https://github.com/mkkeck/jquery-ui-tinytbl/tree/2.1.1)

### Version 1.9.0a, released 2011-10-08
__1st official release__


Notes
---------------------------------------------------------------------------

### Minimum requirements:
- jQuery 1.6.2
- jQuery UI Core 1.8.16
- jQuery UI Widget 1.8.16

### Tested browsers:
- Firefox (> 26)
- Google Chrome (> 21)
- Internet Explorer (> 8)

### Mics:
- To enable fixed table header the table must have a tbody and a thead.
- To enable fixed table footer the table must have a tbody and a tfoot.


