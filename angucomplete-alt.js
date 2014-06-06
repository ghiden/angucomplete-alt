/*
 * angucomplete-alt
 * Autocomplete directive for AngularJS
 * This is a fork of Daryl Rowland's angucomplete with some extra features.
 * By Hidenari Nozaki
 *
 * Copyright (c) 2014 Hidenari Nozaki and contributors
 * Licensed under the MIT license
 */

'use strict';

angular.module('angucomplete-alt', [] ).directive('angucompleteAlt', ['$parse', '$http', '$sce', '$timeout', function ($parse, $http, $sce, $timeout) {
  var KEY_DW = 40,
      KEY_UP = 38,
      KEY_ES = 27,
      KEY_EN = 13,
      KEY_BS =  8,
      KEY_DEL =  46,
      MIN_LENGTH = 3,
      PAUSE = 500;

  return {
    restrict: 'EA',
    scope: {
      selectedObject: '=',
      localData: '=',
      remoteUrlRequestFormatter: '=',
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
      overrideSuggestions: '@'
    },
    template: '<div class="angucomplete-holder"><input id="{{id}}_value" ng-model="searchStr" type="text" placeholder="{{placeholder}}" class="{{inputClass}}" ng-focus="resetHideResults()" ng-blur="hideResults()"/><div id="{{id}}_dropdown" class="angucomplete-dropdown" ng-if="showDropdown"><div class="angucomplete-searching" ng-show="searching">Searching...</div><div class="angucomplete-searching" ng-show="!searching && (!results || results.length == 0)">No results found</div><div class="angucomplete-row" ng-repeat="result in results" ng-click="selectResult(result)" ng-mouseover="hoverRow()" ng-class="{\'angucomplete-selected-row\': $index == currentIndex}"><div ng-if="imageField" class="angucomplete-image-holder"><img ng-if="result.image && result.image != \'\'" ng-src="{{result.image}}" class="angucomplete-image"/><div ng-if="!result.image && result.image != \'\'" class="angucomplete-image-default"></div></div><div class="angucomplete-title" ng-if="matchClass" ng-bind-html="result.title"></div><div class="angucomplete-title" ng-if="!matchClass">{{ result.title }}</div><div ng-if="result.description && result.description != \'\'" class="angucomplete-description">{{result.description}}</div></div></div></div>',
    link: function(scope, elem, attrs) {
      var inputField,
          minlength = MIN_LENGTH,
          searchTimer = null,
          lastSearchTerm = null,
          hideTimer;

      scope.currentIndex = null;
      scope.searching = false;
      scope.searchStr = null;

      var setInputString = function(str) {
        scope.selectedObject = {originalObject: str};

        if (scope.clearSelected) {
          scope.searchStr = null;
        }
        scope.showDropdown = false;
        scope.results = [];
      };

      var isNewSearchNeeded = function(newTerm, oldTerm) {
        return newTerm.length >= minlength && newTerm !== oldTerm;
      };

      var extractValue = function(obj, key) {
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
      };

      if (scope.minlength && scope.minlength !== '') {
        minlength = scope.minlength;
      }

      if (!scope.pause) {
        scope.pause = PAUSE;
      }

      if (!scope.clearSelected) {
        scope.clearSelected = false;
      }

      if (!scope.overrideSuggestions) {
        scope.overrideSuggestions = false;
      }

      scope.hideResults = function() {
        hideTimer = $timeout(function() {
          scope.showDropdown = false;
        }, scope.pause);
      };

      scope.resetHideResults = function() {
        if (hideTimer) {
          $timeout.cancel(hideTimer);
        }
      };

      scope.processResults = function(responseData, str) {
        var titleFields, titleCode, i, t, description, image, text, re, strPart, matches;

        if (responseData && responseData.length > 0) {
          scope.results = [];

          titleFields = [];
          if (scope.titleField && scope.titleField !== '') {
            titleFields = scope.titleField.split(',');
          }

          for (i = 0; i < responseData.length; i++) {
            // Get title variables
            titleCode = [];

            for (t = 0; t < titleFields.length; t++) {
              titleCode.push(responseData[i][titleFields[t]]);
            }

            description = '';
            if (scope.descriptionField) {
              description = extractValue(responseData[i], scope.descriptionField);
            }

            image = '';
            if (scope.imageField) {
              image = extractValue(responseData[i], scope.imageField);
            }

            text = titleCode.join(' ');
            if (scope.matchClass) {
              re = new RegExp(str, 'i');
              matches = text.match(re);
              if (matches) {
                strPart = matches[0];
                text = $sce.trustAsHtml(text.replace(re, '<span class="'+ scope.matchClass +'">'+ strPart +'</span>'));
              }
              else {
                text = $sce.trustAsHtml(text);
              }
            }

            scope.results[scope.results.length] = {
              title: text,
              description: description,
              image: image,
              originalObject: responseData[i]
            };

          }


        } else {
          scope.results = [];
        }
      };

      scope.searchTimerComplete = function(str) {
        // Begin the search
        var searchFields, matches, i, match, s, params;

        if (str.length >= minlength) {
          if (scope.localData) {
            searchFields = scope.searchFields.split(',');

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

          } else if (scope.remoteUrlRequestFormatter) {
            params = scope.remoteUrlRequestFormatter(str);
            $http.get(scope.remoteUrl, {params: params}).
              success(function(responseData, status, headers, config) {
                scope.searching = false;
                scope.processResults(extractValue(responseData, scope.remoteUrlDataField), str);
              }).
            error(function(data, status, headers, config) {
              console.log('error');
            });

          } else {
            $http.get(scope.remoteUrl + str, {}).
              success(function(responseData, status, headers, config) {
                scope.searching = false;
                scope.processResults(extractValue(responseData, scope.remoteUrlDataField), str);
              }).
            error(function(data, status, headers, config) {
              console.log('error');
            });
          }
        }

      };

      scope.hoverRow = function(index) {
        scope.currentIndex = index;
      };

      scope.keyPressed = function(event) {
        if (!(event.which === KEY_UP || event.which === KEY_DW || event.which === KEY_EN)) {
          if (!scope.searchStr || scope.searchStr === '') {
            scope.showDropdown = false;
            lastSearchTerm = null;
          } else if (isNewSearchNeeded(scope.searchStr, lastSearchTerm)) {
            lastSearchTerm = scope.searchStr;
            scope.showDropdown = true;
            scope.currentIndex = -1;
            scope.results = [];

            if (searchTimer) {
              $timeout.cancel(searchTimer);
            }

            scope.searching = true;

            searchTimer = $timeout(function() {
              scope.searchTimerComplete(scope.searchStr);
            }, scope.pause);
          }
        } else {
          event.preventDefault();
        }
      };

      scope.selectResult = function(result) {
        if (scope.matchClass) {
          result.title = result.title.toString().replace(/(<([^>]+)>)/ig, '');
        }
        
        if (scope.clearSelected) {
          scope.searchStr = null;
        }
        else {
          scope.searchStr = lastSearchTerm = result.title;
        }
        scope.selectedObject = result;
        scope.showDropdown = false;
        scope.results = [];
      };

      inputField = elem.find('input');

      inputField.on('keyup', scope.keyPressed);

      elem.on('keyup', function (event) {
        if(event.which === KEY_DW && scope.results) {
          if ((scope.currentIndex + 1) < scope.results.length) {
            scope.$apply(function() {
              scope.currentIndex ++;
            });
            event.preventDefault();
          }

        } else if(event.which === KEY_UP) {
          if (scope.currentIndex >= 1) {
            scope.currentIndex --;
            scope.$apply();
            event.preventDefault();
          }

        } else if (event.which === KEY_EN && scope.results) {
          if (scope.currentIndex >= 0 && scope.currentIndex < scope.results.length) {
            scope.selectResult(scope.results[scope.currentIndex]);
            scope.$apply();
            event.preventDefault();
          } else {
            event.preventDefault();
            if (scope.overrideSuggestions) {
              setInputString(scope.searchStr);
              scope.$apply();
            }
            else {
              scope.results = [];
              scope.$apply();
            }
          }

        } else if (event.which === KEY_ES) {
          scope.results = [];
          scope.showDropdown = false;
          scope.$apply();
        } else if (event.which === KEY_BS || event.which === KEY_DEL) {
          scope.selectedObject = null;
          scope.$apply();
        }
      });
    }
  };
}]);

