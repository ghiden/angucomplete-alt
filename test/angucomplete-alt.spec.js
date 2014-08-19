'use strict';

describe('angucomplete-alt', function() {
  var $compile, $scope, $timeout;
  var KEY_DW  = 40,
      KEY_UP  = 38,
      KEY_ES  = 27,
      KEY_EN  = 13,
      KEY_DEL = 46,
      KEY_TAB =  9,
      KEY_BS  =  8;

  beforeEach(module('angucomplete-alt'));

  beforeEach(inject(function(_$compile_, $rootScope, _$timeout_) {
    $compile = _$compile_;
    $scope = $rootScope.$new();
    $timeout = _$timeout_;
  }));

  describe('Render', function() {

    it('should render input element with given id plus _value', function() {
      var element = angular.element('<div angucomplete-alt id="ex1" selected-object="selectedCountry" title-field="name"></div>');
      $scope.selectedCountry = null;
      $compile(element)($scope);
      $scope.$digest();
      expect(element.find('#ex1_value').length).toBe(1);
    });

    it('should render planceholder string', function() {
      var element = angular.element('<div angucomplete-alt id="ex1" placeholder="Search countries" selected-object="selectedCountry" local-data="countries" search-fields="name" title-field="name"/>');
      $scope.selectedCountry = null;
      $compile(element)($scope);
      $scope.$digest();
      expect(element.find('#ex1_value').attr('placeholder')).toEqual('Search countries');
    });

  });

  describe('Local data', function() {

    it('should show search results after 3 letter is entered', function() {
      var element = angular.element('<div angucomplete-alt id="ex1" placeholder="Search countries" selected-object="selectedCountry" local-data="countries" search-fields="name" title-field="name"/>');
      $scope.selectedCountry = undefined;
      $scope.countries = [
        {name: 'Afghanistan', code: 'AF'},
        {name: 'Aland Islands', code: 'AX'},
        {name: 'Albania', code: 'AL'}
      ];
      $compile(element)($scope);
      $scope.$digest();
      var inputField = element.find('#ex1_value');
      var e = $.Event('keyup');

      e.which = 97; // letter: a
      inputField.val('a');
      inputField.trigger('input');
      inputField.trigger(e);
      expect(element.find('.angucomplete-row').length).toBe(0);

      e.which = 108; // letter: l
      inputField.val('al');
      inputField.trigger('input');
      inputField.trigger(e);
      expect(element.find('.angucomplete-row').length).toBe(0);

      e.which = 98; // letter: b
      inputField.val('alb');
      inputField.trigger('input');
      inputField.trigger(e);
      $timeout.flush();
      expect(element.find('.angucomplete-row').length).toBeGreaterThan(0);
    });

    it('should show search results after 1 letter is entered with minlength being set to 1', function() {
      var element = angular.element('<div angucomplete-alt id="ex1" placeholder="Search countries" selected-object="selectedCountry" local-data="countries" search-fields="name" title-field="name" minlength="1"/>');
      $scope.selectedCountry = undefined;
      $scope.countries = [
        {name: 'Afghanistan', code: 'AF'},
        {name: 'Aland Islands', code: 'AX'},
        {name: 'Albania', code: 'AL'}
      ];
      $compile(element)($scope);
      $scope.$digest();
      var inputField = element.find('#ex1_value');
      var e = $.Event('keyup');
      e.which = 97; // letter: a
      inputField.val('a');
      inputField.trigger('input');
      inputField.trigger(e);
      $timeout.flush();
      expect(element.find('.angucomplete-row').length).toBeGreaterThan(0);
    });

    it('should reset selectedObject to undefined when input changes', function() {
      var element = angular.element('<div angucomplete-alt id="ex1" placeholder="Search countries" selected-object="selectedCountry" local-data="countries" search-fields="name" title-field="name" minlength="1"/>');
      $scope.selectedCountry = undefined;
      $scope.countries = [
        {name: 'Afghanistan', code: 'AF'},
        {name: 'Aland Islands', code: 'AX'},
        {name: 'Albania', code: 'AL'}
      ];
      $compile(element)($scope);
      $scope.$digest();

      var inputField = element.find('#ex1_value');
      var eKeyup = $.Event('keyup');
      eKeyup.which = 97; // letter: a

      inputField.val('a');
      inputField.trigger('input');
      inputField.trigger(eKeyup);
      $timeout.flush();
      expect(element.find('#ex1_dropdown').length).toBe(1);

      var eKeydown = $.Event('keydown');
      eKeydown.which = KEY_DW;
      inputField.trigger(eKeydown);

      eKeydown.which = KEY_EN;
      inputField.trigger(eKeydown);
      expect($scope.selectedCountry.originalObject).toEqual({name: 'Afghanistan', code: 'AF'});

      inputField.focus();
      inputField.val('a');
      inputField.trigger('input');
      inputField.trigger(eKeyup);
      $timeout.flush();
      expect($scope.selectedCountry).toBeUndefined();
    });
  });

  describe('processResults', function() {

    it('should set scope.results[0].title', function() {
      var element = angular.element('<div angucomplete-alt id="ex1" placeholder="Search names" selected-object="selected" local-data="names" search-fields="name" title-field="name" minlength="1"/>');
      $compile(element)($scope);
      $scope.$digest();

      var name = 'John';
      var responseData = [ {name: name} ];
      element.isolateScope().processResults(responseData);
      expect(element.isolateScope().results[0].title).toBe(name);
    });

    it('should set scope.results[0].title for two title fields', function() {
      var element = angular.element('<div angucomplete-alt id="ex1" placeholder="Search names" selected-object="selected" local-data="names" search-fields="name" title-field="firstName,lastName" minlength="1"/>');
      $compile(element)($scope);
      $scope.$digest();

      var lastName = 'Doe', firstName = 'John';
      var responseData = [ {lastName: lastName, firstName: firstName} ];
      element.isolateScope().processResults(responseData);
      expect(element.isolateScope().results[0].title).toBe(firstName + ' ' + lastName);
    });

    it('should set scope.results[0].title to more than one level deep attribute', function() {
      var element = angular.element('<div angucomplete-alt id="ex1" placeholder="Search names" selected-object="selected" local-data="names" search-fields="name" title-field="name.first,name.last" minlength="1"/>');
      $compile(element)($scope);
      $scope.$digest();

      var first = 'John';
      var last = 'Doe';
      var responseData = [
        {
          name: {
            first: first,
            last: last
          }
        }
      ];
      element.isolateScope().processResults(responseData);
      expect(element.isolateScope().results[0].title).toBe(first + ' ' + last);
    });

    it('should set scope.results[0].description', function() {
      var element = angular.element('<div angucomplete-alt id="ex1" placeholder="Search names" selected-object="selected" local-data="names" search-fields="name" title-field="name" description-field="desc" minlength="1"/>');
      $compile(element)($scope);
      $scope.$digest();

      var description = 'blah blah blah';
      var responseData = [ {name: 'John', desc: description} ];
      element.isolateScope().processResults(responseData);
      expect(element.isolateScope().results[0].description).toBe(description);
    });

    it('should set scope.results[0].description to more than one level deep attribute', function() {
      var element = angular.element('<div angucomplete-alt id="ex1" placeholder="Search names" selected-object="selected" local-data="names" search-fields="name" title-field="name" description-field="desc.short" minlength="1"/>');
      $compile(element)($scope);
      $scope.$digest();

      var desc = 'short desc...';
      var responseData = [
        {
          name: 'John',
          desc: {
            long: 'very very long description...',
            short: desc
          }
        }
      ];
      element.isolateScope().processResults(responseData);
      expect(element.isolateScope().results[0].description).toBe(desc);
    });

    it('should set scope.results[0].image', function() {
      var element = angular.element('<div angucomplete-alt id="ex1" placeholder="Search names" selected-object="selected" local-data="names" search-fields="name" title-field="name" image-field="pic" minlength="1"/>');
      $compile(element)($scope);
      $scope.$digest();

      var image = 'some pic';
      var responseData = [ {name: 'John', pic: image} ];
      element.isolateScope().processResults(responseData);
      expect(element.isolateScope().results[0].image).toBe(image);
    });

    it('should set scope.results[0].image to more than one level deep attribute', function() {
      var element = angular.element('<div angucomplete-alt id="ex1" placeholder="Search names" selected-object="selected" local-data="names" search-fields="name" title-field="name" image-field="pic.small" minlength="1"/>');
      $compile(element)($scope);
      $scope.$digest();

      var image = 'small pic';
      var responseData = [
        {
          name: 'John',
          pic: {
            large: 'large pic',
            mid: 'medium pic',
            small: image
          }
        }
      ];
      element.isolateScope().processResults(responseData);
      expect(element.isolateScope().results[0].image).toBe(image);
    });
  });

  describe('searchTimerComplete', function() {

    describe('local data', function() {
      it('should set $scope.searching to false and call $scope.processResults', function() {
        var element = angular.element('<div angucomplete-alt id="ex1" placeholder="Search countries" selected-object="selectedCountry" local-data="countries" search-fields="name" title-field="name" minlength="1"/>');
        $scope.selectedCountry = undefined;
        $scope.countries = [
          {name: 'Afghanistan', code: 'AF'},
          {name: 'Aland Islands', code: 'AX'},
          {name: 'Albania', code: 'AL'}
        ];
        $compile(element)($scope);
        $scope.$digest();

        var queryTerm = 'al';
        spyOn(element.isolateScope(), 'processResults');
        element.isolateScope().searchTimerComplete(queryTerm);
        expect(element.isolateScope().processResults).toHaveBeenCalledWith($scope.countries.slice(1,3), queryTerm);
      });
    });

    describe('remote API', function() {

      it('should call $http with given url and param', inject(function($httpBackend) {
        var element = angular.element('<div angucomplete-alt id="ex1" placeholder="Search names" selected-object="selected" remote-url="names?q=" search-fields="name" remote-url-data-field="data" title-field="name" minlength="1"/>');
        $compile(element)($scope);
        $scope.$digest();

        var queryTerm = 'john';
        var results = {data: [{name: 'john'}]};
        spyOn(element.isolateScope(), 'processResults');
        $httpBackend.expectGET('names?q=' + queryTerm).respond(200, results);
        element.isolateScope().searchTimerComplete(queryTerm);
        $httpBackend.flush();
        $httpBackend.verifyNoOutstandingExpectation();
        $httpBackend.verifyNoOutstandingRequest();
      }));

      it('should set $scope.searching to false and call $scope.processResults after success', inject(function($httpBackend) {
        var element = angular.element('<div angucomplete-alt id="ex1" placeholder="Search names" selected-object="selected" remote-url="names?q=" search-fields="name" remote-url-data-field="data" title-field="name" minlength="1"/>');
        $compile(element)($scope);
        $scope.$digest();

        var queryTerm = 'john';
        var results = {data: [{name: 'john'}]};
        spyOn(element.isolateScope(), 'processResults');
        $httpBackend.expectGET('names?q=' + queryTerm).respond(200, results);
        element.isolateScope().searchTimerComplete(queryTerm);
        $httpBackend.flush();
        $httpBackend.verifyNoOutstandingExpectation();
        $httpBackend.verifyNoOutstandingRequest();
        expect(element.isolateScope().processResults).toHaveBeenCalledWith(results.data, queryTerm);
        expect(element.isolateScope().searching).toBe(false);
      }));

      it('should call $scope.processResults with more than one level deep of data attribute', inject(function($httpBackend) {
        var element = angular.element('<div angucomplete-alt id="ex1" placeholder="Search names" selected-object="selected" remote-url="names?q=" search-fields="name" remote-url-data-field="search.data" title-field="name" minlength="1"/>');
        $compile(element)($scope);
        $scope.$digest();

        var queryTerm = 'john';
        var results = {
          meta: {
            offset: 0,
            total: 1
          },
          search: {
            seq_id: 1234567890,
            data: [
              {name: 'john'}
            ]
          }
        };
        spyOn(element.isolateScope(), 'processResults');
        $httpBackend.expectGET('names?q=' + queryTerm).respond(200, results);
        element.isolateScope().searchTimerComplete(queryTerm);
        $httpBackend.flush();
        $httpBackend.verifyNoOutstandingExpectation();
        $httpBackend.verifyNoOutstandingRequest();
        expect(element.isolateScope().processResults).toHaveBeenCalledWith(results.search.data, queryTerm);
        expect(element.isolateScope().processResults.mostRecentCall.args[0]).toEqual(results.search.data);
        expect(element.isolateScope().searching).toBe(false);
      }));

      it('should not throw an exception when match-class is set and remote api returns bogus results (issue #2)', inject(function($httpBackend) {
        var element = angular.element('<div angucomplete-alt id="ex1" placeholder="Search names" selected-object="selected" remote-url="names?q=" search-fields="name" remote-url-data-field="data" title-field="name" description="type" minlength="1" match-class="highlight"/>');
        $compile(element)($scope);
        $scope.$digest();

        var results = {data: [{name: 'tim', type: 'A'}]};
        $httpBackend.expectGET('names?q=a').respond(200, results);

        var inputField = element.find('#ex1_value');
        var e = $.Event('keyup');
        e.which = 97; // letter: a

        inputField.val('a');
        inputField.trigger('input');
        inputField.trigger(e);
        $timeout.flush();
        $httpBackend.flush();

        $httpBackend.verifyNoOutstandingExpectation();
        $httpBackend.verifyNoOutstandingRequest();
        expect(element.isolateScope().searching).toBe(false);
      }));

      it('should call error callback when it is given', inject(function($httpBackend) {
        var element = angular.element('<div angucomplete-alt id="ex1" placeholder="Search names" selected-object="selected" remote-url="names?q=" search-fields="name" remote-url-data-field="data" remote-url-error-callback="errorCallback" title-field="name" minlength="1"/>');
        $scope.errorCallback = jasmine.createSpy('errorCallback');
        $compile(element)($scope);
        $scope.$digest();

        var queryTerm = 'john';
        var results = {data: [{name: 'john'}]};
        spyOn(element.isolateScope(), 'processResults');
        $httpBackend.expectGET('names?q=' + queryTerm).respond(500, 'Internal server error');
        element.isolateScope().searchTimerComplete(queryTerm);
        $httpBackend.flush();
        expect($scope.errorCallback).toHaveBeenCalled();
        $httpBackend.verifyNoOutstandingExpectation();
        $httpBackend.verifyNoOutstandingRequest();
      }));

    });
  });

  describe('custom data function for ajax request', function() {
    it('should call the custom data function for ajax request if it is given', inject(function($httpBackend) {
      var element = angular.element('<div angucomplete-alt id="ex1" placeholder="Search names" selected-object="selected" remote-url="names" search-fields="name" remote-url-data-field="data" remote-url-request-formatter="dataFormatFn" title-field="name" minlength="1"/>');
      var sequenceNum = 1234567890;
      $scope.dataFormatFn = function(str) {
        return {q: str, sequence: sequenceNum};
      };
      $compile(element)($scope);
      $scope.$digest();

      var queryTerm = 'john';
      var results = {data: [{name: 'john'}]};
      spyOn(element.isolateScope(), 'processResults');
      $httpBackend.expectGET('names?q=' + queryTerm + '&sequence=' + sequenceNum).respond(200, results);
      element.isolateScope().searchTimerComplete(queryTerm);
      $httpBackend.flush();
      $httpBackend.verifyNoOutstandingExpectation();
      $httpBackend.verifyNoOutstandingRequest();
    }));
  });

  describe('custom data formatter function for ajax response', function() {
    it('should not run response data through formatter if not given', inject(function($httpBackend) {
      var element = angular.element('<div angucomplete-alt id="ex1" placeholder="Search names" selected-object="selected" remote-url="names?q=" search-fields="first" remote-url-data-field="data" title-field="name" minlength="1"/>');
      $compile(element)($scope);
      $scope.$digest();

      var queryTerm = 'john';
      var results = {data: [{first: 'John', last: 'Doe'}]};
      spyOn(element.isolateScope(), 'processResults');
      $httpBackend.expectGET('names?q=' + queryTerm).respond(200, results);
      element.isolateScope().searchTimerComplete(queryTerm);
      $httpBackend.flush();
      $httpBackend.verifyNoOutstandingExpectation();
      $httpBackend.verifyNoOutstandingRequest();
      expect(element.isolateScope().processResults).toHaveBeenCalledWith([{first: 'John', last: 'Doe'}], queryTerm);
    }));

    it('should run response data through formatter if given', inject(function($httpBackend) {
      var element = angular.element('<div angucomplete-alt id="ex1" placeholder="Search names" selected-object="selected" remote-url-response-formatter="dataConverter" remote-url="names?q=" search-fields="name" remote-url-data-field="data" title-field="name" minlength="1"/>');
      $scope.dataConverter = function(rawData) {
        var data = rawData.data;
        for (var i = 0; i < data.length; i++) {
          data[i].name = data[i].last + ', ' + data[i].first;
        }
        return rawData;
      };
      $compile(element)($scope);
      $scope.$digest();

      var queryTerm = 'john';
      var results = {data: [{first: 'John', last: 'Doe'}]};
      spyOn(element.isolateScope(), 'processResults');
      $httpBackend.expectGET('names?q=' + queryTerm).respond(200, results);
      element.isolateScope().searchTimerComplete(queryTerm);
      $httpBackend.flush();
      $httpBackend.verifyNoOutstandingExpectation();
      $httpBackend.verifyNoOutstandingRequest();
      expect(element.isolateScope().processResults).toHaveBeenCalledWith([{first: 'John', last: 'Doe', name: 'Doe, John'}], queryTerm);
    }));
  });

  describe('clear result', function() {
    it('should clear input when clear-selected is true', function() {
      var element = angular.element('<div angucomplete-alt id="ex1" placeholder="Search countries" selected-object="selectedCountry" local-data="countries" search-fields="name" title-field="name" minlength="1" clear-selected="true"/>');
      $scope.selectedCountry = undefined;
      $scope.countries = [
        {name: 'Afghanistan', code: 'AF'},
        {name: 'Aland Islands', code: 'AX'},
        {name: 'Albania', code: 'AL'}
      ];
      $compile(element)($scope);
      $scope.$digest();

      var inputField = element.find('#ex1_value');
      var eKeyup = $.Event('keyup');
      eKeyup.which = 97; // letter: a

      inputField.val('a');
      inputField.trigger('input');
      inputField.trigger(eKeyup);
      $timeout.flush();
      expect(element.find('#ex1_dropdown').length).toBe(1);

      var eKeydown = $.Event('keydown');
      eKeydown.which = KEY_DW;
      inputField.trigger(eKeydown);
      expect(element.isolateScope().currentIndex).toBe(0);

      eKeydown.which = KEY_EN;
      inputField.trigger(eKeydown);
      expect($scope.selectedCountry.originalObject).toEqual({name: 'Afghanistan', code: 'AF'});

      expect(element.isolateScope().searchStr).toBe(null);
    });
  });

  describe('blur', function() {
    it('should hide dropdown when focus is lost', function() {
      var element = angular.element('<div angucomplete-alt id="ex1" placeholder="Search countries" selected-object="selectedCountry" local-data="countries" search-fields="name" title-field="name" minlength="1" clear-selected="true"/>');
      $scope.selectedCountry = undefined;
      $scope.countries = [
        {name: 'Afghanistan', code: 'AF'},
        {name: 'Aland Islands', code: 'AX'},
        {name: 'Albania', code: 'AL'}
      ];
      $compile(element)($scope);
      $scope.$digest();

      var inputField = element.find('#ex1_value');
      var e = $.Event('keyup');
      e.which = 97; // letter: a

      inputField.val('a');
      inputField.trigger('input');
      inputField.trigger(e);
      $timeout.flush();
      expect(element.find('#ex1_dropdown').length).toBe(1);

      inputField.blur();
      expect(element.find('#ex1_dropdown').length).toBe(1);
      $timeout.flush();
      expect(element.find('#ex1_dropdown').length).toBe(0);
    });

    it('should cancel hiding the dropdown if it happens within pause period', function() {
      var element = angular.element('<div angucomplete-alt id="ex1" placeholder="Search countries" selected-object="selectedCountry" local-data="countries" search-fields="name" title-field="name" minlength="1" clear-selected="true"/>');
      $scope.selectedCountry = undefined;
      $scope.countries = [
        {name: 'Afghanistan', code: 'AF'},
        {name: 'Aland Islands', code: 'AX'},
        {name: 'Albania', code: 'AL'}
      ];
      $compile(element)($scope);
      $scope.$digest();

      var inputField = element.find('#ex1_value');
      var e = $.Event('keyup');
      e.which = 97; // letter: a

      inputField.val('a');
      inputField.trigger('input');
      inputField.trigger(e);
      $timeout.flush();
      expect(element.find('#ex1_dropdown').length).toBe(1);

      inputField.blur();
      expect(element.find('#ex1_dropdown').length).toBe(1);
      inputField.focus();
      $timeout.flush();
      expect(element.find('#ex1_dropdown').length).toBe(0);
    });
  });

  describe('TAB for selecting', function() {
    it('should select the first suggestion when TAB is pressed', function() {
      var element = angular.element('<div angucomplete-alt id="ex1" placeholder="Search countries" selected-object="selectedCountry" local-data="countries" search-fields="name" title-field="name" minlength="1" override-suggestions="true"/>');
      $scope.selectedCountry = undefined;
      $scope.countries = [
        {name: 'Afghanistan', code: 'AF'},
        {name: 'Aland Islands', code: 'AX'},
        {name: 'Albania', code: 'AL'}
      ];
      $compile(element)($scope);
      $scope.$digest();

      var inputField = element.find('#ex1_value');
      var e = $.Event('keyup');
      e.which = 97; // letter: a

      inputField.val('a');
      inputField.trigger('input');
      inputField.trigger(e);
      $timeout.flush();
      expect(element.find('#ex1_dropdown').length).toBe(1);

      var eKeydown = $.Event('keydown');
      eKeydown.which = KEY_TAB;
      inputField.trigger(eKeydown);
      expect($scope.selectedCountry.originalObject).toEqual($scope.countries[0]);
    });
  });

  describe('override suggestions', function() {
    it('should override suggestions when enter is pressed but no suggestion is selected', function() {
      var element = angular.element('<div angucomplete-alt id="ex1" placeholder="Search countries" selected-object="selectedCountry" local-data="countries" search-fields="name" title-field="name" minlength="1" override-suggestions="true"/>');
      $scope.selectedCountry = undefined;
      $scope.countries = [
        {name: 'Afghanistan', code: 'AF'},
        {name: 'Aland Islands', code: 'AX'},
        {name: 'Albania', code: 'AL'}
      ];
      $compile(element)($scope);
      $scope.$digest();

      var inputField = element.find('#ex1_value');
      var e = $.Event('keyup');
      e.which = 97; // letter: a

      inputField.val('abc');
      inputField.trigger('input');
      inputField.trigger(e);
      $timeout.flush();
      expect(element.find('#ex1_dropdown').length).toBe(1);

      var eKeydown = $.Event('keydown');
      eKeydown.which = KEY_EN;
      inputField.trigger(eKeydown);
      expect($scope.selectedCountry.originalObject).toEqual('abc');
      inputField.blur();
      expect(element.find('#ex1_dropdown').length).toBe(0);
    });

    it('should override suggestions when enter is pressed but no suggestion is selected also incorporate with clear-selected if it is set', function() {
      var element = angular.element('<div angucomplete-alt id="ex1" placeholder="Search countries" selected-object="selectedCountry" local-data="countries" search-fields="name" title-field="name" minlength="1" override-suggestions="true" clear-selected="true"/>');
      $scope.selectedCountry = undefined;
      $scope.countries = [
        {name: 'Afghanistan', code: 'AF'},
        {name: 'Aland Islands', code: 'AX'},
        {name: 'Albania', code: 'AL'}
      ];
      $compile(element)($scope);
      $scope.$digest();

      var inputField = element.find('#ex1_value');
      var e = $.Event('keyup');
      e.which = 97; // letter: a

      inputField.val('abc');
      inputField.trigger('input');
      inputField.trigger(e);
      $timeout.flush();
      expect(element.find('#ex1_dropdown').length).toBe(1);

      var eKeydown = $.Event('keydown');
      eKeydown.which = KEY_EN;
      inputField.trigger(eKeydown);
      expect($scope.selectedCountry.originalObject).toEqual('abc');
      inputField.blur();
      expect(element.find('#ex1_dropdown').length).toBe(0);

      expect(element.isolateScope().searchStr).toBe(null);
    });
  });

  describe('selectedObject callback', function() {
    it('should call selectedObject callback if given', function() {
      var element = angular.element('<div angucomplete-alt id="ex1" placeholder="Search countries" selected-object="countrySelected" local-data="countries" search-fields="name" title-field="name" minlength="1"/>');
      var selected = false;
      $scope.countrySelected = function(value) {
        selected = true;
      };
      $scope.countries = [
        {name: 'Afghanistan', code: 'AF'},
        {name: 'Aland Islands', code: 'AX'},
        {name: 'Albania', code: 'AL'}
      ];
      $compile(element)($scope);
      $scope.$digest();

      expect(selected).toBe(false);
      var inputField = element.find('#ex1_value');
      var eKeyup = $.Event('keyup');
      eKeyup.which = 97; // letter: a

      inputField.val('a');
      inputField.trigger('input');
      inputField.trigger(eKeyup);
      $timeout.flush();
      expect(element.find('#ex1_dropdown').length).toBe(1);

      var eKeydown = $.Event('keydown');
      eKeydown.which = KEY_DW;
      inputField.trigger(eKeydown);
      expect(element.isolateScope().currentIndex).toBe(0);

      eKeydown.which = KEY_EN;
      inputField.trigger(eKeydown);
      expect(selected).toBe(true);
    });
  });

  describe('require field', function() {
    it('should add a class ng-invalid-autocomplete-required when initialized', function() {
      var element = angular.element('<form name="form"><div angucomplete-alt id="ex1" placeholder="Search countries" selected-object="countrySelected" local-data="countries" search-fields="name" title-field="name" minlength="1" field-required="true"/></form>');
      $scope.countries = [
        {name: 'Afghanistan', code: 'AF'},
        {name: 'Aland Islands', code: 'AX'},
        {name: 'Albania', code: 'AL'}
      ];
      $compile(element)($scope);
      $scope.$digest();

      expect(element.hasClass('ng-invalid-autocomplete-required')).toBe(true);
    });

    it('should add a class ng-invalid-autocomplete-required when selection is made', function() {
      var element = angular.element('<form name="form"><div angucomplete-alt id="ex1" placeholder="Search countries" selected-object="countrySelected" local-data="countries" search-fields="name" title-field="name" minlength="1" field-required="true"/></form>');
      $scope.countrySelected = null;
      $scope.countries = [
        {name: 'Afghanistan', code: 'AF'},
        {name: 'Aland Islands', code: 'AX'},
        {name: 'Albania', code: 'AL'}
      ];
      $compile(element)($scope);
      $scope.$digest();

      expect(element.hasClass('ng-invalid-autocomplete-required')).toBe(true);

      var inputField = element.find('#ex1_value');
      var eKeyup = $.Event('keyup');
      eKeyup.which = 97; // letter: a

      inputField.val('a');
      inputField.trigger('input');
      inputField.trigger(eKeyup);
      $timeout.flush();
      expect(element.find('.angucomplete-row').length).toBe(3);

      // make a selection
      var eKeydown = $.Event('keydown');
      eKeydown.which = KEY_DW;
      inputField.trigger(eKeydown);
      eKeydown.which = KEY_EN;
      inputField.trigger(eKeydown);
      expect(element.hasClass('ng-invalid-autocomplete-required')).toBe(false);
      expect($scope.countrySelected).toBeDefined();

      // delete a char
      inputField.focus();
      eKeyup.which = KEY_DEL;
      inputField.val('Afghanista');
      inputField.trigger('input');
      inputField.trigger(eKeyup);
      $timeout.flush();
      expect(element.hasClass('ng-invalid-autocomplete-required')).toBe(true);
      expect(element.find('.angucomplete-row').length).toBe(1);
      expect($scope.countrySelected).toBeUndefined();

      // make a selection again
      eKeydown.which = KEY_DW;
      inputField.trigger(eKeydown);
      eKeydown.which = KEY_EN;
      inputField.trigger(eKeydown);
      expect(element.hasClass('ng-invalid-autocomplete-required')).toBe(false);
      expect($scope.countrySelected).toBeDefined();
    });
  });
});
