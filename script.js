     var currentRequest = null;
     var commentObj =   {"date_fetched":"YYYY-M-DD H:MM:SS", "comments" : []};      

     //When the user starts typing in..
     $(document).keyup(function(e) {
         if ((e.which == 13) && $('#searched_results_display').hasClass('hidden')) { //if enter pressed and on front page
             $('#search').click();
         } else {
             if (!($('#searched_results_display').hasClass('hidden'))) {
                 if ($('#after_search').is(":visible")) {
                     $('.after_search_container span').click();
                 } else {
                     mobileKeyPress();
                 }
             }
         }
     });


     function checkInput() {
         if ($('#search_terms').val() == "" && $('#subreddit').val() == "" && $('#user').val() == "") {
             alert('Please enter a something into one, two, or all three boxes to perform a comment search.');
             return false;
         } else {
             return true;
         }
     }

     $('#search').click(function() {
         if (checkInput()) {
             $('#after_search').val("");
             search();
         }
     });


     function search() {
         var username = $('#user').val();
         var searchterms = $('#search_terms').val();
         var subreddit = $('#subreddit').val();

         $('#after_search').val($('#after_search').val() + " user=" + username + "::");
         $('#after_search').val($('#after_search').val() + " search=" + searchterms + "::");
         $('#after_search').val($('#after_search').val() + " subreddit=" + subreddit + "::");

         $('#user_mobile').val(username);
         $('#search_mobile').val(searchterms);
         $('#subreddit_mobile').val(subreddit);


         $('.wrapper').addClass('hidden');
         $('#searched_results_display').removeClass('hidden');
         $('#checkbox_section').removeClass('hidden');
         getResults(username, subreddit, searchterms, null);
     }

     function mobileKeyPress() {
         $('#after_search').val(" user=" + $('#user_mobile').val() + "::");
         $('#after_search').val($('#after_search').val() + " search=" + $('#search_mobile').val() + "::");
         $('#after_search').val($('#after_search').val() + " subreddit=" + $('#subreddit_mobile').val() + "::");
         $('.after_search_container span').click();
     }


     $('.after_search_container span').click(function() {
         $('.hidden_page_number_list').html("");
         $('.search_results_section').html("");
         $('#download_json_btn').addClass('hidden');
         $('#my_bootstrap_pager').addClass('hidden');
         $('#current_page').html("Page 0");
         $('#current_length').html("0");

         var fullSearchString = $('#after_search').val();
         var username = getStringBetween(fullSearchString, "user=", '::');
         var subreddit = getStringBetween(fullSearchString, "subreddit=", '::');
         var searchterms = getStringBetween(fullSearchString, 'search=', '::');

         //In case for some reason we wanted to rapidly switch from desktop to mobile...
         $('#user_mobile').val(username);
         $('#search_mobile').val(searchterms);
         $('#subreddit_mobile').val(subreddit);


         if (checkInput()) {
             if (currentRequest != null) {
                 currentRequest.abort();
             }

             $('#checkbox_section').removeClass('hidden');
             getResults(username, subreddit, searchterms, null);
         }
     });




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

     //Get all the results
     function getResults(username, subreddit, searchterms, after) {
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

         if (after == null) {
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
         if (after !== -1) {
             currentRequest = $.ajax({
                 url: url,
                 dataType: "json",
                 success: function(commentResponse) {

                     if (commentResponse.length == 0 && after == null) {
                         addNoMatchMessege(searchterms, username, subreddit);
                     } else {
                         var comments = commentResponse.data.children
                         var nextAfter;
                         if (comments[24]) {
                             nextAfter = comments[24].data.name;
                         } else {
                             nextAfter = -1;
                             $("#query_status_msg").html("<b> Query complete.</b>");
                             $("#download_json_btn").removeClass('hidden');
                            setDownloadHref(subreddit, username, searchterms);



                         }
                         showComment(comments, searchterms, username, subreddit, nextAfter);
                         getResults(username, subreddit, searchterms, nextAfter);
                     }

                 },
                 error: function() {
                     addNoMatchMessege(searchterms, username, subreddit);
                     $('#checkbox_section').addClass('hidden');
                 }

             });


         } else if ($('.page').length === 0) {
             addNoMatchMessege(searchterms, username, subreddit);
         }


     }

     //Show comment on page if it's a match
     function showComment(comments, searchterms, username, subreddit, nextAfter) {

         for (var j = 0; j < comments.length; j++) {
             var body = clean(comments[j].data.body_html);
             var comment_subreddit = comments[j].data.subreddit;
             if (subreddit) {
                 if (comment_subreddit.toLowerCase() !== subreddit.toLowerCase()) {
                     continue;
                 }
             }
             searchterms = sanitize(searchterms);
             if (contains(body.toLowerCase(), searchterms.toLowerCase())) {
                 match_ct = parseInt(document.getElementById("res_number").innerHTML) + 1;
                 $('#res_number').html(match_ct);

                 var permalink = comments[j].data.link_permalink + comments[j].data.id;
                 if (searchterms) {
                     body = body.replaceAll(searchterms, '<span class=highlight><b>' + searchterms + '</b></span>');
                 }
                 var page_number = Math.ceil((match_ct / 15));

                 var result = "<span class='page page_" + page_number + "'><div class='short_url'>" + "<a href='" + permalink + "' target='_blank' class='url'>" + permalink + "</a>" + "</div>" + "<div class='comment_body'>" + body + "</div><hr></span>";
                 $('.search_results_section').append(result);
                 addJsonObject(permalink, body, comment_subreddit, comments[j].data.author, comments[j].data.created_utc);
                 addPageNumber(page_number);
             }

         }
     }

     //No matches
     function addNoMatchMessege(searchterms, username, subreddit) {
         $('.search_results_section').html("");
         $('.my_bootstrap_pager').addClass('hidden');
         $('#checkbox_section').addClass('hidden');

         var noMatchMsg = "<div class='error'><div>Your search for comments";
         if (username && username !== "") {
             noMatchMsg += " by user <b><a href='https://www.reddit.com/u/" + username + "' target='_blank'>/u/" + username + " </a></b>";
         }
         if (searchterms && searchterms !== "") {
             noMatchMsg += " containing <b>" + searchterms + "</b>";
         }
         if (subreddit && subreddit !== "") {
             noMatchMsg += " in <b><a href='https://www.reddit.com/r/" + subreddit + "' target='_blank'>r/" + subreddit + "</a></b>";
         }

         noMatchMsg += " did not return any matches. <br> <div>Possible issues:</div> <br> <ul>" +
             "<li>Do not use quotes unless you actually want to search for quotes.</li>" +
             "<li>Non-mobile site: make sure that all queiry options end in '::'. For example, user=spez::</li>" +
             "<li>Example 1: <b>search=I have:: user=spez:: subreddit=ModSupport::</b></li><li>Example 2: <b>subreddit=all:: search=i wonder:: </b></li></ul></div>";

         $('.search_results_section').append(noMatchMsg);
     }



     //Preparing download

     function addJsonObject(permalink, body, subreddit, author, created_utc){
        var date = new Date(created_utc * 1000);
        var obj = { "author" : author, "created_utc" : date, "subreddit" : subreddit, "permalink" : permalink, "body" : body };          
        commentObj.comments[commentObj.comments.length] = obj;

     }

     function setDownloadHref(subreddit, username, searchterms){
        commentObj.date_fetched = getDateTime();
        var download_data = "data:text/json;charset=utf-8," + encodeURIComponent(JSON.stringify(commentObj));
        var download_name = "reddit-search";
        if(subreddit) {download_name += "_SUB_" + subreddit}; 
        if(username) {download_name += "_USER_" + username}; 
        if(searchterms ) {download_name += "_SEARCH_" + searchterms}; 
        download_name += ".json";

        $('#download_json_btn').attr('href', download_data);
        $('#download_json_btn').attr('download', download_name);
     }

     function getDateTime(){
        var today = new Date();
        var date = today.getFullYear()+'-'+(today.getMonth()+1)+'-'+today.getDate();
        var time = today.getHours() + ":" + today.getMinutes() + ":" + today.getSeconds();
        return date+' '+time;
     }
