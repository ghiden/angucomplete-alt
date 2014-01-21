angucomplete
============

A simple but powerful AngularJS directive that allows you to quickly create autocomplete boxes that pull data either from a server or local variable.

###Key Features
* Show just a title, a title and a description or a title, description and image in your autocomplete list
* Deliberately minimally styled so you can customise it to your heart's content!
* Reads JSON data and allows you to specify which fields to use for display
* Simple setup - e.g. to pull data from a server, just set the url parameter


### Getting Started
Download the code, and include the angucomplete.js file in your page. Then add the angucomplete module to your Angular App file, e.g.
```html
var app = angular.module('app', ["angucomplete"]);
```

### Local Usage

```html
<angucomplete id="ex1" 
              placeholder="Search countries"
              pause="100" 
              selectedobject="selectedCountry" 
              localdata="countries" 
              searchfields="name" 
              titlefield="name"
              minlength="1"
              inputclass="form-control form-control-small"/>
```

### Remote Usage

```html
<angucomplete id="members"
              placeholder="Search members"
              pause="400"
              selectedobject="testObj"
              url="/user/find?s="
              titlefield="firstName,surname"
              descriptionfield="email"
              imagefield="profilePic"
              inputclass="form-control form-control-small"/>
```


                
