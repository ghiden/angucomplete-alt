'use strict';

describe('angucomplete', function() {
  var $compile, $scope, $timeout;

  beforeEach(module('angucomplete'));

  beforeEach(inject(function(_$compile_, $rootScope, _$timeout_) {
    $compile = _$compile_;
    $scope = $rootScope.$new();
    $timeout = _$timeout_;
  }));

  describe('Render', function() {

    it('should render input element with given id plus _value', function() {
      var element = angular.element('<div angucomplete id="ex1" selectedobject="selectedCountry" titlefield="name"></div>');
      $scope.selectedCountry = null;
      $compile(element)($scope);
      $scope.$digest();
      expect(element.find('#ex1_value').length).toBe(1);
    });

    it('should render planceholder string', function() {
      var element = angular.element('<div angucomplete id="ex1" placeholder="Search countries" selectedobject="selectedCountry" localdata="countries" searchfields="name" titlefield="name"/>');
      $scope.selectedCountry = null;
      $compile(element)($scope);
      $scope.$digest();
      expect(element.find('#ex1_value').attr('placeholder')).toEqual('Search countries');
    });

  });

  describe('Local data', function() {

    it('should show search results after 3 letter is entered', function() {
      var element = angular.element('<div angucomplete id="ex1" placeholder="Search countries" selectedobject="selectedCountry" localdata="countries" searchfields="name" titlefield="name"/>');
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
      expect(element.find('#ex1_dropdown').length).toBe(0);

      inputField.val('aa');
      inputField.trigger('input');
      inputField.trigger(e);
      expect(element.find('#ex1_dropdown').length).toBe(0);

      inputField.val('aaa');
      inputField.trigger('input');
      inputField.trigger(e);
      $timeout.flush();
      expect(element.find('#ex1_dropdown').length).toBe(1);
    });

    it('should show search results after 1 letter is entered with minlength being set to 1', function() {
      var element = angular.element('<div angucomplete id="ex1" placeholder="Search countries" selectedobject="selectedCountry" localdata="countries" searchfields="name" titlefield="name" minlength="1"/>');
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
    });
  });

  describe('processResults', function() {

    it('should set $scope.results[0].title', function() {
      var element = angular.element('<div angucomplete id="ex1" placeholder="Search names" selectedobject="selected" localdata="names" searchfields="name" titlefield="name" minlength="1"/>');
      $compile(element)($scope);
      $scope.$digest();

      var name = 'John';
      var responseData = [ {name: name} ];
      element.isolateScope().processResults(responseData);
      expect(element.isolateScope().results[0].title).toBe(name);
    });

    it('should set $scope.results[0].title for two title fields', function() {
      var element = angular.element('<div angucomplete id="ex1" placeholder="Search names" selectedobject="selected" localdata="names" searchfields="name" titlefield="firstName,lastName" minlength="1"/>');
      $compile(element)($scope);
      $scope.$digest();

      var lastName = 'Doe', firstName = 'John';
      var responseData = [ {lastName: lastName, firstName: firstName} ];
      element.isolateScope().processResults(responseData);
      expect(element.isolateScope().results[0].title).toBe(firstName + ' ' + lastName);
    });

    it('should set $scope.results[0].description', function() {
      var element = angular.element('<div angucomplete id="ex1" placeholder="Search names" selectedobject="selected" localdata="names" searchfields="name" titlefield="name" descriptionfield="desc" minlength="1"/>');
      $compile(element)($scope);
      $scope.$digest();

      var description = 'blah blah blah';
      var responseData = [ {name: 'John', desc: description} ];
      element.isolateScope().processResults(responseData);
      expect(element.isolateScope().results[0].description).toBe(description);
    });

    it('should set $scope.results[0].image', function() {
      var element = angular.element('<div angucomplete id="ex1" placeholder="Search names" selectedobject="selected" localdata="names" searchfields="name" titlefield="name" imagefield="pic" minlength="1"/>');
      $compile(element)($scope);
      $scope.$digest();

      var image = 'some pic';
      var responseData = [ {name: 'John', pic: image} ];
      element.isolateScope().processResults(responseData);
      expect(element.isolateScope().results[0].image).toBe(image);
    });
  });

  describe('searchTimerComplete', function() {

    describe('local data', function() {
      it('should set $scope.searching to false and call $scope.processResults', function() {
        var element = angular.element('<div angucomplete id="ex1" placeholder="Search countries" selectedobject="selectedCountry" localdata="countries" searchfields="name" titlefield="name" minlength="1"/>');
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
        var element = angular.element('<div angucomplete id="ex1" placeholder="Search names" selectedobject="selected" url="names?q=" searchfields="name" datafield="data" titlefield="name" minlength="1"/>');
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
        var element = angular.element('<div angucomplete id="ex1" placeholder="Search names" selectedobject="selected" url="names?q=" searchfields="name" datafield="data" titlefield="name" minlength="1"/>');
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
    });
  });
});
