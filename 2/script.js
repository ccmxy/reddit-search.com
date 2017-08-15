     var currentRequest = null;
     var commentObj = {
         "date_fetched": "YYYY-M-DD H:MM:SS",
         "comments": []
     }; //Object to hold json download data

     $('#my_bootstrap_pager').addClass('hidden');
     $('#checkbox_section').addClass('hidden');

     //When the user starts typing in..
     $(document).keyup(function(e) {
         if ($('#search_mobile').is(":focus") || $('#subreddit_mobile').is(":focus") || $('#user_mobile').is(":focus")) {
             search();
         }
     });


     function checkInput() {
         if ($('#search_mobile').val() == "" && $('#subreddit_mobile').val() == "" && $('#user_mobile').val() == "") {
             alert('Please enter a something into one, two, or all three boxes to perform a comment search.');
             return false;
         } else {
             return true;
         }
     }

     function search() {
         $('.hidden_page_number_list').html("");
         $('.search_results_section').html("");
         $('#download_json_btn').addClass('hidden');
         $('#my_bootstrap_pager').addClass('hidden');
         $('#current_page').html("Page 0");
         $('#current_length').html("0");

         var fullSearchString = $('#after_search').val();
         var username = $('#user_mobile').val();
         var subreddit = $('#subreddit_mobile').val();
         var searchterms = $('#search_mobile').val();

         if (checkInput()) {
             if (currentRequest != null) {
                 currentRequest.abort();
             }
             $('#checkbox_section').removeClass('hidden');
             getResults(username, subreddit, searchterms, null);

         }
     }

     function addQueryStatement(username, subreddit, searchterms) {
         var queryStatement = "<div>Query for comments";
         if (searchterms) {
             queryStatement += " containing <b>" + searchterms + "</b>";
         }
         if (username) {
             queryStatement += " by <a href='https://www.reddit.com/u/" + username + "' target='_blank'>u/" + username + "</a>";
         }
         if (subreddit) {
             queryStatement += " in <a href='https://www.reddit.com/r/" + subreddit + "' target='_blank'>r/" + subreddit + "</a>";
         }
         queryStatement += ".";

         $('.search_results_section').html("");
         $('#my_bootstrap_pager').addClass('hidden');


         $('.search_results_section').append(queryStatement + "<br>Results found: <b> <span id='res_number'> 0 </span></b><br>");
         $('.search_results_section').append("<b><span id='query_status_msg'><font color='red'> <span class='loading'>Hang tight, still looking for more results</font></span></span></b><br><br></div>");

     }

     function getUrl(username, subreddit, searchterms, after) {
         var url;
         subreddit = subreddit.split("r/").pop();
         if (!subreddit && !username) {
             url = 'https://www.reddit.com/r/all/comments.json';
         }

         if (subreddit && !username) {
             url = 'https://www.reddit.com/r/' + subreddit + '/comments.json';
         }
         if (username) {
             url = 'https://www.reddit.com/user/' + username + '/comments.json';
         }

         if (after != null && after != -1) {
             url += "?after=" + after;
         }
         return url;

     }

     //Get all the results
     function getResults(username, subreddit, searchterms, after) {

         var url = getUrl(username, subreddit, searchterms, after)

         if (after == null) {
             addQueryStatement(username, subreddit, searchterms);

         }
         if (after !== -1) { //While still getting results...
             currentRequest = $.ajax({
                 url: url,
                 dataType: "json",
                 success: function(commentResponse) {
                     if (commentResponse.length == 0 && after == null) {
                         addNoMatchMessege(searchterms, username, subreddit);
                     } else {
                         var comments = commentResponse.data.children
                         var nextAfter;
                         if (comments[24]) { //MORE COMMENTS AFTER
                             nextAfter = comments[24].data.name;
                         } else { //END OF COMMENTS
                             nextAfter = -1;
                             $("#query_status_msg").html("<b> Query complete.</b>");
                             $("#download_json_btn").removeClass('hidden');
                             setDownloadHref(subreddit, username, searchterms);

                         }
                         showComments(comments, searchterms, username, subreddit, nextAfter);
                         getResults(username, subreddit, searchterms, nextAfter);
                     }

                 },
                 error: function() {
                     addNoMatchMessege(searchterms, username, subreddit);
                 }

             });

         } else if ($('.page').length === 0) {
             addNoMatchMessege(searchterms, username, subreddit);
         }


     }


     //************** Pages ***************//

     $(document).on('click', '#single_page_checkbox', function() {
         if (this.checked) {
             $('#my_bootstrap_pager').addClass('hidden');
             $('.page').removeClass('hidden');
             turnPage(1);

         } else {
             if ($('.page_marker').length > 1) {
                 $('#my_bootstrap_pager').removeClass('hidden');
             }
         }
     });


     function addPageNumber(page_number) {
         if ($("#" + page_number).length == 0) {
             $('.next').removeClass('disabled');
             $('.hidden_page_number_list').append("<li id='" + page_number + "' class='page_marker'> </li>");
         }
         if (page_number === 1) {

             $('#my_bootstrap_pager').addClass('hidden');
             $('#current_page').html(page_number);


             $('#' + page_number).addClass('active');

         } else {

             $('.page_' + page_number).addClass('hidden');
             $('#my_bootstrap_pager').removeClass('hidden');

         }

         if ($('input[name="single_page_checkbox"]').is(':checked')) {

             $('.page').removeClass('hidden');
             $('#my_bootstrap_pager').addClass('hidden');

         }


         $('.current_length').html(page_number);


     }

     function prevPage() {
         if (!($('#prev').hasClass('disabled'))) {

             var previous = $('.active').attr('id') - 1;
             turnPage(previous);
         }
     }


     function nextPage() {
         if (!($('#next').hasClass('disabled'))) {
             var next = $('.active').attr('id');
             next++;
             turnPage(next);
         }
     }

     function turnPage(id) {

         if (id == 1) {
             $('.previous').addClass('disabled');
         } else {
             $('.previous').removeClass('disabled');
         }
         if (id == ($('.page_marker').length)) {
             $('.next').addClass('disabled');
         } else {
             $('.next').removeClass('disabled');
         }

         $('li').removeClass('active');
         $('.page').addClass('hidden');
         $('.page_' + id).removeClass('hidden');
         $('#' + id).addClass('active');
         $('#current_page').html("Page " + id);
     }
     //*****************************//

     //************** General ***************//

     function clean(string) {
         var ret = string.replace(/&gt;/g, '>');
         ret = ret.replace(/&lt;/g, '<');
         ret = ret.replace(/&quot;/g, '"');
         ret = ret.replace(/&amp;/g, '&');
         return ret;
     }


     function contains(string, search) {
         if (string.indexOf(search) !== -1) {
             return true;
         } else {
             return false;
         }
     };

     function sanitize(string) {
         string = string.replace(/'/g, '&#39;');
         string = string.replace(/"/g, '&quot;');
         return string;
     }

     String.prototype.replaceAll = function(search, replacement) {
         var target = this;
         return target.replace(new RegExp(search, 'ig'), replacement);
     };


     function getStringBetween(fullSearchString, preString, postString) {
         if (!(fullSearchString.includes(preString)) || !(fullSearchString.includes(preString))) {
             return "";
         }
         var preIndex = fullSearchString.indexOf(preString);
         var postStringIndex = preIndex + fullSearchString.substring(preIndex).indexOf(postString);
         return fullSearchString.substring(preIndex + preString.length, postStringIndex);
     };

     //*****************************//

     //Show comment on page if it's a match
     function showComments(comments, searchterms, username, subreddit, nextAfter) {

         for (var j = 0; j < comments.length; j++) {
             var body = clean(comments[j].data.body_html);
             var comment_subreddit = comments[j].data.subreddit;
             if (subreddit) {
                 if (comment_subreddit.toLowerCase() !== subreddit.toLowerCase()) {
                     continue;
                 }
             }
             searchterms = sanitize(searchterms);
             var searchtermsArray = getAllSearch(searchterms);
             console.log(searchtermsArray);
             var trueOrNot = doesContainSearchTerms(body, searchtermsArray);
             console.log(trueOrNot);
             if (doesContainSearchTerms(body, searchtermsArray)) {
                 match_ct = parseInt(document.getElementById("res_number").innerHTML) + 1;
                 $('#res_number').html(match_ct);

                 var permalink = comments[j].data.link_permalink + comments[j].data.id;
                 body = highlightAll(body, searchtermsArray); //Highlight search terms 
                 var page_number = Math.ceil((match_ct / 15));

                 var result = "<span class='page page_" + page_number + "'><div class='short_url'>" + "<a href='" + permalink + "' target='_blank' class='url'>" + permalink + "</a>" + "</div>" + "<div class='comment_body'>" + body + "</div><hr></span>";
                 $('.search_results_section').append(result);
                 addJsonObject(permalink, body, comment_subreddit, comments[j].data.author, comments[j].data.created_utc);
                 addPageNumber(page_number);
             }

         }
     }



     function highlightAll(body, searchtermsArray) {
         var currSearch;
         for (var i = 0; i < searchtermsArray.length; i++) {
             if (searchtermsArray[i]) {
                 currSearch = searchtermsArray[i];
                 body = body.replaceAll(currSearch, '<span class=highlight><b>' + currSearch + '</b></span>');
             }
         }
         return body;
     }

     function getAllSearch(searchterms) {
         var splitSearch = searchterms.split('&&');
         for (var i = 0; i < splitSearch.length; i++) {
         }
         return splitSearch;
     }

     function doesContainSearchTerms(body, searchtermsArray) {
         for (var i = 0; i < searchtermsArray.length; i++) {
             if (!(contains(body.toLowerCase(), searchtermsArray[i].toLowerCase()))) {
                 return false;
             }
         }
         return true;
     }

     //No matches
     function addNoMatchMessege(searchterms, username, subreddit) {
         $('.search_results_section').html("");
         $('.my_bootstrap_pager').addClass('hidden');
         $('#checkbox_section').addClass('hidden');

         var noMatchMsg = "<div class='error'>Your search for comments";
         if (username && username !== "") {
             noMatchMsg += " by user <b><a href='https://www.reddit.com/u/" + username + "' target='_blank'>/u/" + username + " </a></b>";
         }
         if (searchterms && searchterms !== "") {
             noMatchMsg += " containing <b>" + searchterms + "</b>";
         }
         if (subreddit && subreddit !== "") {
             noMatchMsg += " in <b><a href='https://www.reddit.com/r/" + subreddit + "' target='_blank'>r/" + subreddit + "</a></b>";
         }

         noMatchMsg += " did not return any matches. <br><br> <div>Possible issues:<br></div> <ul>" +
             "<li>Username, subreddit or search phrases may be spelled wrong.</li>" +
             "<li>If searching multiple search terms with &&, if you used a space ' ' before or after a search term, it will include those spaces in the search.</li>" +
             " <em>For example:</b> <b>me && you</b> will not find <b>me!</b> or a comment that <b>starts with</b> the word <b>you</b> because of the spaces after me and before you.</em></div>";
         $('.search_results_section').append(noMatchMsg);
     }



     //Preparing download
     function addJsonObject(permalink, body, subreddit, author, created_utc) {
         var date = new Date(created_utc * 1000);
         var obj = {
             "author": author,
             "created_utc": date,
             "subreddit": subreddit,
             "permalink": permalink,
             "body": body
         };
         commentObj.comments[commentObj.comments.length] = obj;

     }

     function setDownloadHref(subreddit, username, searchterms) {
         commentObj.date_fetched = getDateTime();
         var download_data = "data:text/json;charset=utf-8," + encodeURIComponent(JSON.stringify(commentObj));
         var download_name = "reddit-search";
         if (subreddit) {
             download_name += "_SUB_" + subreddit
         };
         if (username) {
             download_name += "_USER_" + username
         };
         if (searchterms) {
             download_name += "_SEARCH_" + searchterms
         };
         download_name += ".json";

         $('#download_json_btn').attr('href', download_data);
         $('#download_json_btn').attr('download', download_name);
     }

     function getDateTime() {
         var today = new Date();
         var date = today.getFullYear() + '-' + (today.getMonth() + 1) + '-' + today.getDate();
         var time = today.getHours() + ":" + today.getMinutes() + ":" + today.getSeconds();
         return date + ' ' + time;
     }