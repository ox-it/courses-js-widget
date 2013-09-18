window.require = {
    baseUrl: "//static.data.ox.ac.uk/courses-js-widget/",
    enforceDefine: true,
    paths: {
      "jquery": "lib/jQuery/jquery.min",
      "jquery.dataTables": "lib/dataTables/js/jquery.dataTables.min",
    },
    shim: {
      "jquery": {exports: "$"},
      "jquery.dataTables": {deps: ["jquery"]},
    }
};
