window.require = {
    baseUrl: "//static.data.ox.ac.uk/courses-js-widget/",
    enforceDefine: true,
    paths: {
      "jquery": "lib/jQuery/jquery.min",
      "underscore": "lib/underscore/underscore-min",
      "jquery.dataTables": "lib/dataTables/js/jquery.dataTables.min",
      "jquery-ui": "lib/jQuery/jquery-ui.min",
    },
    shim: {
      "underscore": {exports: "_"},
      "jquery.dataTables": {deps: ["jquery"]},
      "jquery-ui": {deps: ["jquery"], exports: 'require'},
    }
};
