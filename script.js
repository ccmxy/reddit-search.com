$(document).ready(function() {



    var currentRequest = null;

    $("#about").attr('title', 'All three search boxes can be used alone or in combo with the other two. \n\nHover over search boxes for usage details.');
    $("#user").attr('title', 'OPTIONAL: Only pull comments from specific user. Will grab user\'s most recent 1000 comments.\n\nAll three search boxes can be used alone or in combination.');
    $("#search_terms").attr('title', 'OPTIONAL: Only pull comments containing this word or phrase. If this is the only box specified it will search from most recent 1000 comments in r/all.\n\nAll three search boxes can be used alone or in combination.');
    $("#subreddit").attr('title', 'OPTIONAL: Only pull comments from this subreddit. If user is not specified, it will pull the most recent 1000 comments from that subreddit.\n\nnAll three search boxes can be used alone or in combination.');


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

        $('#after_search').val($('#after_search').val() + " user=" + username + "::")
        $('#after_search').val($('#after_search').val() + " search=" + searchterms + "::")
        $('#after_search').val($('#after_search').val() + " subreddit=" + subreddit + "::")

        $('.wrapper').addClass('hidden');
        $('#searched_results_display').removeClass('hidden');
        getQuickResults(username, subreddit, searchterms, null);

    }


    $('.after_search_container span').click(function() {
        if ($('#after_search').val() == "") {
            alert('No query entered');
        } else {
            var fullSearchString = $('#after_search').val();
            var user = getStringBetween(fullSearchString, "user=", '::');
            var subreddit = getStringBetween(fullSearchString, "subreddit=", '::');
            var search_terms = getStringBetween(fullSearchString, 'search=', '::');
            $('.search_results_section').html("");
            $('.page_markers_section').html("");
            if (checkInput()) {
                if (currentRequest != null) {
                    currentRequest.abort();
                }
                getQuickResults(user, subreddit, search_terms, null);
            }
        }
    });



    //When the user starts typing in..
    $(document).keyup(function(e) {
        if (e.which == 13) {
            if ($('#searched_results_display').hasClass('hidden')) {
                $('#search').click();
            } else {
                $('.after_search_container span').click();
            }


        } else {
            if (!($('#searched_results_display').hasClass('hidden'))) {
                $('.after_search_container span').click();
            }
        }
    });


    function getQuickResults(username, subreddit, searchterms, after) {
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
                queryStatement += " by <a href='https://www.reddit.com/u/" + username + "'>u/" + username + "</a>";
            }
            if (subreddit) {
                queryStatement += " in <a href='https://www.reddit.com/r/" + subreddit + "'>r/" + subreddit + "</a>";
            }
            queryStatement += ".";

            $('.search_results_section').html("");
            $('.search_results_section').append(queryStatement + " Results found: <b> <span id='res_number'> 0 </span></b><br>");
            $('.search_results_section').append("<input type='checkbox' id='single_page_checkbox'>Single page results<br><br>");
            $('.search_results_section').append("<b><span id='query_status_msg'><font color='red'> <span class='loading'>Hang tight, still looking for more results</font></span></span></b><br><br></div>");


        }


        if (after != -1) {
            currentRequest = $.ajax({
                url: url,
                dataType: "json",
                success: function(commentResponse) {

                    if (commentResponse.length == 0 && after == null) {
                        $('.search_results_section').html("");
                        $('.search_results_section').append(getNoMatchMessege(searchterms, username, subreddit));
                    } else {
                        var comments = commentResponse.data.children
                        var nextAfter;
                        if (comments[24]) {
                            nextAfter = comments[24].data.name;
                        } else {
                            nextAfter = -1;
                            $("#query_status_msg").html("<b> Query complete.</b>");
                            if ($("#1").length == 0) {
                                $('.search_results_section').append(getNoMatchMessege(searchterms, username, subreddit));

                            }
                        }
                        showQuickResults(comments, searchterms, username, subreddit, nextAfter);
                        getQuickResults(username, subreddit, searchterms, nextAfter);

                    }

                },
                error: function() {
                    $('.search_results_section').html("");
                    $('.search_results_section').append(getNoMatchMessege(searchterms, username, subreddit));
                }

            });

        }

    }

    function showQuickResults(comments, searchterms, username, subreddit, nextAfter) {
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
                var page_number = Math.ceil((match_ct / 5));
                if (page_number === 0) {
                    page_number = 1;
                }
                $('.search_results_section').append("<span class='page page_" + page_number + "'<div class='short_url'>" + "<a href='" + permalink + "' target='_blank' class='url'>" + permalink + "</a>" + "</div>" + "<div class='comment_body'>" + body + "<hr></div>");
                addPageNumber(page_number);
            }

        }
    }

});



$(document).on('click', '#single_page_checkbox', function() {
    if (this.checked) {
        $('#page_markers_section').addClass('hidden');
        $('.page').removeClass('hidden');


    } else {
        $('#page_markers_section').removeClass('hidden');
        turnPage(1);
    }
});


function addPageNumber(page_number) {
    if ($("#" + page_number).length == 0) {
        $('.page_markers_section').append(" <a class='page_marker' id='" + page_number + "' onclick='turnPage(" + page_number + ")'>" + page_number + "</a> ");
    }
    if (page_number === 1) {
        $('#' + page_number).addClass('bold');

    } else {
        $('.page_' + page_number).addClass('hidden');
    }
}

function turnPage(id) {
    $('.page_marker').removeClass('bold');
    $('.page').addClass('hidden');
    $('.page_' + id).removeClass('hidden');
    $('#' + id).addClass('bold');

}

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


function escapeRegExp(text) {
    return text.replace(/[-[\]'{}()*+?.,\\^$|#\s]/g, '\\$&');
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


function getNoMatchMessege(searchterms, username, subreddit) {
    if (username == "") {
        delete username;
    }
    if (searchterms == "") {
        delete searchterms;
    }
    if (subreddit == "") {
        delete subreddit;
    }
    $('.search_results_section').html("");
    var noMatchMsg = "<div class='error'><div>Your search for comments";
    if (username) {
        noMatchMsg += " by user <b><a href='https://www.reddit.com/u/" + username + "'>/u/" + username + " </a></b>";
    }
    if (searchterms) {
        noMatchMsg += " containing <b>" + searchterms + "</b>";
    }
    if (subreddit) {
        noMatchMsg += " in <b><a href='https://www.reddit.com/r/" + subreddit + "'>r/" + subreddit + "</a></b>";
    }

    noMatchMsg += " did not return any matches. <br> <div>Possible issues:</div> <br> <ul>";
    noMatchMsg += "<li>If you're searching from this page, remember that options are search=, user= and subreddit=. </li> <li>Make sure that all queiries end in '::'. For example, user=spez::</li>";
    noMatchMsg += "<li>Do not use quotes unless you actually want to search for quotes.</li>";
    noMatchMsg += "li>Example 1: <b>search=I have:: user=spez:: subreddit=ModSupport::</b></li><li>Example 2: <b>subreddit=all:: search=i wonder:: </b></li></ul></div>";

    return noMatchMsg;
}