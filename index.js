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

var position;

var urlparser = require('./../../../modules/urlparser');
var urlVars = urlparser.urlVars;

var source1 =
    '<div>{{{text1}}}</div>' +
    '<div id="myCarousel" class="carousel slide" data-ride="carousel">' +

    '<ol class="carousel-indicators">' +
    '{{#images}}' +
    '<li data-target="#myCarousel" data-slide-to="{{@index}}"  class="{{#if @first}}active{{/if}}"></li>' +
    '{{/images}}' +
    '</ol>' +

    '<div class="carousel-inner" role="listbox">' +
    '{{#images}}' +
    '<div class="item {{#if @first}}active{{/if}}">' +
    '<img style="width: 100%" src="https://s3-eu-west-1.amazonaws.com/mapcentia-www/naturpark_lillebaelt/images/{{[0]}}" alt="">' +
    '<div class="carousel-caption">' +
    '<p>{{[1]}}</p>' +
    '</div>' +
    '</div>' +
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

    '{{#if video}}' +
    '<div class="embed-responsive embed-responsive-16by9">' +
    '<iframe class="embed-responsive-item" src="{{video}}" allowfullscreen></iframe>' +
    '</div>' +
    '{{/if}}';

var source2 =
    '<div class="embed-responsive embed-responsive-16by9">' +
    '<iframe class="embed-responsive-item" src="https://www.youtube.com/embed/' + window.vidiConfig.extensionConfig.naturparklillebaelt.youtubeId + '?rel=0"></iframe>' +
    '</div>' +
    '<button id="btn-marsvin" class="btn btn-raised btn-danger" style="width: 100%">Jeg hørte et marsvin!</button>' +
    '<div style="margin-top: 25px; margin-bottom: 15px">Hvad skal jeg lytte efter? Tryk og hør marsvinets lyde.</div>' +
    '<iframe width="100%" height="166" scrolling="no" frameborder="no" src="https://w.soundcloud.com/player/?url=https%3A//api.soundcloud.com/tracks/315009032&amp;color=ff5500&amp;auto_play=false&amp;hide_related=false&amp;show_comments=false&amp;show_user=false&amp;show_reposts=false"></iframe>' +
    '<div style="margin-top: 30px">{{{text1}}}</div>';

var sourceShare =
    '<div style="text-align: center" class="bs-component btn-group-sm">' +
    '<a href="javascript:void(0)" class="btn btn-default btn-fab btn-share" data-some-site="facebook" data-poi-id="{{id}}"><i class="material-icons fa fa-facebook"></i></a>' +
    '<a href="javascript:void(0)" class="btn btn-default btn-fab btn-share" data-some-site="twitter" data-poi-id="{{id}}"><i class="material-icons fa fa-twitter"></i></a>' +
    '</div>';

var template1 = handlebars.compile(source1);

var template2 = handlebars.compile(source2);

var templateShare = handlebars.compile(sourceShare);


