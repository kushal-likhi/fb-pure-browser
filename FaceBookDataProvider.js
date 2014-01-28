/**
 * Pure browser based FB login and access.
 *
 * */
(function () {  //Encapsulate in an isolated scope

    var global = this;

    /**
     * FACE BOOK DATA PROVIDER CLASS
     *
     * This will automatically instantiate all required deps and will let you know when ready.
     *
     * @param {String} fbAppId The ID of facebook APP
     * @param {Object} [options] The Options object
     * @param {Function} callback The callback function. Parameters are (dataProviderObject{this|Object}, rawResponseOfConnectionStatus{Object}, isConnected{Boolean})
     *
     * */
    function FaceBookDataProvider(fbAppId, options, callback) {
        var that = this;

        //Validations
        if (typeof(fbAppId) != 'string') throw "Please provide a valid FaceBookAppId";

        //Fallback
        if (typeof(callback) == 'undefined') {
            callback = options;
            options = {};
        }

        //SDK Resource
        var fbJsSDKResource = {
            file: options.sdkFile || "//connect.facebook.net/en_US/all.js",
            channel: options.channel || null
        };

        var scope = options.scope || 'email,user_likes,user_photos,user_birthday,user_relationships,user_location,user_actions.music';

        this.onClose = function () {
            /*Internal event, for use with async wrapper*/
        };

        //Initialize the Facebook provider.
        this.initialize = function () {
            FB.getLoginStatus(function (response) {
                if (response.status === 'connected') {
                    callback(that, response, true);
                } else {
                    callback(that, response, false);
                }
            });
        };

        //Do the Dialog box login.
        this.login = function (callback) {
            FB.login(function (response) {
                if (response.authResponse) {
                    callback(response, true);
                } else {
                    callback(response, false);
                }
            }, {scope: scope});
        };

        //Do login via Redirect to page
        this.loginViaRedirect = function (callback) {
            global.location.href = ("https://www.facebook.com/dialog/oauth?" +
                "client_id=" + fbAppId +
                "&response_type=token" +
                "&scope=" + encodeURIComponent(scope) +
                "&state=" + encodeURIComponent("fb" + Base64.encode("(" + callback.toString() + ")")) +
                "&redirect_uri=" + encodeURIComponent(global.location.href));
        };

        //Logout
        this.disconnect = function (callback) {
            FB.api("/me/permissions", "delete", callback);
        };

        //Self explanatory utils methods for data access
        this.getUserDetails = function (callback) {
            FB.api('/me', function (response) {
                if (response) {
                    response.displayPicSrc = " https://graph.facebook.com/" + response.id + "/picture";
                }
                callback(response);
            });
        };
        this.getUserCoverPhoto = function (callback) {
            FB.api('/me?fields=cover', function (response) {
                if (response && response.cover && response.cover.source) {
                    callback(response.cover.source);
                } else {
                    callback(null);
                }
            });
        };
        this.getLocationDetails = function (id, callback) {
            FB.api('/' + id, function (response) {
                callback(response);
            });
        };
        this.getAlbums = function (callback) {
            FB.api('/me/albums', function (resp) {
                callback(resp);
            });
        };
        this.getAlbumPictures = function (albumId, limit, callback) {
            FB.api("/" + albumId + "/photos", {limit: limit}, function (response) {
                callback(response);
            });
        };
        this.getMusicLiked = function (callback) {
            FB.api('/me/music', function (resp) {
                callback(resp);
            });
        };
        this.getMoviesLiked = function (callback) {
            FB.api('/me/movies', function (resp) {
                callback(resp);
            });
        };
        this.getInterests = function (callback) {
            FB.api('/me/interests', function (resp) {
                callback(resp);
            });
        };
        this.getBooksLiked = function (callback) {
            FB.api('/me/books', function (resp) {
                callback(resp);
            });
        };
        this.getGamesLiked = function (callback) {
            FB.api('/me/games', function (resp) {
                callback(resp);
            });
        };
        this.getTelevisionLiked = function (callback) {
            FB.api('/me/television', function (resp) {
                callback(resp);
            });
        };
        this.getContacts = function (callback, filterFunction) {
            FB.api('/me/friends', function (resp) {
                if (typeof(filterFunction) == 'undefined') {
                    callback(resp.data);
                } else {
                    filterFunction(resp.data, function (data) {
                        callback(data);
                    });
                }
            });
        };
        this.getMutualFriend = function (friendFacebookId, callback) {
            FB.api('/me/mutualfriends/' + friendFacebookId, function (resp) {
                callback(resp.data);
            });
        };

        (function (d) {
            var js, id = 'facebook-jssdk', ref = d.getElementsByTagName('script')[0];
            if (d.getElementById(id) && typeof(global.FB) != 'undefined') {
                that.initialize();
                return;
            } else if (d.getElementById(id) && typeof(global.FB) == 'undefined') {
                global.fbAsyncInit = (function (fbAsyncInit) {
                    return function () {
                        fbAsyncInit();
                        that.initialize();
                    };
                })(global.fbAsyncInit);
                return;
            }
            (function () {
                global.fbAsyncInit = function () {
                    FB.init({
                        appId: fbAppId,
                        channelUrl: fbJsSDKResource.channel,
                        status: true,
                        cookie: true,
                        xfbml: true,
                        oauth: true
                    });
                    that.initialize();
                };
            }).apply(global);
            js = d.createElement('script');
            js.id = id;
            js.async = true;
            js.src = fbJsSDKResource.file;
            ref.parentNode.insertBefore(js, ref);
        }(document));
    }

    /**
     * Class that follows the Async Conventions for Contact Data providers. Helps in easy integration
     * */
    function FaceBookDataProviderAsyncWrapper() {
        var onClose = null;
        var getContacts = null;
        var getContactsFilter = null;

        //When user closes/interrupts the process
        this.onClose = function (closeFunction) {
            onClose = closeFunction;
        };

        //Bind the get contacts function
        this.getContacts = function (getContactsFunction, getContactsFilterFunction) {
            getContacts = getContactsFunction;
            getContactsFilter = getContactsFilterFunction;
        };

        //start doing the work
        this.trigger = function () {
            new FaceBookDataProvider(function (faceBookDataProvider, resp, isConnected) {
                var processConnectedResp = function (id, authToken) {
                    global.FBAuth = {
                        id: id,
                        authToken: authToken
                    };
                    faceBookDataProvider.onClose(onClose);
                    faceBookDataProvider.getContacts(getContacts, getContactsFilter);
                };
                if (isConnected) {
                    processConnectedResp(resp.authResponse.userID, resp.authResponse.accessToken);
                } else {
                    faceBookDataProvider.login(function (resp, connected) {
                        if (connected) {
                            processConnectedResp(resp.authResponse.userID, resp.authResponse.accessToken);
                        } else {
                            try {
                                onClose();
                            } catch (c) {
                            }
                        }
                    });
                }
            });
        };
    }

    /**
     * Base64 utils for Redirect Based fb login
     * */
    var Base64 = {
        _keyStr: "ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789+/=",
        encode: function (input) {
            var output = "";
            var chr1, chr2, chr3, enc1, enc2, enc3, enc4;
            var i = 0;
            input = Base64._utf8_encode(input);
            while (i < input.length) {
                chr1 = input.charCodeAt(i++);
                chr2 = input.charCodeAt(i++);
                chr3 = input.charCodeAt(i++);
                enc1 = chr1 >> 2;
                enc2 = ((chr1 & 3) << 4) | (chr2 >> 4);
                enc3 = ((chr2 & 15) << 2) | (chr3 >> 6);
                enc4 = chr3 & 63;
                if (isNaN(chr2)) {
                    enc3 = enc4 = 64;
                } else if (isNaN(chr3)) {
                    enc4 = 64;
                }
                output = output +
                    this._keyStr.charAt(enc1) + this._keyStr.charAt(enc2) +
                    this._keyStr.charAt(enc3) + this._keyStr.charAt(enc4);
            }
            return output;
        },
        decode: function (input) {
            var output = "";
            var chr1, chr2, chr3;
            var enc1, enc2, enc3, enc4;
            var i = 0;
            input = input.replace(/[^A-Za-z0-9\+\/\=]/g, "");
            while (i < input.length) {
                enc1 = this._keyStr.indexOf(input.charAt(i++));
                enc2 = this._keyStr.indexOf(input.charAt(i++));
                enc3 = this._keyStr.indexOf(input.charAt(i++));
                enc4 = this._keyStr.indexOf(input.charAt(i++));
                chr1 = (enc1 << 2) | (enc2 >> 4);
                chr2 = ((enc2 & 15) << 4) | (enc3 >> 2);
                chr3 = ((enc3 & 3) << 6) | enc4;
                output = output + String.fromCharCode(chr1);
                if (enc3 != 64) {
                    output = output + String.fromCharCode(chr2);
                }
                if (enc4 != 64) {
                    output = output + String.fromCharCode(chr3);
                }
            }

            output = Base64._utf8_decode(output);
            return output;
        },
        _utf8_encode: function (string) {
            string = string.replace(/\r\n/g, "\n");
            var utftext = "";
            for (var n = 0; n < string.length; n++) {
                var c = string.charCodeAt(n);
                if (c < 128) {
                    utftext += String.fromCharCode(c);
                }
                else if ((c > 127) && (c < 2048)) {
                    utftext += String.fromCharCode((c >> 6) | 192);
                    utftext += String.fromCharCode((c & 63) | 128);
                }
                else {
                    utftext += String.fromCharCode((c >> 12) | 224);
                    utftext += String.fromCharCode(((c >> 6) & 63) | 128);
                    utftext += String.fromCharCode((c & 63) | 128);
                }
            }
            return utftext;
        },
        _utf8_decode: function (utftext) {
            var string = "";
            var i = 0;
            var c = 0, c1 = 0, c2 = 0;
            while (i < utftext.length) {
                c = utftext.charCodeAt(i);
                if (c < 128) {
                    string += String.fromCharCode(c);
                    i++;
                }
                else if ((c > 191) && (c < 224)) {
                    c2 = utftext.charCodeAt(i + 1);
                    string += String.fromCharCode(((c & 31) << 6) | (c2 & 63));
                    i += 2;
                }
                else {
                    c2 = utftext.charCodeAt(i + 1);
                    c3 = utftext.charCodeAt(i + 2);
                    string += String.fromCharCode(((c & 15) << 12) | ((c2 & 63) << 6) | (c3 & 63));
                    i += 3;
                }
            }
            return string;
        }
    };

    /**
     * Facebook redirect login handler
     * */
    (function () {
        if (this.toString().search(/state=fb/ig) != -1) {
            var code = "";
            this.replace(/state=fb([^&]+)/ig, function (a, b) {
                code = decodeURIComponent(b);
            });
            var success = (this.toString().search(/access_token=/ig) != -1);
            jQuery(function () {
                eval(Base64.decode(code) + "(" + (success ? 'true' : 'false') + ")");
            });
        }
    }).apply(this.location.href);

    //Export for external use
    this.FaceBookDataProvider = FaceBookDataProvider;
    this.FaceBookDataProviderAsyncWrapper = FaceBookDataProviderAsyncWrapper;
}).apply(window);
