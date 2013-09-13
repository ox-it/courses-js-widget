window.require = {
    baseUrl: "//static.data.ox.ac.uk/courses-js-widget/",
    enforceDefine: true,
    paths: {
      "jquery": "lib/jQuery/jquery.min",
      "jquery.dataTables": "lib/dataTables/js/jquery.dataTables.min",
      "jquery-ui": "lib/jQuery/jquery-ui.min",
      "underscore": "lib/underscore/underscore-min",
    },
    shim: {
      "jquery.dataTables": {deps: ["jquery"]},
      "jquery-ui": {deps: ["jquery"], exports: 'require'},
      "underscore": {exports: "_"},
    }
};
