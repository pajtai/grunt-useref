/*global console:false, window:false */
(function () {
    'use strict';

    console.log("starting aVendor");
    window.avendor = {
        test: function () {
            console.log("called a vendor method");
        }
    };
}());
