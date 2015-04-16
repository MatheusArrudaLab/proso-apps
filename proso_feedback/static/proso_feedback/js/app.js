(function() {
  'use strict';
  /* Controllers */
  angular.module('proso.feedback', ['ui.bootstrap'])

  .value('gettext', window.gettext || function(x){return x;})

  .filter('trans',['gettext', function(gettext) {
    return function(msgid) {
      return gettext(msgid);
    };
  }])

  .directive('feedback', ['$modal', '$window', 'gettext',
      function ($modal, $window, gettext) {
    return {
      restrict: 'A',
      template: ' <div id="feedback">' +
                  '<a href="" class="btn btn-primary" ng-click="openFeedback()">' +
                    gettext('Napište nám') + '</a>' +
                '</div>',
      link: function ($scope, element, attrs) {

        $scope.feedback = {
          user_agent: $window.navigator.userAgent,
          email: '@',
          text: '',
        };

        $scope.openFeedback = function () {
          if (attrs.email) {
            $scope.feedback.email = attrs.email;
          }

          $modal.open({
            templateUrl: 'static/tpl/feedback_modal.html',
            controller: ModalFeedbackCtrl,
            size: 'lg',
            resolve: {
              feedback: function () {
                return $scope.feedback;
              }
            }
          });
        };

        var ModalFeedbackCtrl = ['$scope', '$modalInstance', '$http', '$cookies',
              '$location', 'feedback', 'gettext',
            function ($scope, $modalInstance, $http, $cookies,
              $location, feedback, gettext) {

          $scope.feedback = feedback;
          $scope.alerts = [];

          $scope.send = function() {
            feedback.page = $location.absUrl();
            $http.defaults.headers.post['X-CSRFToken'] = $cookies.csrftoken;
            $http.post('/feedback/', feedback).success(function(data){
              $scope.alerts.push({
                type : 'success',
                msg : gettext('Feedback jsme přijali. Děkujeme Vám za zaslané informace. Feedback od uživatelů je k nezaplacení.'),
              });
              $scope.sending = false;
              feedback.text = '';
            }).error(function(){
              $scope.alerts.push({
                type : 'danger',
                msg : gettext("V aplikaci bohužel nastala chyba."),
              });
              $scope.sending = false;
            });
            $scope.sending = true;
          };

          $scope.closeAlert = function(index) {
            $scope.alerts.splice(index, 1);
          };

          $scope.cancel = function () {
            $modalInstance.dismiss('cancel');
          };
        }];

      }
    };
  }])

  .directive('ratingModal', ['$modal', '$window', 'events', '$routeParams', '$timeout',
      function ($modal, $window, events, $routeParams, $timeout) {
    return {
      restrict: 'A',
      link: function ($scope, element, attrs) {

        var ModalRatingCtrl = ['$scope', '$modalInstance', '$http', '$cookies',
              '$location', 'gettext',
            function ($scope, $modalInstance, $http, $cookies,
              $location, gettext) {

          $scope.alerts = [];

          $scope.vote = function(answer) {
            $scope.answer = answer;
            $http.defaults.headers.post['X-CSRFToken'] = $cookies.csrftoken;
            $http.post('/feedback/rating', {'value': answer}).success(function(data){
              $scope.alerts.push({
                type : 'success',
                msg : gettext('Děkujeme za hodnocení'),
              });
              $scope.sending = false;
            }).error(function(){
              $scope.alerts.push({
                type : 'danger',
                msg : gettext("V aplikaci bohužel nastala chyba."),
              });
              $scope.sending = false;
            });
            $scope.sending = true;
          };

          $scope.closeAlert = function(index) {
            $scope.alerts.splice(index, 1);
            $modalInstance.dismiss('cancel');
          };

          $scope.cancel = function () {
            $modalInstance.dismiss('cancel');
          };
        }];


        $scope.ratingPoll = function () {
          $modal.open({
            templateUrl: 'static/tpl/rating_modal.html',
            controller: ModalRatingCtrl,
          });
        };

        $timeout(function() {
          if ($routeParams.debugrating) {
            $scope.ratingPoll();
          }
        }, 100);

        var checkPoints = [30, 70, 120, 200];
        events.on('questionSetFinished', function(answered_count) {
          angular.forEach(checkPoints, function(checkPoint) {
            if (checkPoint - 10 < answered_count && answered_count <= checkPoint) {
              $scope.ratingPoll();
            }
          });
        });
      }
    };
  }]);

})();
