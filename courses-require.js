window.require = {
    baseUrl: "//static.data.ox.ac.uk/courses-js-widget/",
    paths: {
      "jquery": "//static.data.ox.ac.uk/lib/jquery.min",
      "underscore": "underscore-min",
      "jquery.dataTables": "//static.data.ox.ac.uk/lib/datatables/js/jquery.dataTables.min",
      "jquery-ui": "//static.data.ox.ac.uk/lib/jquery-ui/jquery-ui.min",
      "dataox": "dataox-1.1",
      "rdfstore": "rdf_store_min"
    },
    shim: {
      "underscore": {
        exports: "_"
      },
      "jquery.dataTables": ["jquery"],
      "jquery-ui": ["jquery"],
      "dataox": {
        exports: "dataox",
        deps: ["jquery-ui"]
      },
      "rdfstore": {
          exports: "rdfstore"
      }
    }
};
