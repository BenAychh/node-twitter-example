var twitterStream = angular.module('myApp', ['chart.js'])
var aapl = ['aapl'];
var aaplEMA15 = ['ema 15'];
var aaplEMA60 = ['ema 60'];
var multiplier15 = (2 / (15 + 1));
var multiplier60 = (2 / (60 + 1));
var chart = c3.generate({
  bindto: '#chart1',
  data: {
    columns: [aapl]
  },
})
// setTimeout(function () {
//   chart.load({
//     columns: [aapl, aaplEMA15, aaplEMA60]
//   })
// }, 100);


twitterStream.controller("mainCtrl", ['$scope', 'socket',
function ($scope, socket) {

  socket.on('newTweet', function (tweet) {
    $scope.tweet = tweet.text
    $scope.user = tweet.user.screen_name
    //parse source from payload
    var source = tweet.source.split('>')[1].split('<')[0].split(' ')[2]
    //all hashtags in the tweet
    var hashtags = tweet.entities.hashtags.map(function(el){
      return el.text.toLowerCase()
    })
    $.ajax({
      url: '/analyze?tweet=' + tweet.text
    })
    .done(function(result) {
      aapl.push(result.score);
      if (aaplEMA15.length != 1) {
        var previousEma15 = aaplEMA15[aaplEMA15.length - 1] || 0;
        var previousEma60 = aaplEMA60[aaplEMA15.length - 1] || 0;
        aaplEMA15.push((result.score - previousEma15) * multiplier15 + previousEma15);
        aaplEMA60.push((result.score - previousEma60) * multiplier60 + previousEma60);
      } else {
        aaplEMA15.push(result.score);
      }
      chart.load({
        columns: [aapl, aaplEMA15, aaplEMA60]
      })
    })
  });
}
]);


/*---------SOCKET IO METHODS (careful)---------*/

twitterStream.factory('socket', function ($rootScope) {
  var socket = io.connect();
  return {
    on: function (eventName, callback) {
      socket.on(eventName, function () {
        var args = arguments;
        $rootScope.$apply(function () {
          callback.apply(socket, args);
        });
      });
    },
    emit: function (eventName, data, callback) {
      socket.emit(eventName, data, function () {
        var args = arguments;
        $rootScope.$apply(function () {
          if (callback) {
            callback.apply(socket, args);
          }
        });
      });
    }
  };
});
