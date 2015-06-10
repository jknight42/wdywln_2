
$(function() {
  Parse.$ = jQuery;

  // Initialize Parse with your Parse application javascript keys
  Parse.initialize("MGKUEbafBIIy2bY4whbBKswCrbOsyyHJdqGMqhBi",
                   "BTfNR1vMfztxszEuQJNnthQAFRDLxPyy28O3FPjO");

/***
 *    ##     ##  #######  ##     ## #### ########    ##     ## ########  ##       
 *    ###   ### ##     ## ##     ##  ##  ##          ###   ### ##     ## ##       
 *    #### #### ##     ## ##     ##  ##  ##          #### #### ##     ## ##       
 *    ## ### ## ##     ## ##     ##  ##  ######      ## ### ## ##     ## ##       
 *    ##     ## ##     ##  ##   ##   ##  ##          ##     ## ##     ## ##       
 *    ##     ## ##     ##   ## ##    ##  ##          ##     ## ##     ## ##       
 *    ##     ##  #######     ###    #### ########    ##     ## ########  ######## 
 */

  // Our basic Movie model.
  var Movie = Parse.Object.extend("Movie", {
    defaults: {
      title: "empty..",
      date: "0000",
      type: "unknown",
      isGood: false,
      likedBy: [],
      notLikedBy: [],
      posterUrl: 'blank'
    },

    initialize: function() {
      

    },

    toggle: function() {
      this.save({done: !this.get("done")});
    },
    
  });


  // This is the transient application state, not persisted on Parse
  var AppState = Parse.Object.extend("AppState", {
    defaults: {
      filter: "all"
    }
  });

  // User model.
  var User = Parse.Object.extend("User", {
    defaults: {

    },
    initialize: function() {

    },
  })

/***
 *    ##     ##  #######  ##     ## #### ########    ##       ####  ######  ######## 
 *    ###   ### ##     ## ##     ##  ##  ##          ##        ##  ##    ##    ##    
 *    #### #### ##     ## ##     ##  ##  ##          ##        ##  ##          ##    
 *    ## ### ## ##     ## ##     ##  ##  ######      ##        ##   ######     ##    
 *    ##     ## ##     ##  ##   ##   ##  ##          ##        ##        ##    ##    
 *    ##     ## ##     ##   ## ##    ##  ##          ##        ##  ##    ##    ##    
 *    ##     ##  #######     ###    #### ########    ######## ####  ######     ##    
 */

  var YourMovieList = Parse.Collection.extend({

    // Reference to this collection's model.
    model: Movie,

  });

  var YourFriendsMovieList = Parse.Collection.extend({

    // Reference to this collection's model.
    model: Movie,

  });

  var AutofillMovieList = Parse.Collection.extend({

    // Reference to this collection's model.
    model: Movie,

  });



/***
 *    ##     ##  #######  ##     ## #### ########    ##     ## #### ######## ##      ## 
 *    ###   ### ##     ## ##     ##  ##  ##          ##     ##  ##  ##       ##  ##  ## 
 *    #### #### ##     ## ##     ##  ##  ##          ##     ##  ##  ##       ##  ##  ## 
 *    ## ### ## ##     ## ##     ##  ##  ######      ##     ##  ##  ######   ##  ##  ## 
 *    ##     ## ##     ##  ##   ##   ##  ##           ##   ##   ##  ##       ##  ##  ## 
 *    ##     ## ##     ##   ## ##    ##  ##            ## ##    ##  ##       ##  ##  ## 
 *    ##     ##  #######     ###    #### ########       ###    #### ########  ###  ###  
 */

  // The DOM element for a Movie item...
  var MovieView = Parse.View.extend({

    //... is a list tag.
    tagName:  "li",

    // Cache the template function for a single item.
    template: _.template($('#item-template').html()),

    // The DOM events specific to an item.
    events: {
      "mouseover .poster-container": "showMovieInfo",
      "click .like-btn-inline": "likeMovie"
    },

    initialize: function() {
      var self = this;
      _.bindAll(this, 'render',  'remove');
      this.model.bind('destroy', this.remove);

      this.likedByFriends = [];
      this.isMovieInfoPopulated = false;

      this.getLikedByFriends();

    },
    getLikedByFriends: function() {
      var self = this;

      // All users who like this movie:
      // this.model.attributes.likedBy

      // All friends of this user: 
      // Parse.User.current().get("friendIDs")

      var query = new Parse.Query(User);
      query.containedIn("facebookID", this.model.attributes.likedBy);
      query.find({
        success: function(usersWhoLikeTheMovie) {
          self.likedByFriends = []
          for (var i = 0; i < usersWhoLikeTheMovie.length; i++) {

            if( $.inArray(usersWhoLikeTheMovie[i].attributes.facebookID, Parse.User.current().get("friendIDs")) > -1 || usersWhoLikeTheMovie[i].attributes.facebookID === Parse.User.current().escape("facebookID")) {
              var oneFriend = {};
              oneFriend.firstName = usersWhoLikeTheMovie[i].attributes.firstName;
              oneFriend.lastName = usersWhoLikeTheMovie[i].attributes.lastName;
              self.likedByFriends.push(oneFriend);
            }
            
          };
          
          // Add "you like it" class if you like it to like button
          if($.inArray(Parse.User.current().escape("facebookID"), self.model.attributes.likedBy) > -1) {
            $(self.el).find(".like-btn-inline").addClass("you-like-it");
          }

          // Populate like button number:
          $(self.el).find(".num-of-likes").text(self.likedByFriends.length);
          
          // Create list of friends names who liked the movie. 
          $(self.el).find(".more-info ul li").remove();
          var moreInfoUl = $(self.el).find(".more-info ul");
          for(i=0 ; i < self.likedByFriends.length ; i++ ) {
            moreInfoUl.append("<li class='liked-by-name'>"+self.likedByFriends[i].firstName+" "+self.likedByFriends[i].lastName+"</li>")
          }
        },
        error: function(error) {
          console.log("Error checking for movie in table:");
          console.log(error);
        }
      });

    },
    showMovieInfo: function() {

    },
    likeMovie: function() {
      var self = this;
      
      // Fade out like button as a loading indicator: 
      $(self.el).find(".like-btn-inline").animate({"opacity":.25},500);

      if( $.inArray(Parse.User.current().escape("facebookID"), this.model.attributes.likedBy) > -1 ) {
        // user already likes this movie, change to unlike. 
        this.model.remove("likedBy", Parse.User.current().escape("facebookID"));
      } else {
        this.model.addUnique("likedBy",Parse.User.current().escape("facebookID"));
      }
      
      this.model.save({
        user: Parse.User.current()
      }, {
        success: function(result) {
          // The object was saved successfully.
          self.model.fetch({
            success: function(result) {
              // The object was refreshed successfully.
              self.getLikedByFriends();
              self.render();
              $(self.el).find(".like-btn-inline").animate({"opacity":1},1000);
            },
            error: function(myObject, error) {
              // The object was not refreshed successfully.
              // error is a Parse.Error with an error code and message.
            }
          });

        },
        error: function(newMovie, error) {
          // The save failed.
          // error is a Parse.Error with an error code and message.
          console.log("Error liking movie");
        }
      });
      
    },
    render: function() {
      $(this.el).html(this.template(this.model.toJSON()));
      $(this.el).addClass("movie-item");
      this.input = this.$('.edit');
      
      return this;
    },

    // Remove the item, destroy the model.
    clear: function() {
      this.model.destroy();
    }

  });

  
/***
 *    ##     ##    ###    #### ##    ##    ##     ## #### ######## ##      ## 
 *    ###   ###   ## ##    ##  ###   ##    ##     ##  ##  ##       ##  ##  ## 
 *    #### ####  ##   ##   ##  ####  ##    ##     ##  ##  ##       ##  ##  ## 
 *    ## ### ## ##     ##  ##  ## ## ##    ##     ##  ##  ######   ##  ##  ## 
 *    ##     ## #########  ##  ##  ####     ##   ##   ##  ##       ##  ##  ## 
 *    ##     ## ##     ##  ##  ##   ###      ## ##    ##  ##       ##  ##  ## 
 *    ##     ## ##     ## #### ##    ##       ###    #### ########  ###  ###  
 */

  var MainView = Parse.View.extend({

    // Delegated events for creating new items, and clearing completed ones.
    events: {
      "click .log-out": "logOut",
    },

    el: ".content",

    initialize: function() {
      var self = this;

      _.bindAll(this, 'addOne', 'addAll', 'friendsAddOne', 'friendsAddAll', 'render','logOut','getAllMovies');

      // Hide intro text once they are logged in
      $("#intro").hide();

      // Main movies management template
      
      this.$el.html(_.template($("#main-movies-template").html()));
      
      console.log("----this",this);
      this.getAllMovies();

    },
    getAllMovies: function() {
      var yourFriendsIds = Parse.User.current().get("friendIDs");

      // Create our collection of Movies
      this.yourMovies = new YourMovieList;

      // Setup the query for the collection to look for Movies from the current user
      this.yourMovies.query = new Parse.Query(Movie);
      // this.yourMovies.query.equalTo("user", Parse.User.current());
      this.yourMovies.query.containedIn("likedBy", [Parse.User.current().escape("facebookID")]);
        
      this.yourMovies.bind('add',     this.addOne);
      this.yourMovies.bind('reset',   this.addAll);
      this.yourMovies.bind('all',     this.render);

      // Fetch all the movie items for this user
      this.yourMovies.fetch();

      // Create a collection of our Friends' Movies
      this.yourFriendsMovies = new YourMovieList;

      // Setup the query for the collection to look for Movies that the current user's friends liked
      this.yourFriendsMovies.query = new Parse.Query(Movie);
      this.yourFriendsMovies.query.containedIn("likedBy", yourFriendsIds);
      this.yourFriendsMovies.query.descending("updatedAt");
        
      this.yourFriendsMovies.bind('add',     this.friendsAddOne);
      this.yourFriendsMovies.bind('reset',   this.friendsAddAll);
      this.yourFriendsMovies.bind('all',     this.render);

      // Fetch all the movie items for this user
      this.yourFriendsMovies.fetch();

      state.on("change", this.filter, this);
    },
    refreshMovies: function() {
      console.log("refreshMovies");
      // Fetch all the movie items for this user
      this.yourMovies.fetch();
    },

    // Logs out the user and shows the login view
    logOut: function(e) {
      Parse.User.logOut();
      new LogInView();
      this.undelegateEvents();
      delete this;
    },

    // Re-rendering the App just means refreshing the statistics -- the rest
    // of the app doesn't change.
    render: function() {
      this.delegateEvents();
    },

    // Add a single movie item to the list by creating a view for it, and
    // appending its element to the `<ul>`.
    addOne: function(movie) {
      var view = new MovieView({model: movie});
      this.$("#your-movies-list").append(view.render().el);
    },

    // Add all items in the collection at once.
    addAll: function(collection, filter) {
      this.$("#your-movies-list").html("");
      this.yourMovies.each(this.addOne);
    },

     // Add a single movie item to the list by creating a view for it, and
    // appending its element to the `<ul>`.
    friendsAddOne: function(movie) {
      var view = new MovieView({model: movie});
      this.$("#friends-movies-list").append(view.render().el);
    },

    // Add all items in the collection at once.
    friendsAddAll: function(collection, filter) {
      console.log("friendsAddAll");
      this.$("#friends-movies-list").html("");
      this.yourFriendsMovies.each(this.friendsAddOne);
    },

   
  });
/***
 *       ###    ########  ########     ##     ##  #######  ##     ## #### ########    ##     ## #### ######## ##      ## 
 *      ## ##   ##     ## ##     ##    ###   ### ##     ## ##     ##  ##  ##          ##     ##  ##  ##       ##  ##  ## 
 *     ##   ##  ##     ## ##     ##    #### #### ##     ## ##     ##  ##  ##          ##     ##  ##  ##       ##  ##  ## 
 *    ##     ## ##     ## ##     ##    ## ### ## ##     ## ##     ##  ##  ######      ##     ##  ##  ######   ##  ##  ## 
 *    ######### ##     ## ##     ##    ##     ## ##     ##  ##   ##   ##  ##           ##   ##   ##  ##       ##  ##  ## 
 *    ##     ## ##     ## ##     ##    ##     ## ##     ##   ## ##    ##  ##            ## ##    ##  ##       ##  ##  ## 
 *    ##     ## ########  ########     ##     ##  #######     ###    #### ########       ###    #### ########  ###  ###  
 */
  var theAddMovieView;
  var AddMovieView = Parse.View.extend({

    events: {
      "input input#new-movie":  "autoFillMovieNames",
      "click .like-answer": "likeAnswerClicked",
      "click #autocomplete-list li": "movieClick"
    },

    el: ".add-movie-container",

    initialize: function() {
      var self = this;
      this.newMovie = new Movie();
      this.movieToBeSaved = new Movie();
      this.currMovieIsLiked = false;
      this.input = this.$("#new-movie");
      this.allCheckbox = this.$("#toggle-all")[0];

      _.bindAll(this, 'addOne', 'autoFillMovieNames','likeAnswerClicked','movieClick');

      // Create our collection of Movies
      this.yourMovies = new YourMovieList;

      // Setup the query for the collection to look for Movies from the current user
      this.yourMovies.query = new Parse.Query(Movie);
      this.yourMovies.query.equalTo("user", Parse.User.current());
        
      this.yourMovies.bind('add',     this.addOne);
      
      this.$el.html(_.template($("#add-movie-template").html()));
      this.showAddMovie();
    },
    showAddMovie: function() {
       $('.add-movie-container').modal();
    },
    addOne: function(movie) {
      var view = new MovieView({model: movie});
      this.$("#your-movies-list").append(view.render().el);
    },
    addMovieToList: function() {
      var self = this;
      var movieToBeSaved = new Movie();
      this.yourMovies = new YourMovieList;

      // Setup the query for the collection to look for Movies from the current user
      this.yourMovies.query = new Parse.Query(Movie);
      this.yourMovies.query.equalTo("user", Parse.User.current());

      console.log("Saving..."); // TODO: Replace with loading GIF or some such thing. 

      // First check to see if movie already exists in DB: 
      var query = new Parse.Query(Movie);

      query.equalTo("imdbId", this.newMovie.get("imdbId"));
      query.find({
        success: function(results) {
          if(results.length == 0) {
            console.log("Movie does not exist: "+self.newMovie.get("imdbId"));
            // TODO: Move existing code to create new movie here and add current user's facebook Id to the like or not like column. 
            self.movieToBeSaved = self.newMovie;
            self.saveMovie();
          } else {
            console.log("MOVIE EXISTS!"+self.newMovie.get("imdbId"));
            console.log(results)
            self.movieToBeSaved = results[0];
            
            self.saveMovie();
          }
        },
        error: function(error) {
          console.log("Error checking for movie in table:");
          console.log(error);
        }
      });
    },
    saveMovie: function() {
      var publicACL = new Parse.ACL();
      publicACL.setPublicReadAccess(true);
      publicACL.setPublicWriteAccess(true);

      if(this.currMovieIsLiked) {
        this.movieToBeSaved.addUnique("likedBy",Parse.User.current().escape("facebookID"));
      } else {
        this.movieToBeSaved.addUnique("notLikedBy",Parse.User.current().escape("facebookID"));
      }

      this.movieToBeSaved.save({
        user: Parse.User.current(),
        ACL:     publicACL,
      }, {
        success: function(newMovie) {
          // The object was saved successfully.
          theMainView.refreshMovies();
        },
        error: function(newMovie, error) {
          // The save failed.
          // error is a Parse.Error with an error code and message.
          console.log("Error saving");
          console.log(error);
          console.log(newMovie);
        }
      });
    },
    getPoster: function() {
      // GET MOVIE POSTER: 
      // http://img.omdbapi.com/?i=tt2294629&apikey=24d1a7e9 
      // http://www.omdbapi.com/?i=tt1127180&plot=short&r=json
      var dataObj = {
          i: this.newMovie.get("imdbId"),
          apiKey: '24d1a7e9',
          r: 'JSON'
      }; 
      var self = this;      
      $.ajax({
        type: 'GET',
        async: false, 
        data: dataObj,
        url: 'http://www.omdbapi.com/',
        dataType: 'jsonp',
        success: function(jsonData) {

          self.newMovie.set("plot", jsonData.Plot);
          self.newMovie.set("actors", jsonData.Actors);
          $.get("http://img.omdbapi.com/?i="+dataObj.i+"&apikey=24d1a7e9")
              .done(function() { 
                  // image exists.
                  console.log("image exists!");
                  self.newMovie.set("posterUrl", "http://img.omdbapi.com/?i="+dataObj.i+"&apikey=24d1a7e9");
                  self.addMovieToList();
              }).fail(function() { 
                  // Image doesn't exist - do something else.
                  self.newMovie.set("posterUrl", "images/missing_poster.jpg");
                  self.addMovieToList();
              });
          
        },
        error: function(error) {
          console.log("Error with image")
          console.log(error)
        } 

      });
    },
    movieClick: function(e) {
      // Clear out autocomplete list & input box
      $("#autocomplete-list").html('');
      $("#new-movie").val('');

      this.newMovie.set("title", $(e.currentTarget).attr("title") );
      this.newMovie.set("type", $(e.currentTarget).attr("type"));
      this.newMovie.set("date", $(e.currentTarget).attr("date"));
      this.newMovie.set("imdbId", $(e.currentTarget).attr("imdbId"));

      this.showQuestionPart2();
    },
    likeAnswerClicked: function(e) {
      $.modal.close();
      var answerId = e.currentTarget.id;
      if(answerId == 'liked-it') {
        this.currMovieIsLiked = true;
      } else if(answerId == 'did-not-like-it') {
        this.currMovieIsLiked = false;
      }
      
      $("#question-part-2").hide();
      // this.addMovieToList();
      this.getPoster();

    },
    showQuestionPart2: function() {
      $("#question-part-2").show();
      
    },
    autoFillMovieNames: function(e) {
      var self = this;

      this.newMovie = new Movie();

      if($("#new-movie").val().length > 1) {
        $("#autocomplete-list").html('Searching ...');

        var dataObj = {
          s : $("#new-movie").val(),
          r: 'JSON'
        };
        
        $.ajax({
          type: 'GET',
          data: dataObj,
          url: 'http://www.omdbapi.com/',
          dataType: 'jsonp',
          success: function(jsonData)
          {
            $("#autocomplete-list").html('');
            var tvAndMovieList = jsonData.Search;
            if(tvAndMovieList) {

              for (var i = 0; i < 5; i++) {
                if(tvAndMovieList.length > i) {
                  var currLi = $("<li/>");
                  // $("#autocomplete-list").append("<img src='"+tvAndMovieList.movies[i].posters.profile+"' />");
                  currLi.append("<a class='title' href='#'>"+tvAndMovieList[i].Title+"</a>");
                  var metadata = $("<div class='metadata' />");
                  currLi.append(metadata);
                  metadata.append("<div class='year'>"+tvAndMovieList[i].Year+"</div>");
                  metadata.append("<div class='type'>"+tvAndMovieList[i].Type+"</div>");

                  currLi.attr("title",tvAndMovieList[i].Title);
                  currLi.attr("date",tvAndMovieList[i].Year);
                  currLi.attr("type",tvAndMovieList[i].Type);
                  currLi.attr("imdbId",tvAndMovieList[i].imdbID);
                                  
                  $("#autocomplete-list").append(currLi);
                }
              };
            }
          },
          error: function(e) {
            alert("Autocomplete has shit the bed. This error has been logged.");
            Parse.Analytics.track('error', { area: "autocomplete", searchString: dataObj.s, user: Parse.User.current().get("firstName")+Parse.User.current().get("lastName") });
          }
        });
      }
    },

  });


/***
 *    ##        #######   ######   #### ##    ##    ##     ## #### ######## ##      ## 
 *    ##       ##     ## ##    ##   ##  ###   ##    ##     ##  ##  ##       ##  ##  ## 
 *    ##       ##     ## ##         ##  ####  ##    ##     ##  ##  ##       ##  ##  ## 
 *    ##       ##     ## ##   ####  ##  ## ## ##    ##     ##  ##  ######   ##  ##  ## 
 *    ##       ##     ## ##    ##   ##  ##  ####     ##   ##   ##  ##       ##  ##  ## 
 *    ##       ##     ## ##    ##   ##  ##   ###      ## ##    ##  ##       ##  ##  ## 
 *    ########  #######   ######   #### ##    ##       ###    #### ########  ###  ###  
 */
 var theLoginView
 var LogInView = Parse.View.extend({
    events: {
      "click .facebook-login-button": "facebookLogIn",
    },

    el: ".content",
    
    initialize: function() {
      _.bindAll(this, "facebookLogIn");
      this.render();
    },

    facebookLogIn: function(e) {
      Parse.FacebookUtils.logIn("email,user_friends,read_friendlists", {
        success: function(user) {
          // Handle successful login
          FB.api(
              "/v1.0/me/",
              function (response) {
                if (response && !response.error) {
                  Parse.User.current().save("firstName",response.first_name);
                  Parse.User.current().save("lastName",response.last_name);
                  Parse.User.current().save("facebookID",response.id);
                  
                  theAddMovieView = new AddMovieView();
                  theMainView = new MainView();
                } else {
                  console.log("Error:")
                  console.log(response.error)
                }
              }
          );
          FB.api(
              "/v1.0/me/picture",
              function (response) {
                if (response && !response.error) {
                  Parse.User.current().save("profileImage",response.data.url);
                } else {
                  console.log("Error:")
                  console.log(response.error)
                }
              }
          );
          FB.api(
            "/v1.0/me/friends",
            function (response) {
              console.log("fetching friends")
              if (response && !response.error) {
                var currUserFriendsIds = [];
                for (var i = response.data.length - 1; i >= 0; i--) {
                  currUserFriendsIds.push(response.data[i].id);
                };

                var currUser = Parse.User.current();

                currUser.set("friendIDs",currUserFriendsIds)

                currUser.save(null, {
                  success: function(response) {
                    // Execute any logic that should take place after the object is saved.
                    console.log('User data saved: ',response);
                  },
                  error: function(response, error) {
                    // Execute any logic that should take place if the save fails.
                    // error is a Parse.Error with an error code and message.
                    console.log('Failed to create save user data, with error code: ' + error.message);
                  }
                });


              } else {
                console.log("Friends Error:")
                console.log(response.error)
              }
            }
          );
          new SignedInView();
        },
        error: function(user, error) {
          // Handle errors and cancellation
          console.log("\nError:");
          console.log(user);
          console.log(error);
        }
      });

    },

    render: function() {
      this.$el.html(_.template($("#login-template").html()));
      this.delegateEvents();
    }
  });
  function updateFacebookFriends() {
    console.log("updateFacebookFriends");
    
  }
/***
 *     ######  ####  ######   ##    ## ########     #### ##    ##    ##     ## #### ######## ##      ## 
 *    ##    ##  ##  ##    ##  ###   ## ##     ##     ##  ###   ##    ##     ##  ##  ##       ##  ##  ## 
 *    ##        ##  ##        ####  ## ##     ##     ##  ####  ##    ##     ##  ##  ##       ##  ##  ## 
 *     ######   ##  ##   #### ## ## ## ##     ##     ##  ## ## ##    ##     ##  ##  ######   ##  ##  ## 
 *          ##  ##  ##    ##  ##  #### ##     ##     ##  ##  ####     ##   ##   ##  ##       ##  ##  ## 
 *    ##    ##  ##  ##    ##  ##   ### ##     ##     ##  ##   ###      ## ##    ##  ##       ##  ##  ## 
 *     ######  ####  ######   ##    ## ########     #### ##    ##       ###    #### ########  ###  ###  
 */
  var SignedInView = Parse.View.extend({

    events: {
      "click .log-out": "logOut",
      "click .js-trigger-add-movie": "showAddMovie"
    },

    el: ".login-info",

    initialize: function() {
      var self = this;
      this.$el.html(_.template($("#signed-in-template").html()));

    },
    logOut: function(e) {
      Parse.User.logOut();

      theLoginView = new LogInView();
      this.undelegateEvents();
      delete this;
    },
    showAddMovie:function() {
      theAddMovieView.showAddMovie();
    }

  });


/***
 *       ###    ########  ########     ##     ## #### ######## ##      ## 
 *      ## ##   ##     ## ##     ##    ##     ##  ##  ##       ##  ##  ## 
 *     ##   ##  ##     ## ##     ##    ##     ##  ##  ##       ##  ##  ## 
 *    ##     ## ########  ########     ##     ##  ##  ######   ##  ##  ## 
 *    ######### ##        ##            ##   ##   ##  ##       ##  ##  ## 
 *    ##     ## ##        ##             ## ##    ##  ##       ##  ##  ## 
 *    ##     ## ##        ##              ###    #### ########  ###  ###  
 */
  // The main view for the app
  var AppView = Parse.View.extend({
    // Instead of generating a new element, bind to the existing skeleton of
    // the App already present in the HTML.
    el: $("#wdywln-app"),

    initialize: function() {
      this.render();
    },

    render: function() {
      if (Parse.User.current()) {
        theAddMovieView = new AddMovieView();
        theMainView = new MainView();
        new SignedInView();
      } else {
        new LogInView();
      }
    }
  });

/***
 *       ###    ########  ########     ########  ######## ########  
 *      ## ##   ##     ## ##     ##    ##     ##    ##    ##     ## 
 *     ##   ##  ##     ## ##     ##    ##     ##    ##    ##     ## 
 *    ##     ## ########  ########     ########     ##    ########  
 *    ######### ##        ##           ##   ##      ##    ##   ##   
 *    ##     ## ##        ##           ##    ##     ##    ##    ##  
 *    ##     ## ##        ##           ##     ##    ##    ##     ## 
 */
  var AppRouter = Parse.Router.extend({
    routes: {
      "all": "all",
      "active": "active",
      "completed": "completed"
    },

    initialize: function(options) {
    },

    all: function() {
      state.set({ filter: "all" });
    },

    active: function() {
      state.set({ filter: "active" });
    },

    completed: function() {
      state.set({ filter: "completed" });
    }
  });

  var state = new AppState;

  new AppRouter;
  new AppView;
  Parse.history.start();
});
