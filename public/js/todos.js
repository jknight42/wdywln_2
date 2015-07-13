
$(function() {
  Parse.$ = jQuery;

  // Initialize Parse with your Parse application javascript keys
  Parse.initialize("MGKUEbafBIIy2bY4whbBKswCrbOsyyHJdqGMqhBi",
                   "BTfNR1vMfztxszEuQJNnthQAFRDLxPyy28O3FPjO");

/***
 *    ##     ##  #######  ########  ######## ##        ######  
 *    ###   ### ##     ## ##     ## ##       ##       ##    ## 
 *    #### #### ##     ## ##     ## ##       ##       ##       
 *    ## ### ## ##     ## ##     ## ######   ##        ######  
 *    ##     ## ##     ## ##     ## ##       ##             ## 
 *    ##     ## ##     ## ##     ## ##       ##       ##    ## 
 *    ##     ##  #######  ########  ######## ########  ######  
 */

  // Our basic Movie model.
  var Movie = Parse.Object.extend("Movie", {
    defaults: {
      title: "empty..",
      date: "0000",
      type: "unknown",
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

  var Activity = Parse.Object.extend("Activity", {
    defaults: {

    },
    initialize: function() {

    },
  });

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
  var AllMovieList = Parse.Collection.extend({

    // Reference to this collection's model.
    model: Movie,

  });
  var YourFriendsMovieList = Parse.Collection.extend({

    // Reference to this collection's model.
    model: Movie,

  });
  var YourQueuedMovieList = Parse.Collection.extend({

    // Reference to this collection's model.
    model: Movie,

  });

  var AutofillMovieList = Parse.Collection.extend({

    // Reference to this collection's model.
    model: Movie,

  });

  var ActivityList = Parse.Collection.extend({

    model: Activity,
  })



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
      "click .like-btn": "likeMovie",
      "click .trailer-btn": "showTrailer",
      "click .queue-btn": "addToQueue"
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
              oneFriend.profileImage = usersWhoLikeTheMovie[i].attributes.profileImage;
              self.likedByFriends.push(oneFriend);
            }
            
          };
          
          // Populate like button number:
          $(self.el).find(".num-of-likes").text(self.likedByFriends.length);
          
          // Create list of friends names who liked the movie. 
          $(self.el).find(".more-info ul li").remove();
          var moreInfoUl = $(self.el).find(".more-info ul");
          var profileImageUrl = "";
          for(i=0 ; i < self.likedByFriends.length ; i++ ) {
            if(typeof self.likedByFriends[i].profileImage === "undefined") {
              profileImageUrl = "images/missing_profile_image.jpg";
            } else {
              profileImageUrl = self.likedByFriends[i].profileImage;
            }
            moreInfoUl.append("<li class='liked-by-name'><img src='"+ profileImageUrl +"' class='profile-image'/>"+self.likedByFriends[i].firstName+" "+self.likedByFriends[i].lastName+"</li>")
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
    showTrailer: function() {
      $("#trailer-box iframe").attr("src","http://www.youtube.com/embed/"+this.model.attributes.youTubeId);
      $("#trailer-box").modal();
    },
    likeMovie: function() {
      var self = this;
      
      // Fade out like button as a loading indicator: 
      // $(self.el).find(".like-btn").animate({"opacity":.25},500);


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
              $(self.el).find(".status-message").html("Liked");
              $(self.el).find(".status-message").fadeIn(500).delay(500).fadeOut(500);
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
    addToQueue: function() {
      var self = this;
      
      // Fade out like button as a loading indicator: 
      // $(self.el).find(".like-btn").animate({"opacity":.25},500);
      var queueItemObject = { "id": this.model.attributes.imdbId, "tags": [] };
      var currUser = Parse.User.current();

      currUser.addUnique("queue",queueItemObject);
      $(self.el).find(".status-message").html("Added to queue");
      $(self.el).find(".status-message").fadeIn(500).delay(500).fadeOut(500, function() {
        currUser.save(null, {
          success: function(response) {
            // Execute any logic that should take place after the object is saved.
            console.log('User data saved: ',response);
            this.theMainView.refreshMovies();
          },
          error: function(response, error) {
            // Execute any logic that should take place if the save fails.
            // error is a Parse.Error with an error code and message.
            console.log('Failed to create save user data, with error code: ' + error.message);
          }
        });

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
      // "click h2": "retroFitMovies",
      "click nav a": "changeMainView"
    },

    el: ".content",

    initialize: function() {
      var self = this;
      this.mainNavIds = ["nav-activity","nav-your-friends-like","nav-you-like","nav-your-queue"]

      var yourFriendsIds = [];

      _.bindAll(this, 'addOne', 'addAll', 'friendsAddOne', 'friendsAddAll', 'queueAddOne', 'queueAddAll', 'activitiesAddOne', 'activitiesAddAll', 'render','logOut','getAllMovies');

      // Hide intro text once they are logged in
      $("#intro").hide();

      $(document).on($.modal.CLOSE, this.closeModal);

      // Main movies management template
      
      this.$el.html(_.template($("#main-movies-template").html()));
      
      this.getAllMovies();
      this.getAllActivities();

    },
    closeModal: function() {
      $("#trailer-box iframe").attr("src","about:blank");

      console.log("closeModal")
      $("input#new-movie").val("");
      $("#autocomplete-list").html("");
      $("#autocomplete-list").removeClass("long");

    },
    changeMainView: function(e) {
      var animSpeed = 200;
      
      this.hideAllMainViews(animSpeed);
      $("#"+e.currentTarget.id).addClass("nav-item-current");
      $("#"+e.currentTarget.id).parent("li").addClass("nav-item-current-li");
      for (var i = 0; i < this.mainNavIds.length; i++) {
        if(this.mainNavIds[i] !== e.currentTarget.id) {
          $("#"+this.mainNavIds[i]).delay(animSpeed).fadeIn(animSpeed);
        }
      };

      var contentBlock = e.currentTarget.id.replace("nav-","");
      $("#"+contentBlock+"-container").delay(animSpeed).fadeIn(animSpeed);

    },
    hideAllMainViews: function(speed) {
      
      $("#friends-movies-list-container").fadeOut(speed);
      $("#your-movies-list-container").fadeOut(speed);
      $("#queue-movies-list-container").fadeOut(speed);

      $("#nav-your-friends-like").removeClass("nav-item-current");
      $("#nav-you-like").removeClass("nav-item-current");
      $("#nav-your-queue").removeClass("nav-item-current");

      $("#nav-your-friends-like").parent("li").removeClass("nav-item-current-li");
      $("#nav-you-like").parent("li").removeClass("nav-item-current-li");
      $("#nav-your-queue").parent("li").removeClass("nav-item-current-li");

    },
    getAllMovies: function() {

      this.yourFriendsIds = Parse.User.current().get("friendIDs");
      var yourQueueArr = Parse.User.current().get("queue");
      var yourQueueIdsArr = [];
      var self = this;

      console.log("yourQueueArr",yourQueueArr)

      // Create our collection of Movies
      this.yourMovies = new YourMovieList;

      // Setup the query for the collection to look for Movies from the current user
      this.yourMovies.query = new Parse.Query(Movie);
      // this.yourMovies.query.equalTo("user", Parse.User.current());
      this.yourMovies.query.containedIn("likedBy", [Parse.User.current().escape("facebookID")]);
      this.yourMovies.query.descending("createdAt");
        
      this.yourMovies.bind('add',     this.addOne);
      this.yourMovies.bind('reset',   this.addAll);
      this.yourMovies.bind('all',     this.render);

      // Fetch all the movie items for this user
      this.yourMovies.fetch();

      // Create a collection of our Friends' Movies
      this.yourFriendsMovies = new YourMovieList;

      // Setup the query for the collection to look for Movies that the current user's friends liked
      this.yourFriendsMovies.query = new Parse.Query(Movie);
      this.yourFriendsMovies.query.containedIn("likedBy", this.yourFriendsIds);
      this.yourFriendsMovies.query.descending("createdAt");
        
      this.yourFriendsMovies.bind('add',     this.friendsAddOne);
      this.yourFriendsMovies.bind('reset',   this.friendsAddAll);
      this.yourFriendsMovies.bind('all',     this.render);

      // Fetch all the movie items for this user
      this.yourFriendsMovies.fetch();

      if(typeof yourQueueArr !== 'undefined') {
        for (var i = 0; i < yourQueueArr.length; i++) {
          yourQueueIdsArr[i] = yourQueueArr[i].id;
        };
        this.yourQueuedMovies = new YourMovieList;

        // Setup the query for the collection to look for Movies that the current user's friends liked
        this.yourQueuedMovies.query = new Parse.Query(Movie);
        console.log("yourQueueIdsArr",yourQueueIdsArr);
        this.yourQueuedMovies.query.containedIn("imdbId", yourQueueIdsArr);
          
        this.yourQueuedMovies.bind('add',     this.queueAddOne);
        this.yourQueuedMovies.bind('reset',   this.queueAddAll);
        this.yourQueuedMovies.bind('all',     this.render);

        // Fetch all the movie items for this user
        this.yourQueuedMovies.fetch();
      }
      state.on("change", this.filter, this);
    },
    getAllActivities: function() {
      var self = this;

      // Create our collection of Activities
      self.yourActivities = new ActivityList;

      self.yourActivities.query = new Parse.Query(Activity);
      self.yourActivities.query.containedIn("facebookID", self.yourFriendsIds);
      self.yourActivities.query.descending("dateTime");
        
      self.yourActivities.bind('add',     self.activitiesAddOne);
      self.yourActivities.bind('reset',   self.activitiesAddAll);
      self.yourActivities.bind('all',     self.render);

      // Fetch all the movie items for this user
      self.yourActivities.fetch();

      state.on("change", self.filter, self);
    },
    createYourQueuedMovies: function() {
      
    },
    refreshMovies: function() {
      var self = this;
      console.log("refreshMovies");
      // Fetch all the movie items for this user
      Parse.User.current().fetch({
        success: function(myObject) {
          // The object was refreshed successfully.

          self.yourMovies.fetch();

          var yourQueueArr = Parse.User.current().get("queue");
          var yourQueueIdsArr = [];

          for (var i = 0; i < yourQueueArr.length; i++) {
            yourQueueIdsArr[i] = yourQueueArr[i].id;
          };

          self.yourQueuedMovies.query.containedIn("imdbId", yourQueueIdsArr);

          self.yourQueuedMovies.fetch({
            success: function(myObject) {
              // The object was refreshed successfully.
              console.log("yourQueuedMovies fetched success");
            },
            error: function(myObject, error) {
              // The object was not refreshed successfully.
              // error is a Parse.Error with an error code and message.
              console.log("yourQueuedMovies fail", error)
            }
          });
          self.yourFriendsMovies.fetch();
        },
        error: function(myObject, error) {
          // The object was not refreshed successfully.
          // error is a Parse.Error with an error code and message.
        }
      });
     
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
      this.$("#friends-movies-list").html("");
      this.yourFriendsMovies.each(this.friendsAddOne);
    },


    // Add a single movie item to the list by creating a view for it, and
    // appending its element to the `<ul>`.
    queueAddOne: function(movie) {
      var view = new MovieView({model: movie});
      this.$("#your-queued-movies-list").append(view.render().el);
    },

    // Add all items in the collection at once.
    queueAddAll: function(collection, filter) {
      this.$("#your-queued-movies-list").html("");
      this.yourQueuedMovies.each(this.queueAddOne);
    },

    // Add a single movie item to the list by creating a view for it, and
    // appending its element to the `<ul>`.
    activitiesAddOne: function(activity) {
      var view = new ActivityView({model: activity});
      this.$("#activity-list").append(view.render().el);
    },

    // Add all items in the collection at once.
    activitiesAddAll: function(collection, filter) {
      console.log("activitiesAddAll");
      this.$("#activity-list").html("");
      this.yourActivities.each(this.activitiesAddOne);
    },
    retroFitMovies: function() {
      // a catch all function to fix movies already added to the database with different kinds of new shit. 
      var self = this;
      var currResult;
      self.queryResults = []

      
      this.allTheMovies = new AllMovieList;

      // Setup the query for the collection to look for Movies that the current user's friends liked
      this.allTheMovies.query = new Parse.Query(Movie);
      this.allTheMovies.query.doesNotExist("youTubeId");

      // this.allTheMovies.fetch();

      this.allTheMovies.query.find().then(function(queryResults) {
        self.queryResults = queryResults;
        var jsonResults = [];

        for (var i = 0; i < self.queryResults.length; i++) {
          self.doSetTimeout(self.queryResults[i],i)
        };
      });

    },
    doSetTimeout: function(theMovie,i) {
      var self = this;
      setTimeout(function() {
        self.retroFitOneMovie(theMovie);
      }, 1000*i );
    },
    retroFitOneMovie: function(theOneMovie) {
      var self = this;
      var movieOrTv = "";

      if(theOneMovie.get("type") == "series") {
        movieOrTv = "tv";
      } else if(theOneMovie.get("type") == "movie") {
        movieOrTv = "movie";
      }
      console.log(theOneMovie.get("title"));
      $.ajax({
          type: 'GET',
          async: false, 
          url: 'http://api.themoviedb.org/3/'+movieOrTv+'/'+theOneMovie.get("tmdbId")+'/videos?api_key=773a2a626be46f73173ee702587528c5',
          dataType: 'jsonp',
          success: function(jsonData) {
            resultsObj = jsonData.results;
            if(resultsObj[0].site == "YouTube" && resultsObj[0].type == "Trailer") {
              theOneMovie.set("youTubeId", resultsObj[0].key);
            }

            theOneMovie.save({
            }, {
              success: function(savedMovie) {
                // The object was saved successfully.
                console.log("Saved trailer");
              },
              error: function(savedMovie, error) {
                // The save failed.
                // error is a Parse.Error with an error code and message.
                console.log("Error saving trailer");
                console.log(error);
              }
            });
          },
          error: function(error) {
            console.log("Error getting trailer")
            console.log(error)
          } 
            
            
        

        });
    }


   
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
      "keyup input#new-movie":  "inputKeyPress",
      "click .seen-it-answer": "seenItAnswerClicked",
      "click .like-answer": "likeAnswerClicked",
      "click #autocomplete-list li": "movieClick"
    },

    el: ".add-movie-container",

    initialize: function() {
      var self = this;
      this.newMovie = new Movie();
      this.movieToBeSaved = new Movie();
      this.currMovieIsLiked = false;
      this.currMovieToQueue = false;
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
       $('.add-movie-container #new-movie').focus();
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
            console.log("self.newMovie",self.newMovie)
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
      var self = this;
      console.log("saveMovie()");
      var publicACL = new Parse.ACL();
      publicACL.setPublicReadAccess(true);
      publicACL.setPublicWriteAccess(true);

      var newActivity = new Activity();

      if(this.currMovieToQueue) {
        var newQueueItemObj = { id: this.newMovie.get("imdbId"), tags: [] };
        console.log("newQueueItemObj",newQueueItemObj);
        Parse.User.current().addUnique("queue",newQueueItemObj);
        newActivity.set("action","queued");
      } else {
        if(this.currMovieIsLiked) {
          this.movieToBeSaved.addUnique("likedBy",Parse.User.current().escape("facebookID"));
          newActivity.set("action","liked");
        } else {
          this.movieToBeSaved.addUnique("notLikedBy",Parse.User.current().escape("facebookID"));
          newActivity.set("action","disliked");
        }
      }
      console.log("self.movieToBeSaved",self.movieToBeSaved)
      this.movieToBeSaved.save({
        user: Parse.User.current(),
        ACL:     publicACL,
      }, {
        success: function() {
          // The object was saved successfully.

          // add this to the activity log:
          
          newActivity.set("imdbId", self.movieToBeSaved.get("imdbId"));
          newActivity.set("tmdbId", self.movieToBeSaved.get("tmdbId"));
          newActivity.set("facebookID", Parse.User.current().escape("facebookID"));
          newActivity.set("dateTime", new Date());

          newActivity.save();

          theMainView.refreshMovies();
        },
        error: function(error) {
          // The save failed.
          // error is a Parse.Error with an error code and message.
          console.log("Error saving");
          console.log(error);
        }
      });
    },
    getBasicMovieData: function() {
      // getBasicMovieData: 
      // movie poster, imdbId, etc.

      // Images:
      // http://image.tmdb.org/t/p/w500/hpt3aa5i0TrSAnEdl3VJrRrje8C.jpg
      // THis path can change and we need configuration information to know if it has changed. 
      // http://docs.themoviedb.apiary.io/#reference/configuration/configuration

      // FIND USING IMDB ID:
      // http://api.themoviedb.org/3/find/
      // http://api.themoviedb.org/3/find/tt3079380?api_key=773a2a626be46f73173ee702587528c5&external_source=imdb_id
      // http://api.themoviedb.org/3/movie/49849?api_key=773a2a626be46f73173ee702587528c5

      var self = this;  
      var resultsObj = [];  
      var imagePath = ""; 
      var keypressTimer = 0; 

      if(self.newMovie.get("type") == "series") {
        movieOrTv = "tv";
      } else if(self.newMovie.get("type") == "movie") {
        movieOrTv = "movie";
      }


      $.ajax({
        type: 'GET',
        async: false, 
        url: 'http://api.themoviedb.org/3/'+movieOrTv+'/'+self.newMovie.get("tmdbId")+'?api_key=773a2a626be46f73173ee702587528c5',        
        dataType: 'jsonp',
        success: function(jsonData) {
          console.log("getBasicMovieData jsonData",jsonData)
          resultsObj = jsonData;

          imagePath = "http://image.tmdb.org/t/p/w185/"+resultsObj.poster_path;
          self.newMovie.set("plot", resultsObj.overview);
          if(self.newMovie.get("type") == "movie") {
            self.newMovie.set("imdbId",resultsObj.imdb_id);
          }
          
          
          // Test image path to make sure it exists:
          $.get(imagePath)
              .done(function() { 
                  // image exists.
                  console.log("image exists!");
                  self.newMovie.set("posterUrl", imagePath);
                  if(self.newMovie.get("type") == "movie") {
                    self.getTrailerData();
                  } else {
                    self.getImdbId();
                  }
                  
              }).fail(function() { 
                  // Image doesn't exist - do something else.
                  self.newMovie.set("posterUrl", "images/missing_poster.jpg");
                  self.getTrailerData();
                  if(self.newMovie.get("type") == "movie") {
                    self.getTrailerData();
                  } else {
                    self.getImdbId();
                  }
              });
          
        },
        error: function(error) {
          console.log("Error with getBasicMovieData ajax call")
          console.log(error)
        } 

      });
    },
    getImdbId: function() {
      var self = this;
      // THis is only for TV for some reason. 
      // The tmdb api provides IMDB ids for movies but needs a seperate call for tvs
      $.ajax({
        type: 'GET',
        async: false, 
        url: 'http://api.themoviedb.org/3/tv/'+self.newMovie.get("tmdbId")+'/external_ids?api_key=773a2a626be46f73173ee702587528c5',        
        dataType: 'jsonp',
        success: function(jsonData) {
          console.log("getImdbId jsonData",jsonData)
          resultsObj = jsonData;

          self.newMovie.set("imdbId",resultsObj.imdb_id);
          self.getTrailerData();
          
        },
        error: function(error) {
          console.log("Error with getBasicMovieData ajax call")
          console.log(error)
        }
      }); 
    },
    getTrailerData: function() {
      var self = this;  
      var resultsObj = []; 
      var movieOrTv = "";

      if(self.newMovie.get("type") == "series") {
        movieOrTv = "tv";
      } else if(self.newMovie.get("type") == "movie") {
        movieOrTv = "movie";
      }

      $.ajax({
        type: 'GET',
        async: false, 
        url: 'http://api.themoviedb.org/3/'+movieOrTv+'/'+self.newMovie.get("tmdbId")+'/videos?api_key=773a2a626be46f73173ee702587528c5',
        dataType: 'jsonp',
        success: function(jsonData) {
          console.log("getTrailerData jsonData:",jsonData);
          resultsObj = jsonData.results;
          if(resultsObj.length > 0 && resultsObj[0].site == "YouTube" && resultsObj[0].type == "Trailer") {
            self.newMovie.set("youTubeId", resultsObj[0].key);
          }
        },
        error: function(error) {
          console.log("Error with trailer")
          console.log(error)
        } 

      });      
      self.addMovieToList();
    },
    getCastData: function() {
      var self = this;

    },
    movieClick: function(e) {
      // Clear out autocomplete list & input box
      $("#autocomplete-list").hide();
      $("#new-movie").val('');

      this.newMovie.set("title", $(e.currentTarget).attr("title") );
      this.newMovie.set("type", $(e.currentTarget).attr("type"));
      this.newMovie.set("date", $(e.currentTarget).attr("date"));
      this.newMovie.set("tmdbId", +$(e.currentTarget).attr("tmdbId"));

      this.showQuestionPart2();
    },
    likeAnswerClicked: function(e) {
      console.log("likeAnswerClicked");
      $.modal.close();
      var answerId = e.currentTarget.id;
      if(answerId == 'liked-it') {
        this.currMovieIsLiked = true;
      } else if(answerId == 'did-not-like-it') {
        this.currMovieIsLiked = false;
      }
      
      $("#question-part-3").hide();
      // this.addMovieToList();
      this.getBasicMovieData();

    },
    seenItAnswerClicked: function(e) {
      console.log("seenItAnswerClicked");
      var answerId = e.currentTarget.id;
      $("#question-part-2").hide();
      if(answerId == 'seen-it') {
        $("#question-part-3").show();
      } else if(answerId == 'not-seen-it') {
        //
        $.modal.close();
        this.currMovieToQueue = true;
        this.getBasicMovieData();
        console.log("add to queue");
      }

    },
    showQuestionPart2: function() {
      // part 2 is: 
      $("#question-part-2").show();
      
    },
    inputKeyPress: function() {
      console.log("inputKeyPress");
      if($("#new-movie").val().length > 0) {
        $("#autocomplete-list").html('Waiting ...');

      }
      
      $("#autocomplete-list").removeClass("long");
      if (this.keypressTimer) {
        clearTimeout(this.keypressTimer);
      }

      this.keypressTimer = setTimeout(this.autoFillMovieNames, 700);

    },
    autoFillMovieNames: function(e) {
      console.log("autoFillMovieNames");
      var self = this;

      this.newMovie = new Movie();

      if($("#new-movie").val().length > 0) {
        $("#autocomplete-list").show();
        $("#autocomplete-list").html('Searching ...');
        $("#autocomplete-list").removeClass("long");

        var searchQuery = $("#new-movie").val();
        // http://api.themoviedb.org/3/search/movie?api_key=773a2a626be46f73173ee702587528c5&query=spy
        $.ajax({
          type: 'GET',
          url: 'http://api.themoviedb.org/3/search/multi?api_key=773a2a626be46f73173ee702587528c5&query='+searchQuery,
          dataType: 'jsonp',
          success: function(jsonData)
          {
            $("#autocomplete-list").html('');
            var tvAndMovieList = jsonData.results;
            console.log("tvAndMovieList",jsonData);
            if(tvAndMovieList.length > 0) {

              // add gradient to bottom of long lists to indicate there is more:
              if(tvAndMovieList.length > 5) {
                $("#autocomplete-list").addClass("long");
              } else {
                $("#autocomplete-list").removeClass("long");  
              }

              for (var i = 0; i < tvAndMovieList.length; i++) {
                if(tvAndMovieList.length > i) {
                  var currLi = $("<li/>");
                  // $("#autocomplete-list").append("<img src='"+tvAndMovieList.movies[i].posters.profile+"' />");
                  
                  var media_type = tvAndMovieList[i].media_type;
                  var title = "";
                  var release_year = "";

                  if(media_type == "tv") {
                    media_type = "series";
                    title = tvAndMovieList[i].name;
                    if(tvAndMovieList[i].first_air_date != null) {
                      release_year = tvAndMovieList[i].first_air_date.split("-")[0];
                    } else {
                      release_year = "";
                    }
                    
                  } else {
                    media_type = "movie";
                    title = tvAndMovieList[i].title;
                    if(tvAndMovieList[i].release_date != null) {
                      release_year = tvAndMovieList[i].release_date.split("-")[0];
                    } else {
                      release_year = "";
                    }
                    
                  }

                  currLi.append("<a class='title' href='#'>"+title+"</a>");
                  
                  var metadata = $("<div class='metadata' />");
                  currLi.append(metadata);
                  
                  metadata.append("<div class='year'>"+release_year+"</div>");
                  metadata.append("<div class='type'>"+media_type+"</div>");

                  currLi.attr("title",title);
                  currLi.attr("date",release_year);
                  currLi.attr("type",media_type);
                  currLi.attr("tmdbId",tvAndMovieList[i].id);
                  // currLi.attr("imdbId",tvAndMovieList[i].imdbID);
                                  
                  $("#autocomplete-list").append(currLi);
                }
              };
            } else {
               $("#autocomplete-list").html('No results found for <strong>"'+$("#new-movie").val()+'"</strong>');
            }
          },
          error: function(e) {
            alert("Autocomplete has shit the bed. This error has been logged.");
            Parse.Analytics.track('error', { area: "autocomplete", searchString: dataObj.s, user: Parse.User.current().get("firstName")+Parse.User.current().get("lastName") });
          }
        });
      } else {
        // input has 0 characters
        $("#autocomplete-list").html("");
      }
    },

  });

/***
 *       ###     ######  ######## ##     ## ##    ##    ##     ## #### ######## ##      ## 
 *      ## ##   ##    ##    ##    ##     ##  ##  ##     ##     ##  ##  ##       ##  ##  ## 
 *     ##   ##  ##          ##    ##     ##   ####      ##     ##  ##  ##       ##  ##  ## 
 *    ##     ## ##          ##    ##     ##    ##       ##     ##  ##  ######   ##  ##  ## 
 *    ######### ##          ##     ##   ##     ##        ##   ##   ##  ##       ##  ##  ## 
 *    ##     ## ##    ##    ##      ## ##      ##         ## ##    ##  ##       ##  ##  ## 
 *    ##     ##  ######     ##       ###       ##          ###    #### ########  ###  ###  
 */
var ActivityView = Parse.View.extend({

    //... is a list tag.
    tagName:  "li",

    // Cache the template function for a single item.
    template: _.template($('#activity-template').html()),

    // The DOM events specific to an item.
    events: {
      
    },

    initialize: function() {
      var self = this;
      _.bindAll(this, 'render');

    },
    render: function() {
      $(this.el).html(this.template(this.model.toJSON()));
      // $(this.el).addClass("movie-item");
      // this.input = this.$('.edit');
      
      return this;
    },
    // Remove the item, destroy the model.
    clear: function() {
      this.model.destroy();
    }

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
