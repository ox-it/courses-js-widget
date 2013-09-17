require(["jquery-ui", "courses"], function($) {

  var autocomplete = function(e, options) {
    // Stolen from dataox

    options = options || {};

    e = $('#' + e);                  // get the jQuery-wrapped version
    var obj = e.get(0);              // and the original DOM object

    searchURL = options.searchURL || $('body').attr('data-dataox-search-url') || "https://data.ox.ac.uk/search/"
    searchURL += '?callback=?'                                // so they know it's jsonp

    // build the default params for AJAX calls
    var defaultParams = {format: 'js'};
    for (var i = 0; i < obj.attributes.length; i++) {
      var attribute = obj.attributes[i];
      if (attribute.name.slice(0, 18) == 'data-autocomplete-')
        defaultParams[attribute.name.slice(18)] = attribute.value;
    }

    var h = $('<input type="hidden">').attr('name', e.attr('name')).val(e.val());
    e.attr('name', e.attr('name') + '-label').after(h);
    if (e.val()) {
      var originalVal = e.val();
      e.val("looking up…");
      $.get(searchURL, $.extend({}, defaultParams, {
        q: "uri:\""+originalVal+"\""
      }), function(data) {
        e.val(data.hits.total ? data.hits.hits[0].label : originalVal);
      }, 'json');
    }
    e.autocomplete({
      source: function(request, respond) {
        $.getJSON(
          searchURL,                                              // url
          $.extend({}, defaultParams, { q: request.term + '*' }), // data
          function(data) {                                        // success
            for (var i=0; i<data.hits.hits.length; i++) {
              data.hits.hits[i] = data.hits.hits[i]._source;
              data.hits.hits[i].value = data.hits.hits[i].uri;
            }
            respond(data.hits.hits);
        });
      },
      minLength: 2,
      focus: function(event, ui) {
        e.val(ui.item.label);
        if (options.focus)
          options.focus(event, ui);
        return false;
      },
      select: function(event, ui) {
        e.val(ui.item.label);
        h.val(ui.item.value);
        if (options.select)
          options.select(event, ui);
        return false;
      }
    });
  }

  $(function() {
    autocomplete("autocomplete-with-callback", {
      select: function(event, ui) {
        var dl = $('<dl>');
                    var name = $('input#autocomplete-with-callback').val();
        var metadata = $('#autocomplete-with-callback-metadata').empty().append(dl);
        if (ui.item.uri) {

          dl.append($('<dt>').text('Unit:'))
                              .append($('<dd>').html(name))
                              .append($('<dt>').text('Oxpoints URI:'))
            .append($('<dd>').html(ui.item.uri));
        }
      }
    });
  });


});

