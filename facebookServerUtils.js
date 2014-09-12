// Basic https requests
var https = require('https');
var qs = require('querystring');
// Promise library and functional programming utility
var Q = require('q');
var _ = require('lodash');

// Generic helper for data streaming
var helpers = {

  httpsGet: function (queryPath) {
    var deferred = Q.defer();

    https.get(queryPath, function (res) {
      var data = '';
      res.on('data', function(chunk) {
        data += chunk;
      });
      res.on('end', function(){
        deferred.resolve(data);
      })
    }).on('error', function(err) {
      deferred.reject(err);
    });

    return deferred.promise;
  }
};


// FACEBOOK HELPER METHODS
// All methods return promises which are resolved using .then syntax
var facebookServerUtils = {};
facebookServerUtils.exchangeFBAccessToken = function (fbToken) {
  var deferred = Q.defer();

  var query = {
    grant_type: 'fb_exchange_token',
    client_id: process.env.WADDLE_FACEBOOK_APP_ID,
    client_secret: process.env.WADDLE_FACEBOOK_APP_SECRET,
    fb_exchange_token: fbToken
  };

  var queryPath = 'https://graph.facebook.com/oauth/access_token?' + qs.stringify(query);

  helpers.httpsGet(queryPath)
  .then(function (data) {
    deferred.resolve(qs.parse(data));
  })
  .catch(function (e) {
    deferred.reject(e);
  });
  return deferred.promise;
};

// Takes in an object with userID and pictureSize parameters
facebookServerUtils.getFBProfilePicture = function (data) {
  var deferred = Q.defer();

  var userID = data.userID;
  var size = data.pictureSize;

  var queryPath = [
    'https://graph.facebook.com/',
    userID,
    '/picture?redirect=false&type=',
    size
    ].join('');

  helpers.httpsGet(queryPath)
    .then(function (data) {
      deferred.resolve(JSON.parse(data));
    })
    .catch(function (e) {
      deferred.reject(e);
    });

  return deferred.promise;
}

// Takes as input a user object with facebookID and facebookToken parameters
facebookServerUtils.getFBFriends = function (user) {
  var deferred = Q.defer();

  var fbID = user.facebookID;
  var fbToken = user.facebookToken;
  
  var query = {
    access_token: fbToken
  };

  var queryPath = 'https://graph.facebook.com/'+fbID+'/friends?' + qs.stringify(query);

  helpers.httpsGet(queryPath)
    .then(function (data) {
      deferred.resolve(JSON.parse(data));
    })
    .catch(function (e) {
      deferred.reject(e);
    });

  return deferred.promise;
};

// Facebook only allows 25 results to be returned at a given time
// Any request that might return more data will be returned with a .next field
// Allowing a chain of requests for the full set of data
// Container is passed recursively as an empty array and referenced from an outer function
facebookServerUtils.makeFBPaginatedRequest = function (queryPath, container) {
  var deferred = Q.defer();

  helpers.httpsGet(queryPath)
    .then(function (data) {
      var dataObj = JSON.parse(data);

      container.push(dataObj.data)

      if (! dataObj.paging) {
        deferred.resolve(_.flatten(container, true));
      } else {
        deferred.resolve(facebookServerUtils.makeFBPaginatedRequest(dataObj.paging.next, container));
      }
    })
    .catch(function (e) {
      deferred.reject(e);
    });

  return deferred.promise;
}

// Takes as input a user object with facebookID and facebookToken parameters
// Queries facebook graph API for tagged posts
facebookServerUtils.getFBTaggedPosts = function (user) {
  var deferred = Q.defer();

  var fbID = user.facebookID;
  var fbToken = user.facebookToken;

  var query = {
    access_token: fbToken
  };

  var queryPath = 'https://graph.facebook.com/'+fbID+'/tagged?' + qs.stringify(query);

  var taggedPostsContainer = [];

  deferred.resolve(facebookServerUtils.makeFBPaginatedRequest(queryPath, taggedPostsContainer));

  return deferred.promise;
};

// Takes as input a user object with facebookID and facebookToken parameters
// Queries Facebook API for a users photos
facebookServerUtils.getFBPhotos = function (user) {
  var deferred = Q.defer();

  var fbID = user.facebookID;
  var fbToken = user.facebookToken;

  var query = {
    access_token: fbToken
  };

  var queryPath = 'https://graph.facebook.com/'+fbID+'/photos?' + qs.stringify(query);

  var photoContainer = [];

  deferred.resolve(facebookServerUtils.makeFBPaginatedRequest(queryPath, photoContainer));

  return deferred.promise;
};

// Takes as input a user object with facebookID and facebookToken parameters
// Queries Facebook API for the statuses a user has posted
facebookServerUtils.getFBStatuses = function (user) {
  var deferred = Q.defer();

  var fbID = user.facebookID;
  var fbToken = user.facebookToken;

  var query = {
    access_token: fbToken
  };

  var queryPath = 'https://graph.facebook.com/'+fbID+'/statuses?' + qs.stringify(query);

  var statusContainer = [];

  deferred.resolve(facebookServerUtils.makeFBPaginatedRequest(queryPath, statusContainer));

  return deferred.promise;
};

// facebookServerUtils.handleUpdateObject = function (update) {
//   console.log("update: " + JSON.stringify(update));
//   var deferred = Q.defer();

//   var fbUserID = {facebookID: update.uid};
//   var fbPostCreatedTime = update.time - 1;
//   var user;

//   User.find(fbUserID)
//     .then(function (userNode) {
//       user = userNode;
//       return facebookServerUtils.makeRequestForFeedItem(user, fbPostCreatedTime);
//     })
//     .then(function (fbResponse) {
//       var feedItems = fbResponse.data;
//       console.log("dis be ma response data: " + JSON.stringify(feedItems));

//       return facebookServerUtils.parseFBData(user, feedItems);
//     })
//     .then(function (parsedCheckins) {
//       deferred.resolve({
//         user: user,
//         checkins: parsedCheckins
//       });
//     })
//     .catch(function (e) {
//       deferred.reject(e);
//     });

//   return deferred.promise;
// };

facebookServerUtils.makeRequestForFeedItem = function (user, postCreatedTime) {
  var deferred = Q.defer();

  var fbID = user.getProperty('facebookID');
  var fbToken = user.getProperty('fbToken');

  var query = {
    access_token: fbToken,
    since: postCreatedTime,
    'with': 'location'
  };

  var queryPath = 'https://graph.facebook.com/'+fbID+'/feed?' + qs.stringify(query);

  helpers.httpsGet(queryPath)
    .then(function (data) {
      console.log("feed data: ", data);
      deferred.resolve(JSON.parse(data));
    })
    .catch(function (e) {
      deferred.reject(e);
    });

  return deferred.promise;
};

module.exports = facebookServerUtils;