/*
 * angucomplete-alt
 * Autocomplete directive for AngularJS
 * This is a fork of Daryl Rowland's angucomplete with some extra features.
 * By Hidenari Nozaki
 */

/*! Copyright (c) 2014 Hidenari Nozaki and contributors | Licensed under the MIT license */

'use strict';

angular.module('angucomplete-alt', [] ).directive('angucompleteAlt', ['$q', '$parse', '$http', '$sce', '$timeout', function ($q, $parse, $http, $sce, $timeout) {
  // keyboard events
  var KEY_DW  = 40;
  var KEY_RT  = 39;
  var KEY_UP  = 38;
  var KEY_LF  = 37;
  var KEY_ES  = 27;
  var KEY_EN  = 13;
  var KEY_BS  =  8;
  var KEY_DEL = 46;
  var KEY_TAB =  9;

  var MIN_LENGTH = 3;
  var PAUSE = 500;
  var BLUR_TIMEOUT = 200;

  // string constants
  var REQUIRED_CLASS = 'autocomplete-required';
  var TEXT_SEARCHING = 'Searching...';
  var TEXT_NORESULTS = 'No results found';

  return {
    restrict: 'EA',
    require: '^?form',
    scope: {
      selectedObject: '=',
      disableInput: '=',
      initialValue: '@',
      localData: '=',
      remoteUrlRequestFormatter: '=',
      remoteUrlResponseFormatter: '=',
      remoteUrlErrorCallback: '=',
      id: '@',
      placeholder: '@',
      remoteUrl: '@',
      remoteUrlDataField: '@',
      titleField: '@',
      descriptionField: '@',
      imageField: '@',
      inputClass: '@',
      pause: '@',
      searchFields: '@',
      minlength: '@',
      matchClass: '@',
      clearSelected: '@',
      overrideSuggestions: '@',
      fieldRequired: '@',
      fieldRequiredClass: '@',
      inputChanged: '=',
      autoMatch: '@',
      focusOut: '&',
      focusIn: '&'
    },
    template:
      '<div class="angucomplete-holder">' +
      '  <input id="{{id}}_value" ng-model="searchStr" ng-disabled="disableInput" type="text" placeholder="{{placeholder}}" ng-focus="onFocusHandler()" class="{{inputClass}}" ng-focus="resetHideResults()" ng-blur="hideResults()" autocapitalize="off" autocorrect="off" autocomplete="off" ng-change="inputChangeHandler(searchStr)"/>' +
      '  <div id="{{id}}_dropdown" class="angucomplete-dropdown" ng-if="showDropdown">' +
      '    <div class="angucomplete-searching" ng-show="searching" ng-bind="textSearching"></div>' +
      '    <div class="angucomplete-searching" ng-show="!searching && (!results || results.length == 0)" ng-bind="textNoResults"></div>' +
      '    <div class="angucomplete-row" ng-repeat="result in results" ng-click="selectResult(result)" ng-mouseover="hoverRow($index)" ng-class="{\'angucomplete-selected-row\': $index == currentIndex}">' +
      '      <div ng-if="imageField" class="angucomplete-image-holder">' +
      '        <img ng-if="result.image && result.image != \'\'" ng-src="{{result.image}}" class="angucomplete-image"/>' +
      '        <div ng-if="!result.image && result.image != \'\'" class="angucomplete-image-default"></div>' +
      '      </div>' +
      '      <div class="angucomplete-title" ng-if="matchClass" ng-bind-html="result.title"></div>' +
      '      <div class="angucomplete-title" ng-if="!matchClass">{{ result.title }}</div>' +
      '      <div ng-if="matchClass && result.description && result.description != \'\'" class="angucomplete-description" ng-bind-html="result.description"></div>' +
      '      <div ng-if="!matchClass && result.description && result.description != \'\'" class="angucomplete-description">{{result.description}}</div>' +
      '    </div>' +
      '  </div>' +
      '</div>',
    link: function(scope, elem, attrs, ctrl) {
      var inputField = elem.find('input');
      var minlength = MIN_LENGTH;
      var searchTimer = null;
      var hideTimer;
      var requiredClassName = REQUIRED_CLASS;
      var responseFormatter;
      var validState = null;
      var httpCanceller = null;

      scope.currentIndex = null;
      scope.searching = false;
      scope.searchStr = scope.initialValue;
      scope.$watch('initialValue', function(){
        scope.searchStr = scope.initialValue;
      });

      // for IE8 quirkiness about event.which
      function ie8EventNormalizer(event) {
        return event.which ? event.which : event.keyCode;
      }

      function callOrAssign(value) {
        if (typeof scope.selectedObject === 'function') {
          scope.selectedObject(value);
        }
        else {
          scope.selectedObject = value;
        }

        handleRequired(true);
      }

      function callFunctionOrIdentity(fn) {
        return function(data) {
          return scope[fn] ? scope[fn](data) : data;
        };
      }

      function setInputString(str) {
        callOrAssign({originalObject: str});

        if (scope.clearSelected) {
          scope.searchStr = null;
        }
        clearResults();
      }

      function extractTitle(data) {
        // split title fields and run extractValue for each and join with ' '
        return scope.titleField.split(',')
          .map(function(field) {
            return extractValue(data, field);
          })
          .join(' ');
      }

      function extractValue(obj, key) {
        var keys, result;
        if (key) {
          keys= key.split('.');
          result = obj;
          keys.forEach(function(k) { result = result[k]; });
        }
        else {
          result = obj;
        }
        return result;
      }

      function findMatchString(target, str) {
        var result, matches, re = new RegExp(str, 'i');
        if (!target) { return; }
        matches = target.match(re);
        if (matches) {
          result = target.replace(re,
              '<span class="'+ scope.matchClass +'">'+ matches[0] +'</span>');
        }
        else {
          result = target;
        }
        return $sce.trustAsHtml(result);
      }

      function handleRequired(valid) {
        validState = scope.searchStr;
        if (scope.fieldRequired && ctrl) {
          ctrl.$setValidity(requiredClassName, valid);
        }
      }

      function keyupHandler(event) {
        var which = ie8EventNormalizer(event);
        if (which === KEY_LF || which === KEY_RT) {
          // do nothing
          return;
        }

        if (which === KEY_UP || which === KEY_EN) {
          event.preventDefault();
        }
        else if (which === KEY_DW) {
          event.preventDefault();
          if (!scope.showDropdown && scope.searchStr.length >= minlength) {
            initResults();
            scope.searching = true;
            scope.searchTimerComplete(scope.searchStr);
          }
        }
        else if (which === KEY_ES) {
          clearResults();
          scope.$apply();
        }
        else {
          if (!scope.searchStr || scope.searchStr === '') {
            scope.showDropdown = false;
          } else if (scope.searchStr.length >= minlength) {
            initResults();

            if (searchTimer) {
              $timeout.cancel(searchTimer);
            }

            scope.searching = true;

            searchTimer = $timeout(function() {
              scope.searchTimerComplete(scope.searchStr);
            }, scope.pause);
          }

          if (validState && validState !== scope.searchStr) {
            callOrAssign(undefined);
            handleRequired(false);
          }
        }
      }

      function handleOverrideSuggestions(event) {
        if (scope.overrideSuggestions) {
          if (!(scope.selectedObject && scope.selectedObject.originalObject === scope.searchStr)) {
            event.preventDefault();
            setInputString(scope.searchStr);
          }
        }
      }

      function keydownHandler(event) {
        var which = ie8EventNormalizer(event);
        if (which === KEY_EN && scope.results) {
          if (scope.currentIndex >= 0 && scope.currentIndex < scope.results.length) {
            event.preventDefault();
            scope.selectResult(scope.results[scope.currentIndex]);
          } else {
            handleOverrideSuggestions(event);
            clearResults();
          }
          scope.$apply();
        } else if (which === KEY_DW && scope.results) {
          event.preventDefault();
          if ((scope.currentIndex + 1) < scope.results.length) {
            scope.$apply(function() {
              scope.currentIndex ++;
            });
          }
        } else if (which === KEY_UP && scope.results) {
          event.preventDefault();
          if (scope.currentIndex >= 1) {
            scope.$apply(function() {
              scope.currentIndex --;
            });
          }
        } else if (which === KEY_TAB && scope.results && scope.results.length > 0) {
          if (scope.currentIndex === -1 && scope.showDropdown) {
            scope.selectResult(scope.results[0]);
            scope.$apply();
          }
        }
      }

      function httpSuccessCallbackGen(str) {
        return function(responseData, status, headers, config) {
          scope.searching = false;
          scope.processResults(
            extractValue(responseFormatter(responseData), scope.remoteUrlDataField),
            str);
        };
      }

      function httpErrorCallback(errorRes, status, headers, config) {
        if (status !== 0) {
          if (scope.remoteUrlErrorCallback) {
            scope.remoteUrlErrorCallback(errorRes, status, headers, config);
          }
          else {
            if (console && console.error) {
              console.error('http error');
            }
          }
        }
      }

      function cancelHttpRequest() {
        if (httpCanceller) {
          httpCanceller.resolve();
        }
      }

      function getRemoteResults(str) {
        var params = {},
            url = scope.remoteUrl + str;
        if (scope.remoteUrlRequestFormatter) {
          params = {params: scope.remoteUrlRequestFormatter(str)};
          url = scope.remoteUrl;
        }
        cancelHttpRequest();
        httpCanceller = $q.defer();
        params.timeout = httpCanceller.promise;
        $http.get(url, params)
          .success(httpSuccessCallbackGen(str))
          .error(httpErrorCallback);
      }

      function clearResults() {
        scope.showDropdown = false;
        scope.results = [];
      }

      function initResults() {
        scope.showDropdown = true;
        scope.currentIndex = -1;
        scope.results = [];
      }

      function getLocalResults(str) {
        var i, match, s,
            searchFields = scope.searchFields.split(','),
            matches = [];

        for (i = 0; i < scope.localData.length; i++) {
          match = false;

          for (s = 0; s < searchFields.length; s++) {
            match = match || (scope.localData[i][searchFields[s]].toLowerCase().indexOf(str.toLowerCase()) >= 0);
          }

          if (match) {
            matches[matches.length] = scope.localData[i];
          }
        }

        scope.searching = false;
        scope.processResults(matches, str);
      }

      function checkExactMatch(result, obj, str){
        for(var key in obj){
          if(obj[key].toLowerCase() === str.toLowerCase()){
            scope.selectResult(result);
            return;
          }
        }
      }

      scope.onFocusHandler = function() {
        if (scope.focusIn) {
          scope.focusIn();
        }
      };

      scope.hideResults = function() {
        hideTimer = $timeout(function() {
          scope.showDropdown = false;
        }, BLUR_TIMEOUT);
        cancelHttpRequest();

        if (scope.focusOut) {
          scope.focusOut();
        }
      };

      scope.resetHideResults = function() {
        if (hideTimer) {
          $timeout.cancel(hideTimer);
        }
      };

      scope.processResults = function(responseData, str) {
        var i, description, image, text, formattedText, formattedDesc;

        if (responseData && responseData.length > 0) {
          scope.results = [];

          for (i = 0; i < responseData.length; i++) {
            if (scope.titleField && scope.titleField !== '') {
              text = formattedText = extractTitle(responseData[i]);
            }

            description = '';
            if (scope.descriptionField) {
              description = formattedDesc = extractValue(responseData[i], scope.descriptionField);
            }

            image = '';
            if (scope.imageField) {
              image = extractValue(responseData[i], scope.imageField);
            }

            if (scope.matchClass) {
              formattedText = findMatchString(text, str);
              formattedDesc = findMatchString(description, str);
            }

            scope.results[scope.results.length] = {
              title: formattedText,
              description: formattedDesc,
              image: image,
              originalObject: responseData[i]
            };

            if (scope.autoMatch) {
              checkExactMatch(scope.results[scope.results.length-1],
                  {title: text, desc: description}, scope.searchStr);
            }
          }

        } else {
          scope.results = [];
        }
      };

      scope.searchTimerComplete = function(str) {
        // Begin the search
        if (str.length < minlength) {
          return;
        }
        if (scope.localData) {
          scope.$apply(function() {
            getLocalResults(str);
          });
        }
        else {
          getRemoteResults(str);
        }
      };

      scope.hoverRow = function(index) {
        scope.currentIndex = index;
      };

      scope.selectResult = function(result) {
        // Restore original values
        if (scope.matchClass) {
          result.title = extractTitle(result.originalObject);
          result.description = extractValue(result.originalObject, scope.descriptionField);
        }

        if (scope.clearSelected) {
          scope.searchStr = null;
        }
        else {
          scope.searchStr = result.title;
        }
        callOrAssign(result);
        clearResults();
      };

      scope.inputChangeHandler = function(str) {
        if (str.length < minlength) {
          clearResults();
        }
        if (scope.inputChanged) {
          str = scope.inputChanged(str);
        }
        return str;
      };

      // check required
      if (scope.fieldRequiredClass && scope.fieldRequiredClass !== '') {
        requiredClassName = scope.fieldRequiredClass;
      }

      // check min length
      if (scope.minlength && scope.minlength !== '') {
        minlength = scope.minlength;
      }

      // check pause time
      if (!scope.pause) {
        scope.pause = PAUSE;
      }

      // check clearSelected
      if (!scope.clearSelected) {
        scope.clearSelected = false;
      }

      // check override suggestions
      if (!scope.overrideSuggestions) {
        scope.overrideSuggestions = false;
      }

      // check required field
      if (scope.fieldRequired && ctrl) {
        // check initial value, if given, set validitity to true
        if (scope.initialValue) {
          handleRequired(true);
        }
        else {
          handleRequired(false);
        }
      }

      // set strings for "Searching..." and "No results"
      scope.textSearching = attrs.textSearching ? attrs.textSearching : TEXT_SEARCHING;
      scope.textNoResults = attrs.textNoResults ? attrs.textNoResults : TEXT_NORESULTS;

      // register events
      inputField.on('keydown', keydownHandler);
      inputField.on('keyup', keyupHandler);

      // set response formatter
      responseFormatter = callFunctionOrIdentity('remoteUrlResponseFormatter');
    }
  };
}]);
