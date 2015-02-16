(function() {
  'use strict';
  /* Controllers */
  angular.module('proso.auth', ['ui.bootstrap'])

  .value('gettext', gettext)

  .controller('AppUser', ['$scope', 'user', '$routeParams', '$location', 
      '$timeout', 'gettext',
      function($scope, user, $routeParams, $location, $timeout, gettext) {

    $scope.profileUrl = $location.absUrl();
    $scope.user = {username: $routeParams.user};
    user.getPromiseByName($routeParams.user).success(function(data){
      $scope.user = data;
      $scope.editRights = data.username == user.getUser().username;

      if ($routeParams.edit !== undefined && $scope.editRights) {
        $timeout(function() {
          $scope.editableForm.$show();
        },10);
      }
    });

    $scope.saveUser = function() {
      // $scope.user already updated!
      return user.save($scope.user).error(function(err) {
        if(err.field && err.msg) {
          // err like {field: "name", msg: "Server-side error for this username!"} 
          $scope.editableForm.$setError(err.field, err.msg);
        } else { 
          // unknown error
          $scope.editableForm.$setError('name', gettext("V aplikaci bohužel nastala chyba."));
        }
      });
    };

  }])

  .directive('loginButton', ['loginModal', 'signupModal', 'user',
      function (loginModal, signupModal, user) {
    return {
      restrict: 'A',
      link: function (scope, element) {
        element.click(function(){
          loginModal.open(user.getUser());
        });
      }
    };
  }])

  .factory('user', ['$http', '$cookies', 'events', '$routeParams', '$timeout', 'loginModal',
      function($http, $cookies, events, $routeParams, $timeout, loginModal) {

    var user;

    function updateUser(data) {
      user.points = data.points;
      user.answered_count = data.answered_count;
      user.email = data.email;
      user.first_name = data.first_name;
      user.last_name = data.last_name;
      user.send_emails = data.send_emails;
    }

    var that = {
      initUser : function(userObject) {
        user = userObject;
        user.getLevelInfo = function() {
          return that.getLevelInfo(user);
        };
        
        $timeout(function() {
          if ($routeParams.requirelogin) {
            loginModal.open(user);
          }
        }, 100);

        $http.get('/user/').success(updateUser);
        return user;
      },
      getUser : function() {
        return user;
      },
      logout : function(callback) {
        $http.get('/user/logout/').success(callback);
        this.initUser('', 0);
        events.emit('userUpdated', user);
        return user;
      },
      addAnswer : function(isCorrect) {
        if (isCorrect) {
          user.points++;
        }
        user.answered_count++;
        $cookies.points = user.points;
        events.emit('userUpdated', user);
      },
      getPromiseByName : function(name) {
        if (name == user.username) {
          return {
            success : function(fn) {fn(user);},
          };
        } else {
          return $http.get('/user/' + name + '/');
        }
      },
      getLevelInfo : function(user) {
        var levelEnd = 0;
        var levelRange = 30;
        var rangeIncrease = 0;
        for (var i = 1; true; i++) {
          levelEnd += levelRange;
          if (user.points < levelEnd) {
            return {
              level : i,
              form : levelEnd - levelRange,
              to : levelEnd,
              range : levelRange,
              points : user.points - (levelEnd - levelRange),
            };
          }
          levelRange += rangeIncrease;
          rangeIncrease += 10;
        }
        
      },
      save : function(user) {
        $http.defaults.headers.post['X-CSRFToken'] = $cookies.csrftoken;
        return $http.post('/user/save/', user).success(updateUser); 
      },
      signup : function(userObject) {
        $http.defaults.headers.post['X-CSRFToken'] = $cookies.csrftoken;
        var promise = $http.post('/user/signup/', userObject);
        promise.success(updateUser);
        return promise;
      },
      login : function(credentials) {
        $http.defaults.headers.post['X-CSRFToken'] = $cookies.csrftoken;
        var promise = $http.post('/user/login/', credentials);
        promise.success(updateUser);
        return promise;
      },
    };
    return that;
  }])

  .factory('loginModal', ["$modal", function ($modal) {
    var ModalLoginCtrl = ['$scope', '$modalInstance', 'user', '$window', 
          'signupModal', 'gettext', '$analytics',
        function ($scope, $modalInstance, user, $window,
          signupModal, gettext, $analytics) {
      $scope.credentials = {};
      $scope.alerts = [];
      $scope.signupModal = signupModal;
      
      $scope.cancel = function () {
        $modalInstance.dismiss('cancel');
      };

      $scope.login = function() {
        $scope.loading = true;
        $analytics.eventTrack('click', {
          category: 'login',
          label: '/login/email',
        });
        user.login($scope.credentials).success(function() {
          $scope.loading = false;
          $window.location.reload();
        }).error(function(error) {
          $scope.loading = false;
          $scope.alerts.push({
            type : error.type || 'danger',
            msg : error.msg || gettext("V aplikaci bohužel nastala chyba."),
          });
        });
      };

      $scope.closeAlert = function(index) {
        $scope.alerts.splice(index, 1);
      };

    }];

    return {
      open : function(user) {
        if (!user.username) {
          $modal.open({
            templateUrl: 'static/tpl/login_modal.html',
            controller: ModalLoginCtrl,
          });
        }
      }
    };
  }])

  .factory('signupModal', ['$modal', 'events', '$routeParams', '$timeout', 'googleExperiments', 'user',
      function ($modal, events, $routeParams, $timeout, googleExperiments, user) {
    var ModalCtrl = ['$scope', '$modalInstance', 'user', '$rootScope', 'gettext', '$analytics',
        function ($scope, $modalInstance, user, $rootScope, gettext, $analytics) {
      $scope.registerForm = {};
      $scope.alerts = [];
      $scope.LANGUAGE_CODE = $rootScope.LANGUAGE_CODE;

      $scope.cancel = function () {
        $modalInstance.dismiss('cancel');
      };

      $scope.closeAlert = function(index) {
        $scope.alerts.splice(index, 1);
      };

      $scope.signup = function() {
        $scope.loading = true;
        user.signup($scope.registerForm).success(function(user){
          $scope.loading = false;

          $scope.registerForm = {};
          $scope.success = true;
          $rootScope.user = user;
          $analytics.eventTrack('click', {
            category: 'login',
            label: '/login/email',
          });
        }).error(function(error) {
          $scope.loading = false;
          $scope.alerts.push({
            type : error.type || 'danger',
            msg : error.msg || gettext("V aplikaci bohužel nastala chyba."),
          });
        });
      };
    }];

    var that = {
      open : function() {
        $modal.open({
          templateUrl: 'static/tpl/signup_modal.html',
          controller: ModalCtrl,
        });
      }
    };

    $timeout(function() {
      if ($routeParams.signup) {
        that.open();
      }
    }, 100);


    var signupPromotionAnsweredCount = 0;

    googleExperiments.getVariation().then(function (variation) {
      if (variation < 0 ) {
        signupPromotionAnsweredCount = 20 * variation;
      }
    });

    events.on('questionSetFinished', function(answered_count) {
      if (signupPromotionAnsweredCount - 10 < answered_count && 
          answered_count <= signupPromotionAnsweredCount &&
          !user.getUser().username) {
        that.open();
      }
    });

    return that;
  }]);
})();

