load('underscore-min.js');
putstr('define(["underscore"], function(_) {\n'
     + '\treturn '
     + _.template(read(arguments[0])).source
     + ';\n'
     + '});\n');
