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
var utils = {};
utils.exchangeFBAccessToken = function (fbToken) {
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

utils.getFBProfilePicture = function (userID) {
  var deferred = Q.defer();

  var queryPath = 'https://graph.facebook.com/' + userID + '/picture?redirect=false&type=large';

  helpers.httpsGet(queryPath)
    .then(function (data) {
      deferred.resolve(JSON.parse(data));
    })
    .catch(function (e) {
      deferred.reject(e);
    });

  return deferred.promise;
}

utils.getFBFriends = function (user) {
  var deferred = Q.defer();

  var fbID = user.getProperty('facebookID');
  var fbToken = user.getProperty('fbToken');
  
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

utils.getFBTaggedPosts = function (user) {
  var deferred = Q.defer();

  var fbID = user.getProperty('facebookID');
  var fbToken = user.getProperty('fbToken');

  var query = {
    access_token: fbToken
  };

  var queryPath = 'https://graph.facebook.com/'+fbID+'/tagged?' + qs.stringify(query);

  var taggedPostsContainer = [];

  deferred.resolve(utils.makeFBPaginatedRequest(queryPath, taggedPostsContainer));

  return deferred.promise;
};

utils.makeFBPaginatedRequest = function (queryPath, container) {
  var deferred = Q.defer();

  helpers.httpsGet(queryPath)
    .then(function (data) {
      var dataObj = JSON.parse(data);

      container.push(dataObj.data)

      if (! dataObj.paging) {
        deferred.resolve(_.flatten(container, true));
      } else {
        deferred.resolve(utils.makeFBPaginatedRequest(dataObj.paging.next, container));
      }
    })
    .catch(function (e) {
      deferred.reject(e);
    });

  return deferred.promise;
}

utils.getFBPhotos = function (user) {
  var deferred = Q.defer();

  var fbID = user.getProperty('facebookID');
  var fbToken = user.getProperty('fbToken');

  var query = {
    access_token: fbToken
  };

  var queryPath = 'https://graph.facebook.com/'+fbID+'/photos?' + qs.stringify(query);

  var photoContainer = [];

  deferred.resolve(utils.makeFBPaginatedRequest(queryPath, photoContainer));

  return deferred.promise;
};

utils.getFBStatuses = function (user) {
  var deferred = Q.defer();

  var fbID = user.getProperty('facebookID');
  var fbToken = user.getProperty('fbToken');

  var query = {
    access_token: fbToken
  };

  var queryPath = 'https://graph.facebook.com/'+fbID+'/statuses?' + qs.stringify(query);

  var statusContainer = [];

  deferred.resolve(utils.makeFBPaginatedRequest(queryPath, statusContainer));

  return deferred.promise;
};

// utils.handleUpdateObject = function (update) {
//   console.log("update: " + JSON.stringify(update));
//   var deferred = Q.defer();

//   var fbUserID = {facebookID: update.uid};
//   var fbPostCreatedTime = update.time - 1;
//   var user;

//   User.find(fbUserID)
//     .then(function (userNode) {
//       user = userNode;
//       return utils.makeRequestForFeedItem(user, fbPostCreatedTime);
//     })
//     .then(function (fbResponse) {
//       var feedItems = fbResponse.data;
//       console.log("dis be ma response data: " + JSON.stringify(feedItems));

//       return utils.parseFBData(user, feedItems);
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

utils.makeRequestForFeedItem = function (user, postCreatedTime) {
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

module.exports = utils;