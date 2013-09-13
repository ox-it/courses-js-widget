window.require = {
    baseUrl: "//static.data.ox.ac.uk/courses-js-widget/",
    enforceDefine: true,
    paths: {
      "jquery": "lib/jQuery/jquery.min",
      "jquery.dataTables": "lib/dataTables/js/jquery.dataTables.min",
      "jquery-ui": "//static.data.ox.ac.uk/lib/jquery-ui/jquery-ui.min",
      "underscore": "lib/underscore/underscore-min",
    },
    shim: {
      "jquery": {exports: "$"},
      "jquery.dataTables": {deps: ["jquery"]},
      "jquery-ui": {exports: "$", deps: ["jquery"]},
      "underscore": {exports: "_"},
    }
};
