/*global $, moment, $x*/
/*jslint browser, devel, multivar, long*/
(function (window) {

    "use strict";
    const Blob = window.Blob;
    window.myNamespace = window.myNamespace || {};
    window.myNamespace.ClickTracker = function (config) {
        // Call Initialization on ClickTracker Call
        this.init(config);
    };
    window.myNamespace.ClickTracker.prototype = {
        // Initialization
        init: function (config) {

            let tracker = this;

            tracker.track = typeof (config.track) === "boolean"
                ? config.track
                : true;
            tracker.interactionEvents = Array.isArray(config.interactionEvents) === true
                ? config.interactionEvents
                : ["mouseup", "touchend"];
            tracker.endpoint = typeof (config.endpoint) === "string"
                ? config.endpoint
                : "/interactions";
            tracker.async = typeof (config.async) === "boolean"
                ? config.async
                : true;
            tracker.debug = typeof (config.debug) === "boolean"
                ? config.debug
                : true;
            tracker.records = [];
            tracker.session = {};
            tracker.loadTime = new Date().toLocaleString();

            // Initialize Session
            tracker.initiallizeSession();
            // Call Event Binding Method
            tracker.bindEvents();

            return tracker;
        },
        convertDate: function (date) {
            let datetime = "Last Sync: " + date.getDate() + "/"
                + (date.getMonth() + 1) + "/"
                + date.getFullYear() + " @ "
                + date.getHours() + ":"
                + date.getMinutes() + ":"
                + date.getSeconds();
            return datetime;
        },

        // Create Events to Track
        bindEvents: function () {

            let tracker = this;
            // Set Interaction Capture
            if (tracker.track === true) {
                tracker.interactionEvents.forEach(function (el, ignore) {
                    $("body").on(el, function (e) {
                        e.stopPropagation();
                        tracker.addTracker(e, "track");
                    });
                });
            }

            // Bind onbeforeunload Event
            window.onbeforeunload = function (e) {

                return "You have some unsaved changes";
                // tracker.sdk.ajax("heatmap", "hit", "add", this.session, function () {

                // });
            };

            return tracker;
        },

        // Add Interaction Object Triggered By Events to Records Array
        addTracker: function (e, type) {
            let tracker = this,

                // Interaction Object
                trackdata = {
                    clicks: {
                        clientPosition: {
                            x: e.clientX,
                            y: e.clientY
                        },
                        screenPosition: {
                            x: e.screenX,
                            y: e.screenY
                        },
                        scrollPosition: {
                            x: e.pageX,
                            y: e.pageY
                        }
                    },
                    elements: {
                        targetTag: e.target.nodeName,
                        targetClasses: e.target.className,
                        targetID: e.target.id
                    },
                    type: type,
                    event: e.type,
                    createdAt: new Date().toLocaleString()
                };

            // Insert into Records Array
            tracker.records.push(trackdata);

            // Log Interaction if Debugging
            if (tracker.debug) {
                // Close Session & Log to Console
                tracker.closeSession();
                console.log("Session:\n", tracker.session);
            }

            return tracker;
        },

        // Generate Session Object & Assign to Session Property
        initiallizeSession: function () {
            let tracker = this;

            // Assign Session Property
            tracker.session = {
                loadTime: tracker.loadTime,
                unloadTime: new Date().toLocaleString(),
                language: window.navigator.language,
                platform: window.navigator.platform,
                port: window.location.port,
                clientStart: {
                    navigator_name: window.navigator.appVersion,
                    innerWidth: window.innerWidth,
                    innerHeight: window.innerHeight,
                    outerWidth: window.outerWidth,
                    outerHeight: window.outerHeight
                },
                page: {
                    location: window.location.pathname,
                    href: window.location.href,
                    origin: window.location.origin,
                    title: document.title
                }
            };

            return tracker;
        },

        // Insert End of Session Values into Session Property
        closeSession: function () {

            let tracker = this;

            // Assign Session Properties
            tracker.session.unloadTime = new Date().toLocaleString();
            tracker.session.trackdata = tracker.records;
            tracker.session.clientEnd = {
                name: window.navigator.appVersion,
                innerWidth: window.innerWidth,
                innerHeight: window.innerHeight,
                outerWidth: window.outerWidth,
                outerHeight: window.outerHeight
            };

            return tracker;
        },
        sdk: {
            ajax: function (sdkName, sub, act, reqBody, complete) {
                reqBody = this.session;
                let isEmptyObj = $.isEmptyObject(reqBody),
                    opts,
                    retVal;

                opts = {
                    type: (isEmptyObj)
                        ? "GET"
                        : "POST",
                    url: "../../api/sdk-" + sdkName + ".ashx?sub=" + sub + "&act=" + act,
                    dataType: "json",
                    contentType: "application/json",
                    headers: {
                        nonce: window.nonce
                    },

                    success: function (data) {
                        retVal = data;
                    },

                    error: function (ignore, textStatus) {
                        if (textStatus === "parsererror") {
                            // window.location.reload();
                        } else {
                            retVal = {
                                status: "error"
                            };
                        }
                    },

                    complete: function () {
                        complete(retVal);

                    }
                };

                if (isEmptyObj) {
                    $.ajax(opts);
                } else {
                    opts.data = JSON.stringify(reqBody);

                    $.ajax(opts);
                }

                // let tracker = this,
                //     // Initialize Cross Header Request
                //     xhr = new XMLHttpRequest();

                // // Close Session
                // tracker.closeSession();

                // // Post Session Data Serialized as JSON
                // xhr.open('POST', tracker.endpoint, tracker.async);
                // xhr.setRequestHeader('Content-Type', 'application/json; charset=UTF-8');
                // xhr.send(JSON.stringify(tracker.session));

                // return tracker;


                // 20210630: With formatting
                // let jsonObjectAsString = JSON.stringify(this.session, null, 4);

                // let blob = new Blob([jsonObjectAsString], {
                //     type: "application/json"
                //     // type: 'octet/stream'
                // });
                // // create an object URL from the Blob
                // let url = window.URL || window.webkitURL;
                // let dlUrl = url.createObjectURL(blob);
                // let lnk = $("<a>")[0];
                // // set object URL as the anchor's href
                // lnk.target = "_blank";
                // const fileExtension = ".json";
                // lnk.download = "trackClick" + fileExtension;
                // lnk.href = window.URL.createObjectURL(blob);
                // // append the anchor to document body
                // document.body.appendChild(lnk);
                // // fire a click event on the anchor
                // lnk.click();
                // // cleanup: remove element and revoke object URL
                // document.body.removeChild(lnk);
                // url.revokeObjectURL(dlUrl);

            }
        }
    };

}(window));

