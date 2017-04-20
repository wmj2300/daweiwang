/**
 * Created by bjwsl-001 on 2017/4/6.
 */

var app = angular.module('dww', ['ng', 'ngRoute']);

//防抖动处理
app.factory('$debounce',
  ['$rootScope', '$browser', '$q', '$exceptionHandler',
  function($rootScope, $browser, $q, $exceptionHandler) {
    var deferreds = {},
      methods = {},
      uuid = 0;

    function debounce(fn, delay, invokeApply) {
      var deferred = $q.defer(),
        promise = deferred.promise,
        skipApply = (angular.isDefined(invokeApply) && !invokeApply),
        timeoutId, cleanup,
        methodId, bouncing = false;

      // check we dont have this method already registered
      angular.forEach(methods, function(value, key) {
        if (angular.equals(methods[key].fn, fn)) {
          bouncing = true;
          methodId = key;
        }
      });

      // not bouncing, then register new instance
      if (!bouncing) {
        methodId = uuid++;
        methods[methodId] = { fn: fn };
      } else {
        // clear the old timeout
        deferreds[methods[methodId].timeoutId].reject('bounced');
        $browser.defer.cancel(methods[methodId].timeoutId);
      }

      var debounced = function() {
        // actually executing? clean method bank
        delete methods[methodId];

        try {
          deferred.resolve(fn());
        } catch (e) {
          deferred.reject(e);
          $exceptionHandler(e);
        }

        if (!skipApply) $rootScope.$apply();
      };

      timeoutId = $browser.defer(debounced, delay);

      // track id with method
      methods[methodId].timeoutId = timeoutId;

      cleanup = function(reason) {
        delete deferreds[promise.$$timeoutId];
      };

      promise.$$timeoutId = timeoutId;
      deferreds[timeoutId] = deferred;
      promise.then(cleanup, cleanup);

      return promise;
    }


    // similar to angular's $timeout cancel
    debounce.cancel = function(promise) {
      if (promise && promise.$$timeoutId in deferreds) {
        deferreds[promise.$$timeoutId].reject('canceled');
        return $browser.defer.cancel(promise.$$timeoutId);
      }
      return false;
    };

    return debounce;
  }
]);


//配置路由词典
app.config(function ($routeProvider) {

  $routeProvider
    .when('/dwwStart', {
      templateUrl: 'tpl/start.html'
    })
    .when('/dwwMain', {
      templateUrl: 'tpl/main.html',
      controller: 'mainCtrl'
    })
    .when('/dwwDetail/:id', {
      templateUrl: 'tpl/detail.html',
      controller: 'detailCtrl'
    })
    .when('/dwwOrder/:did', {
      templateUrl: 'tpl/order.html',
      controller: 'orderCtrl'
    })
    .when('/dwwMyOrder', {
      templateUrl: 'tpl/myOrder.html',
      controller:'myOrderCtrl'
    })
    .otherwise({redirectTo: '/dwwStart'})

})

app.controller('parentCtrl', ['$scope', '$location',
  function ($scope, $location) {
    $scope.jump = function (desPath) {
      $location.path(desPath);
    }
  }
]);


app.controller('mainCtrl', ['$scope', '$http','$debounce',
  function ($scope, $http,$debounce) {
    //console.log('it is a test');
    $scope.hasMore = true;
    $http
      .get('data/dish_getbypage.php')
      .success(function (data) {
        //console.log(data);
        $scope.dishList = data;

      })

    $scope.loadMore = function () {
      $http
        .get('data/dish_getbypage.php?start='
        + $scope.dishList.length)
        .success(function (data) {
          if (data.length < 5) {
            $scope.hasMore = false;
          }
          $scope.dishList = $scope.dishList.concat(data);
        })
    }

    $scope.$watch('kw', function () {

      $debounce(watchHandler,300);
      //console.log($scope.kw);

    });

    watchHandler = function () {
      if ($scope.kw) {
        $http
          .get('data/dish_getbykw.php?kw=' + $scope.kw)
          .success(function (data) {
            //console.log(data);
            $scope.dishList = data;
          })
      }
    }
  }
]);


app.controller('detailCtrl',
  ['$scope', '$routeParams', '$http',
    function ($scope, $routeParams, $http) {
      //console.log($routeParams);
      $http
        .get('data/dish_getbyid.php?id=' + $routeParams.id)
        .success(function (data) {
          //console.log(data);
          $scope.dish = data[0];
        })
    }
  ]);

app.controller('orderCtrl',
  ['$scope', '$http', '$routeParams', '$httpParamSerializerJQLike',
    function ($scope, $http, $routeParams, $httpParamSerializerJQLike) {
      //console.log($routeParams);

      $scope.order = {did: $routeParams.did};

      $scope.submitOrder = function () {
        var result = $httpParamSerializerJQLike($scope.order)
        $http
          .get('data/order_add.php?' + result)
          .success(function (data) {
            console.log(data);
            if (data.length > 0) {
              if (data[0].msg == 'succ') {
                $scope.succMsg = "下单成功，订单编号为:" + data[0].oid;
                sessionStorage.setItem('phone', $scope.order.phone);
              }
              else {
                $scope.errMsg = "下单失败";
              }
            }

          })
      }
    }])

app.controller('myOrderCtrl', ['$scope', '$http',
  function ($scope, $http) {
    //根据手机号去查询所有的订单
    var phone = sessionStorage.getItem('phone');
    console.log(phone);

    $http
      .get('data/order_getbyphone.php?phone='+phone)
      .success(function (data) {
        console.log(data);
        $scope.orderList = data;
      })

  }])
