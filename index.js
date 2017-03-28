/**
 * @fileoverview Description of file, its uses and information
 * about its dependencies.
 */

'use strict';

/**
 *
 * @type {*|exports|module.exports}
 */
var cloud;

/**
 *
 * @type {*|exports|module.exports}
 */
var backboneEvents;

var storePoi;

var React = require('react');

var ReactDOM = require('react-dom');

var prettyUnits = require("pretty-units");

var features = [];
var featuresWithKeys = {};


var handlebars = require('handlebars');

var showdown = require('showdown');

var converter = new showdown.Converter();

var source =
    '<div>{{{text1}}}</div>' +
    '<div id="myCarousel" class="carousel slide" data-ride="carousel">' +

    '<ol class="carousel-indicators">' +
    '{{#images}}' +
    '<li data-target="#myCarousel" data-slide-to="{{@index}}"  class="{{#if @first}}active{{/if}}"></li>' +
    '{{/images}}' +
    '</ol>' +

    '<div class="carousel-inner" role="listbox">' +
    '{{#images}}' +
    '<div class="item {{#if @first}}active{{/if}}"><img style="width: 100%" src="{{.}}" alt="Chania"></div>' +
    '{{/images}}' +
    '</div>' +


    '<a class="left carousel-control" href="#myCarousel" role="button" data-slide="prev">' +
    '<span class="glyphicon glyphicon-chevron-left" aria-hidden="true"></span>' +
    '<span class="sr-only">Previous</span>' +
    '</a>' +
    '<a class="right carousel-control" href="#myCarousel" role="button" data-slide="next">' +
    '<span class="glyphicon glyphicon-chevron-right" aria-hidden="true"></span>' +
    '<span class="sr-only">Next</span>' +
    '</a>' +
    '</div>' +
    '<div style="text-align: center" class="bs-component btn-group-sm">' +
    '<a href="javascript:void(0)" class="btn btn-primary btn-fab btn-share" data-toggle="tooltip" data-placement="top" data-some-site="facebook" title="Del på Facebook"><i class="material-icons fa fa-facebook"></i></a>' +
    '<a href="javascript:void(0)" class="btn btn-primary btn-fab btn-share" data-toggle="tooltip" data-placement="top" data-some-site="twitter" title="Del på Twitter"><i class="material-icons fa fa-twitter"></i></a>' +
    '</div>';

var template = handlebars.compile(source);

/**
 *
 * @type {{set: module.exports.set, init: module.exports.init}}
 */
module.exports = module.exports = {
    set: function (o) {
        cloud = o.cloud;
        backboneEvents = o.backboneEvents;
        return this;
    },
    init: function () {
        var me = this;
        $("#locale-btn").append($(".leaflet-control-locate"));
        backboneEvents.get().on("ready:meta", function () {
            storePoi = new geocloud.sqlStore({
                jsonp: false,
                method: "POST",
                host: "",
                db: "naturparklillebaelt",
                uri: "/api/sql",
                clickable: true,
                lifetime: 0,
                sql: "SELECT * FROM public.marsvin_app_ok",

                onLoad: function () {
                    var me = this;
                    features = me.geoJSON.features;
                    $.each(features, function (i, v) {
                        featuresWithKeys[v.properties.navn] = v.properties;
                    });
                    if ("geolocation" in navigator) {
                        navigator.geolocation.watchPosition(
                            function (position) {
                                renderListWithDistance(position);
                            },

                            function () {
                                renderListWithoutDistance();
                            }
                        );
                    } else {
                        renderListWithoutDistance();
                    }
                },

                // Bind a popup to each point
                onEachFeature: function (feature, layer) {
                    layer.on("click", function () {
                        me.createInfoContent(feature.properties.navn);
                    });
                },
                // Make Awesome Markers instead of simple vector point features
                pointToLayer: function (feature, latlng) {
                    return L.marker(latlng, {
                        icon: L.AwesomeMarkers.icon({
                                icon: 'circle-o',
                                markerColor: '#00578A',
                                prefix: 'fa'
                            }
                        )
                    });
                }
            });
            storePoi.load();
            cloud.get().addGeoJsonStore(storePoi);
        });
    },

    createInfoContent: function (id) {

        featuresWithKeys[id].text1 = converter.makeHtml(featuresWithKeys[id].text1);
        featuresWithKeys[id].images = featuresWithKeys[id].images;

        var html = template(featuresWithKeys[id]);

        $("#click-modal").modal({});
        $("#click-modalLabel").html(featuresWithKeys[id].navn);
        $("#click-modal .modal-body").html(html);
    }
};

var renderListWithoutDistance = function () {
    try {
        ReactDOM.render(
            <FeatureList features={features}/>,
            document.getElementById("inner-list")
        );
    } catch (e) {

    }

};


var renderListWithDistance = function (position) {
    var d, i;
    var getDistanceFromLatLonInKm = function (lat1, lon1, lat2, lon2) {
        var R = 6371000; // Radius of the earth in km
        var dLat = deg2rad(lat2 - lat1);  // deg2rad below
        var dLon = deg2rad(lon2 - lon1);
        var a =
                Math.sin(dLat / 2) * Math.sin(dLat / 2) +
                Math.cos(deg2rad(lat1)) * Math.cos(deg2rad(lat2)) *
                Math.sin(dLon / 2) * Math.sin(dLon / 2)
            ;
        var c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
        var d = R * c; // Distance in km
        return d;
    };

    var deg2rad = function (deg) {
        return deg * (Math.PI / 180)
    };

    for (i = 0; i < features.length; i++) {
        d = getDistanceFromLatLonInKm(position.coords.latitude, position.coords.longitude, features[i].geometry.coordinates[1], features[i].geometry.coordinates[0]);
        features[i].properties.__distanceNum = d;
        features[i].properties.__distanceStr = prettyUnits(d) + 'm'
    }
    features.sort(function (a, b) {
        var keyA = a.properties.__distanceNum,
            keyB = b.properties.__distanceNum;
        if (keyA < keyB) return -1;
        if (keyA > keyB) return 1;
        return 0;
    });
    try {
        ReactDOM.render(
            <FeatureListDistance features={features}/>,
            document.getElementById("inner-list")
        );
    } catch (e) {

    }

};

function FeatureListDistance(props) {
    const features = props.features;
    const listFeatures = features.map((feature) =>
        <button data-naturpark-name={feature.properties.navn} className="naturpark-list-item btn btn-default" key={feature.properties.navn}>
            {feature.properties.navn} {feature.properties.__distanceStr}
        </button>
    );
    return (
        <div>{listFeatures}</div>
    );
}

function FeatureList(props) {
    const features = props.features;
    const listFeatures = features.map((feature) =>
        <div data-naturpark-name={feature.properties.navn} className="naturpark-list-item" key={feature.properties.navn}>
            {feature.properties.navn}
        </div>
    );
    return (
        <div>{listFeatures}</div>
    );
}

