/**
 * @fileoverview Description of file, its uses and information
 * about its dependencies.
 */

'use strict';


/**
 *
 */
var backboneEvents;

var naturparkLillebaelt;

var jquery = require('jquery');
require('snackbarjs');


/**
 *
 * @returns {*}
 */
module.exports = {
    set: function (o) {
        backboneEvents = o.backboneEvents;
        naturparkLillebaelt = o.extensions.naturparkLillebaelt.index;
        return this;
    },
    init: function () {
        $("#btn-kort").on("click", function (e) {
            $("#map").fadeIn(200);
            $("#list").fadeOut(200);
            $("#btn-kort").addClass("active");
            $("#btn-list").removeClass("active");
        });
        $("#btn-list").on("click", function (e) {
            $("#map").fadeOut(200);
            $("#list").fadeIn(200);
            $("#btn-list").addClass("active");
            $("#btn-kort").removeClass("active");
        });

        $("#btn-list-dis").on("click", function (e) {
            if ($("#btn-list-dis").hasClass("disabled")) {
                return;
            }
            naturparkLillebaelt.renderListWithDistance();
            $("#btn-list-dis").addClass("active");
            $("#btn-list-alpha").removeClass("active");
        });
        $("#btn-list-alpha").on("click", function (e) {
            naturparkLillebaelt.renderListWithoutDistance();
            $("#btn-list-alpha").addClass("active");
            $("#btn-list-dis").removeClass("active");
        });

        $(document).arrive('#btn-marsvin', function () {
            $(this).on("click", function (e) {
                jquery.snackbar({id: "snackbar", content: "<span>" + __("Tak, det er registerert, at du hørte et marsvin") + "</span>", htmlAllowed: true, timeout: 2000});
            });
        });

        $(document).arrive('.naturpark-list-item', function () {
            $(this).on("click", function (e) {
                var id = $(this).data('naturpark-name');
                naturparkLillebaelt.createInfoContent(id);

            });
        });

        $(document).arrive('.btn-share', function () {
            $(this).on("click", function (e) {
                var site = $(this).data('some-site'), url;
                url = "http://dmi.dk";
                switch (site) {
                    case "facebook":
                        window.open("https://www.facebook.com/sharer/sharer.php?u=" + encodeURIComponent(url), '_blank', 'location=yes,height=300,width=520,scrollbars=yes,status=yes');
                        break;
                    case "twitter":
                        window.open("https://twitter.com/share?url=" + encodeURIComponent(url), '_blank', 'location=yes,height=300,width=520,scrollbars=yes,status=yes');
                        break;
                }
            });
        })
    }
};