facebook-server-utils
=====================

Some utility functions which abstract away the difficulty of interacting with the Facebook API server side

All functions will return promises, which can be resolved according to the q libraries specifications:
[https://github.com/kriskowal/q]

This will usually mean calling .then(callback) on these functions - for example:
````
facebookServerUtils.exchangeFBAcessToken(12345,12345,12345)
.then(function(data){ console.log(data) };
````

##Contents

* exchangeFBAccessToken

##Requests to Facebook

####exchangeFBAccessToken(facebookToken, facebookAppID, facebookAppSecret)
######Input Values
* *facebookToken* is the temporary token that a specific user will send to the server after being authorized on the client side.
* *facebookAppID* is the unique id of your app.
* *facebookAppSecret* is the unique secret for your app given to you by Facebook

######Required
[facebookToken, facebookAppID, facebookAppSecret]

######Return
This function will return a promise that contains only the value of your new, long-term access token

Return type: String