var icon = L.icon({
    iconUrl: 'https://s3-eu-west-1.amazonaws.com/mapcentia-www/naturpark_lillebaelt/leaflet-icons/Krone-piktogram.png',

    iconSize: [40, 40], // size of the icon
    iconAnchor: [20, 20], // point of the icon which will correspond to marker's location
    popupAnchor: [-3, -76] // point from which the popup should open relative to the iconAnchor
});

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
        var parent = this;
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
                styleMap: function (feature) {
                    return {
                        weight: (function (d) {
                            return d === 12 ? 7 :
                                d === 14 ? 7 :
                                    '#FFEDA0';
                        }(feature.properties.id)),
                        opacity: 0.5,
                        //dashArray: '3',
                        color: (function (d) {
                            return d === 12 ? '#008ECF' :
                                d === 14 ? '#BD0026' :
                                    '#FFEDA0';
                        }(feature.properties.id))
                    }
                },

                onLoad: function () {
                    var me = this;
                    features = me.geoJSON.features;
                    $.each(features, function (i, v) {
                        featuresWithKeys[v.properties.id] = v.properties;
                    });
                    if ("geolocation" in navigator) {
                        navigator.geolocation.watchPosition(
                            function (p) {
                                position = p;
                                $("#btn-list-dis").removeClass("disabled");
                                if ($("#btn-list-dis").hasClass("active")) {
                                    parent.renderListWithDistance();
                                }
                            },

                            function () {
                                parent.renderListWithoutDistance();
                                $("#btn-list-alpha").addClass("active");
                                $("#btn-list-dis").removeClass("active");
                                $("#btn-list-dis").addClass("disabled");
                            }
                        );
                    } else {
                        parent.renderListWithoutDistance();
                    }

                    // Open POI if any
                    if (urlVars.poi !== undefined) {

                        var parr = urlVars.poi.split("#");
                        if (parr.length > 1) {
                            parr.pop();
                        }

                        parent.createInfoContent(parr.join());
                    }
                },

                // Bind a popup to each point
                onEachFeature: function (feature, layer) {
                    layer.on("click", function () {
                        parent.createInfoContent(feature.properties.id);
                    });
                },
                // Make Awesome Markers instead of simple vector point features
                pointToLayer: function (feature, latlng) {
                    return L.marker(latlng, {
                        icon: L.icon({
                            iconUrl: 'https://s3-eu-west-1.amazonaws.com/mapcentia-www/naturpark_lillebaelt/leaflet-icons/' + feature.properties.icon,
                            iconSize: [50, 50], // size of the icon
                            iconAnchor: [25, 25] // point of the icon which will correspond to marker's location
                        })
                    })
                }
            });
            storePoi.load();
            cloud.get().addGeoJsonStore(storePoi);
        });
    },

    createInfoContent: function (id) {

        featuresWithKeys[id].text1 = converter.makeHtml(featuresWithKeys[id].text1);
        featuresWithKeys[id].images = featuresWithKeys[id].images;

        if (id + "" === "1") {
            var html = template2(featuresWithKeys[id]);

        } else {
            var html = template1(featuresWithKeys[id]);

        }

        var htmlShare = templateShare(featuresWithKeys[id]);


        $("#click-modal").modal({});
        $("#click-modalLabel").html(featuresWithKeys[id].navn);
        $("#click-modal .modal-body").html(html + htmlShare);
    },

    renderListWithDistance: function () {
        var d, i;

        if (!position) {
            return;
        }

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

            if (features[i].geometry.type !== "Point") {
                features[i].properties.__distanceNum = 1000000000;
                features[i].properties.__distanceStr = '-';

            } else {

                d = getDistanceFromLatLonInKm(position.coords.latitude, position.coords.longitude, features[i].geometry.coordinates[1], features[i].geometry.coordinates[0]);
                features[i].properties.__distanceNum = d;
                features[i].properties.__distanceStr = prettyUnits(d) + 'm'
            }
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
    },

    renderListWithoutDistance: function () {
        features.sort(function (a, b) {
            var alc = a.properties.navn.toLowerCase(), blc = b.properties.navn.toLowerCase();
            return alc > blc ? 1 : alc < blc ? -1 : 0;
        });
        try {
            ReactDOM.render(
                <FeatureList features={features}/>,
                document.getElementById("inner-list")
            );
        } catch (e) {

        }

    },
};


function FeatureListDistance(props) {
    const features = props.features;
    const listFeatures = features.map((feature) =>

        <button data-naturpark-id={feature.properties.id} className="naturpark-list-item btn btn-default" key={feature.properties.id}>
            <img className="" src={"https://s3-eu-west-1.amazonaws.com/mapcentia-www/naturpark_lillebaelt/piktogrammer/" + feature.properties.icon}/>
            <div className="btn-text btn-text-dis">{feature.properties.navn}</div>
            <div className="distance">{feature.properties.__distanceStr}</div>
        </button>
    );
    return (
        <div>
            {listFeatures}
        </div>
    );
}

function FeatureList(props) {
    const features = props.features;
    const listFeatures = features.map((feature) =>
        <button data-naturpark-id={feature.properties.id} className="naturpark-list-item btn btn-default" key={feature.properties.id}>
            <img className="" src={"https://s3-eu-west-1.amazonaws.com/mapcentia-www/naturpark_lillebaelt/piktogrammer/" + feature.properties.icon}/>
            <div className="btn-text btn-text-alpha">{feature.properties.navn}</div>
        </button>
    );
    return (
        <div>{listFeatures}</div>
    );
}

