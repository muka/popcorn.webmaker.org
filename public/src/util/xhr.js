/* This Source Code Form is subject to the terms of the MIT license
 * If a copy of the MIT license was not distributed with this file, you can
 * obtain one at https://raw.github.com/mozilla/butter/master/LICENSE */

(function() {
  var __csrfToken = document.querySelector("meta[name=csrf-token]").content;

  var defaultErrorHandler = function( xhr, statusText, errorThrown ) {
    if ( console && console.error ) {
      console.error( "Request failed with %s: %s", statusText, errorThrown );
    }
  };

  var xhrModule = {
    ajax: function( options ) {
      var xhr = new XMLHttpRequest();
      xhr.open( options.method, options.url, true );
      xhr.onreadystatechange = function() {
        if ( this.readyState !== 4 ) {
          return;
        }

        // If this is a fire-and-forget request
        if ( !options.success ) {
          return;
        }

        var response = this.responseText;

        if ( this.status === 200 && this.getResponseHeader( "Content-Type" ) &&
             this.getResponseHeader( "Content-Type" ).match( "application/json" ) ) {
          try {
            response = JSON.parse( this.responseText );
          } catch ( ex ) {
            return options.error( this, "parsererror", ex );
          }
        }
        options.success( response );
      };

      if ( options.header === Object( options.header ) ) {
        Object.keys( options.header ).forEach( function( header ) {
          xhr.setRequestHeader( header, options.header[ header ] );
        });
      }

      if ( !options.error ) {
        options.error = defaultErrorHandler;
      }

      var data = options.data;

      // If the data being sent is a plain object and isn't a FormData object, convert it to JSON
      if ( !( data instanceof FormData ) && data === Object( data ) ) {
        data = JSON.stringify( data );
        xhr.setRequestHeader( "Content-Type", "application/json; charset=utf-8" );
      }

      xhr.send( data );
    },
    get: function( url, success ) {
      xhrModule.ajax({
        method: "GET",
        url: url,
        header: {
          "Accept": "application/json"
        },
        success: success
      });
    },
    post: function( url, data, success ) {
      if ( typeof data === "function" ) {
        success = data;
        data = null;
      }

      xhrModule.ajax({
        method: "POST",
        url: url,
        header: {
          "X-CSRF-Token": __csrfToken, // express.js uses a non-standard name for csrf-token
          "Accept": "application/json"
        },
        data: data,
        success: success
      });
    },
    put: function( url, data, success ) {
      xhrModule.ajax({
        method: "PUT",
        url: url,
        header: {
          "X-CSRF-Token": __csrfToken, // express.js uses a non-standard name for csrf-token
          "Accept": "application/json"
        },
        data: data,
        success: success
      });
    }
  };

  define([], function() {
    return xhrModule;
  });
}());
