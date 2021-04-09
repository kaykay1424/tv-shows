$(document).ready(function() {
    let tvShowsApp = (function() {
        // Variables
        const tvShowsList = []; // list of all TV shows (objects)
        const filteredTVShowsList = []; // list of searched TV shows (objects)
        const tvShowProps = ['id','name','genres','rating','image','network','schedule','language','country','status']; // properties each TV show object should have
        const apiURL = 'https://api.tvmaze.com/shows';
        const apiSearchURL = 'https://api.tvmaze.com/search/shows?q=';
        let currentPage = 0;
        let search = null; // search word(s) entered in search form <input>
        let sortFactor = null; // factor selected in search form <select> to sort TV shows
        let debounceTimer;

        // Helper Functions
        function debounce(func,timeout=500) {
            clearTimeout(debounceTimer);
            debounceTimer = setTimeout(function() {
                func();
            },timeout);
        }

        function getAge(birthdate) {            
            const currentDate = new Date();
            const currentMonth = currentDate.getMonth();
            const currentYear = currentDate.getFullYear();
            const birthMonth = birthdate.getMonth();
            const birthYear = birthdate.getFullYear();

            return birthMonth > currentMonth // if person's birthday is after current month
            || birthMonth === currentMonth && birthdate.getDay() < currentDate.getDay() // if person's birthday is in the current month but is before the current day                        
            ? (currentYear - birthYear) - 1 // Subtract 1 from age if person's birthday hasn't occurred this year yet
            : currentYear - birthYear
        }

        function getCarouselItem(type,info,isActive) {
            let carouselItem;
            const image = info.image ? info.image.medium : null;
            const personImage = info.person && info.person.image ? info.person.image.medium : null;
            const summary = info.summary;
            switch(type) {
                case 'seasons': {
                    const endDate = info.endDate;
                    const premiereDate = info.premiereDate;
                    const seasonLength = premiereDate === endDate ? premiereDate : `${premiereDate.replace(/-/g,'/')} - ${endDate.replace(/-/g,'/')}`; // if season premiered and ended on same date only display premiered date
                    const seasonNumber = info.number;
                    carouselItem = 
                    `
                        <div class="carousel-item ${isActive}">
                            <div class="carousel-item-header">
                                <h5>Season ${seasonNumber} (${seasonLength})</h5>
                                <p><b># of Episodes:</b> ${info.episodeOrder ? info.episodeOrder : 'N/A'}</p>                            
                            </div>
                            ${image ? `<img src="${image}" class="img-fluid ${summary ? 'float-left': 'mx-auto'}" alt="image of season ${seasonNumber}">`: ''}                            
                            ${summary ? summary: ''}
                        </div>
                    `;
                    break;
                }                            
                case 'episodes': {
                    const episodeNum = info.number;
                    carouselItem = 
                    `
                        <div class="carousel-item ${isActive}">
                            <div class="carousel-item-header">
                                <h5>${info.name} </h5>
                                <p><b>Episode #${episodeNum}</b> (Season ${info.season})</p>
                            </div>
                            ${image ? `<img src="${image}" class="img-fluid ${summary ? 'float-left': 'mx-auto'}" alt="image of episode ${episodeNum}">`: ''}                            
                            ${summary ? summary: ''}
                        </div>
                    `;
                    break;
                }
                case 'cast': {  
                    const castBirthday = new Date(info.person.birthday);    
                    const actorName = info.person.name;                      
                    const castAge = getAge(castBirthday);
                    const castLife = info.person.deathday ? `<p><b>Lived:</b>${castBirthday.getFullYear()}-${new Date().getFullYear}`: `<p><b>Age:</b> ${castAge}`;
                    const characterImage =  info.character.image ? info.character.image.medium: '';                         
                    const characterName = info.character.name;
                    let castDataContent = info.person.country? `<p><b>Country:</b> ${info.person.country.name} </p>`: '';
                    castDataContent += castLife;
                    carouselItem = 
                    `
                        <div class="carousel-item ${isActive}">
                            <div class="carousel-item-header">
                                <h5 data-toggle="popover" data-content="${castDataContent}">${actorName} (Actor) </h5>
                                ${personImage ? `<img src="${personImage}" class="img-fluid mx-auto" alt="image of ${actorName}">`:''}
                            </div>
                            ${characterImage ? `
                                <div>
                                    <h5>${characterName} (Character)</h5><img src=${characterImage} class='img-fluid mx-auto' alt='image of ${characterName}"'>
                                </div>`
                                : ''
                            }
                        </div>
                    `;
                    break;
                }                            
                case 'crew': {
                    const crewBirthdate = new Date(info.person.birthday);                            
                    const crewAge = getAge(crewBirthdate);
                    const crewLife = info.person.deathday ? `<p><b>Lived:</b>${crewBirthdate.getFullYear()}-${new Date().getFullYear}`: `<p><b>Age:</b> ${crewAge}`;
                    const crewName = info.person.name;
                    let crewDataContent = info.person.country? `<p><b>Country:</b> ${info.person.country.name} </p>`: '' 
                    crewDataContent += crewLife;                        
                    carouselItem = 
                        `
                            <div class="carousel-item ${isActive}">
                                <div class="carousel-item-header">
                                    <h5 data-toggle="popover" data-content="${crewDataContent}">${crewName} (${info.type})</h5>                                            
                                </div>
                                ${personImage ? `<img src="${personImage}" class="img-fluid mx-auto" alt="image of${crewName}">`: ''}
                            </div>
                        `;
                    break;
                }                            
            }  
            return carouselItem; 
        }

        function sortShows(factor) {
            return [... (search ? filteredTVShowsList : tvShowsList) ]  // make copy to not alter original array
            .sort((a,b) => {
                // String sorting
                if (factor === 'country' || factor === 'language' || factor === 'network' || factor === 'status') {
                    const prop1 = a[factor] ? a[factor].toLowerCase().replace(/\s/g,''): null; 
                    const prop2 = b[factor] ? b[factor].toLowerCase().replace(/\s/g,''): null; 
                    // check which properties (if any) are null
                    if (((prop1 && prop2) && (prop1 > prop2)) || (prop1 && !prop2) ) return 1; // if both properties are not null and 1st property has a greater value than 2nd property or 1st property is not null but 2nd property is null (has less value)
                    if (((prop1 && prop2) && (prop1 === prop2)) || (!prop1 && !prop2)) return 0; // if both properties are not null and have the same value or both properties are null
                    if (((prop1 && prop2) && (prop1 < prop2)) || (!prop1 && prop2)) return -1; // if both properties are not null and 2nd property has a greater value than 1st property or 1st property is null (has less value) but 2nd property is not null
                }
                return a[factor] - b[factor];
            });
        }

        // Functions to add content/data
        function add(show,typeOfList) {
            let isDataValid = true;
            // Check if show is an object and contains all necessary properties
            if (typeof show === 'object') {
                for (let i = 0; i < tvShowProps.length; i++) {
                    if (Object.keys(show).indexOf(tvShowProps[i]) < 0) {
                        isDataValid = false;
                        break;
                    }
                }               
            } 
            // If show object is valid, add it to appropriate array based on 'typeOfList' parameter (will be either 'all' or 'filtered')
            if (isDataValid) {
                typeOfList === 'filtered' ? filteredTVShowsList.push(show): tvShowsList.push(show);               
            }            
        }

        function addListItem(show) {            
            const listItem = $(`<li class="show list-group-item list-group-item-action"></li>`);
            $(`<button class="btn btn-block text-left" data-target="#info-modal" data-toggle="modal">${show.name}</button>`).appendTo(listItem).on('click',() => {
                showInfo(show); // open modal and display TV show details
            });
            $('#tv-shows-list').append(listItem);
        }

        function addLoadMoreButton() {
            const loadMoreButton = $('.load-more');
            if (loadMoreButton.length > 0) loadMoreButton.remove(); // remove any Load More buttons
            // Only add Load More button when all shows (not searched shows) are being shown
            if (search && search.length === 0 || !search) { 
                $.ajax(`${apiURL}?page=${currentPage+1}`).then(() => {
                    $('#tv-shows').append('<button class="btn load-more">Load More Shows</button>');
                });
            }
        }

        // Functions to get variables
        function getAll(typeOfList) {
            // 'typeOfList' parameter will be 'all' or 'filtered'  
           return typeOfList === 'filtered' ? filteredTVShowsList : tvShowsList; 
        }

        function getPage() {
            return currentPage;
        }

        function getSortFactor() {
            return sortFactor;
        }

        // Functions to set variables
        function setPage(page) {
            currentPage = page;
        }
        
        function setSearch(term) {
            search = term;
        }

        function setSortFactor(factor) {
            sortFactor = factor;
        }

        // Functions to retrieve data from API
        function loadList() {
            const url = search ? apiSearchURL+search : `${apiURL}?page=${currentPage}`; // if a search for a show has been made use apiSearchURL, otherwise use apiURL to get current page of results
            const location = currentPage === 0 && !search || search ? 'before' : 'after'; // Show the loading message at the bottom of the page if there is no search for a show and show it at the top of the page if results only include 1st page of results and no show has been searched
            showLoadingMessage('#tv-shows',location);
                        
            return $.ajax(url).then(function(results) {
                if (search) filteredTVShowsList.length = 0; // empty array so it will only hold current searched TV shows
                results.forEach((result) => {                    
                    if (!result.name) { // if url is search url, show's properties from results are 1 level deeper in array
                        result = result.show;
                    }

                    const show = {
                        id: result.id,
                        name: result.name,
                        country: result.network ? result.network.country.name : null,
                        genres: result.genres ? result.genres : null,
                        language: result.language ? result.language : null,
                        rating: result.rating.average ? result.rating.average : null,
                        premiered: new Date(result.premiered).getFullYear(),
                        schedule: result.schedule ? result.schedule : null,
                        network: result.network ? result.network.name: null,
                        summary: result.summary ? result.summary : null,
                        status: result.status ? result.status : null,
                        image: result.image ? result.image.medium : null
                    }
                    
                    search ? add(show,'filtered') : add(show,'all');  // add the show to tvShowsList array if a search has not been made and add show to filteredTVShowsList array if a search has been made
                });
                removeLoadingMessage();
            }).catch(function() {
                removeLoadingMessage();
            });
        }

        // Functions to show content
        function displayShows(shows) {
            // Reset all content (not search form) before adding new content
            $('#tv-shows-list').empty(); 
            $('.load-more,.no-results-message').remove();
            // if there are shows to display
            if (shows.length > 0) {                
                const sortFactor = tvShowsApp.getSortFactor();
                // if a sorting factor has been selected, sort TV shows
                if (sortFactor) {
                    shows = tvShowsApp.sortShows(sortFactor); 
                }
                
                shows.forEach((show) => tvShowsApp.addListItem(show)); // add each show to the TV shows list              
                addLoadMoreButton(); 
            } else {
                $('#tv-shows').prepend('<div class="alert alert-warning no-results-message">No shows found.</div>');
            }     
        }

        function showExtraInfo(id,type) {
            // 'id' paramenter is id of show and will be a number
            // 'type' parameter is type of content to display (e.g seasons, cast)
            showLoadingMessage('.tab-pane.active','before');
            let noResults = false;
            let content;
            $.ajax(`${apiURL}/${id}/${type}`).then(function(results) {
                let carouselIndicators = ``;
                let carouselItems = ``;
                let carouselID = 'carousel-'+type;

                if (results.length === 0) {
                    noResults = true;
                }

                results.forEach((info,i) => {  
                    const isActive = i === 0 ? 'active': '';                  
                    carouselIndicators += `<li data-target="${'#'+carouselID}" data-slide-to="${i}" class="${isActive}">${i+1}</li>`;
                    carouselItems += getCarouselItem(type,info,isActive);                         
                });
                
                if (noResults) {
                    content = '<p>No info found.</p>';
                } else {
                    const carousel = `
                        <div id="${carouselID}" class="carousel slide" data-interval="false">                        
                            <div class="carousel-inner">${carouselItems}</div>   
                            <div class="carousel-controls">                     
                                <a class="carousel-control-prev" href="${'#'+carouselID}" role="button" data-slide="prev">
                                    <span class="carousel-control-prev-icon" aria-hidden="true"></span>
                                    <span class="sr-only">Previous</span>
                                </a>
                                <a class="carousel-control-next" href="${'#'+carouselID}" role="button" data-slide="next">
                                    <span class="carousel-control-next-icon" aria-hidden="true"></span>
                                    <span class="sr-only">Next</span>
                                </a>
                                <div class="carousel-indicators-container">
                                    <ol class="carousel-indicators">${carouselIndicators}</ol>
                                </div>                            
                            </div>
                        </div>
                    `;
                    content = carousel;
                    $('body').popover({
                        container: 'body',
                        html: true,
                        placement: 'top',
                        selector: '[data-toggle="popover"]',
                        trigger: 'click hover'
                    }); // use popover for more details about crew/cast members (shows when hovering/clicking on member's name)
                }
        
                removeLoadingMessage();
                $('#'+type).append(content); // add content to tab content that corresponds to the type argument passed into function
            }).catch(function() {
                removeLoadingMessage();
                $('#'+type).append('<p>An error has occurred.</p>'); // add error message to tab content that corresponds to the type argument passed into function
            });            
        }

        function showInfo({id,name,genres,rating,image,summary,language,country,premiered,schedule,network,status}) {  
            const sortingFactor = getSortFactor();
            let detailsHTML = 
            `                    
                <p><span class="country ${sortingFactor === 'country' ? 'highlighted': ''}">Country:</span> ${country ? country : 'N/A'} </p>    
                <p><span class="language ${sortingFactor === 'language' ? 'highlighted': ''}">Language:</span> ${language ? language : 'N/A'} </p> 
                <p><span class="premiered ${sortingFactor === 'premiered' ? 'highlighted': ''}">Premiered:</span> ${premiered ? premiered : 'N/A'} </p> 
                <p><span class="status ${sortingFactor === 'status' ? 'highlighted': ''}">Status:</span> ${status ? status: 'N/A'}</p>   
                <p><span class="network ${sortingFactor === 'network' ? 'highlighted': ''}">Network:</span> ${network ? network : 'N/A'} </p>     
                <p><span class="schedule">Schedule:</span> ${schedule.time.length > 0 || schedule.days.length > 0 ? `${schedule.days.join(', ')} ${schedule.time ? `at ${schedule.time}` : ''} `: 'N/A'}      
                <p><span class="rating ${sortingFactor === 'rating' ? 'highlighted': ''}">Rating:</span> ${rating ? rating : 'N/A'}</p>
                <p><span class="genres">Genres:</span>
            `;
    
            if (genres.length === 0) {
                detailsHTML += 'N/A</p>';
            } else {
                const genresArr = [];
                for (let i = 0; i < genres.length; i++) {
                    genresArr.push(genres[i])
                }
                detailsHTML += genresArr.join(', ');
                detailsHTML += '</p>'; 
            }
            
            // Reset modal content before adding new content
            if (image) $('.modal-body .img-container').empty().append(`<img src="${image}" class="img-fluid mx-auto" alt="image of ${name}" />`);
            $('.modal-title').empty().append(name);
            $('.tab-pane').each(function() {
                $(this).empty();
                if ($(this).prop('id') === 'details') $(this).append(detailsHTML);
                if ($(this).prop('id') === 'summary') $(this).append(summary);
            });

            // Focus content on the first tab (summary)
            $('.nav-link, .tab-pane').removeClass('active show');
            $('#summary-tab, #summary').addClass('active');
            $('#summary').addClass('show');

            $('.nav-link').click(function() {
                const targetTabPaneID = $(this).attr('href');
                const targetTabPaneName = targetTabPaneID.replace('#',''); // get name of tab pane that corresponds to tab link clicked
                // Make an API request to get content that matches the tab clicked and display it in a carousel  
                // Use debounce() so API request will only run once per click and only if the content has not already been loaded and added to tab content 
                if (targetTabPaneName === 'seasons' && $(targetTabPaneID).html().length === 0) debounce(() => showExtraInfo(id, 'seasons'));
                if (targetTabPaneName === 'episodes'  && $(targetTabPaneID).html().length === 0) debounce(() => showExtraInfo(id, 'episodes'));
                if (targetTabPaneName === 'cast'  && $(targetTabPaneID).html().length === 0) debounce(() => showExtraInfo(id, 'cast'));
                if (targetTabPaneName === 'crew'  && $(targetTabPaneID).html().length === 0) debounce(() => showExtraInfo(id, 'crew'));
            });
        }

        function showLoadingMessage(selector, location) {
            // 'selector' parameter will be css selector
            // 'location' parameter will either be 'before' (prepend to selector) or 'after' (append to selector)

            if ($('.loading-message-container').length > 0) $('.loading-message-container').remove();
            const loadingMessageDiv = $(
                `
                <div class="loading-message-container">
                    <div class="spinner-border" role="status"></div> 
                    <span>Loading&#8230;</span>
                </div>
                `
            );
                      
            location === 'prepend' ? $(selector).prepend(loadingMessageDiv) : $(selector).append(loadingMessageDiv);
        }

        // Functions to remove content
        function removeLoadingMessage() {
            $('.loading-message-container').remove();
        }

        return {
            add,
            addListItem,
            addLoadMoreButton,
            debounce,
            displayShows,
            loadList,
            getAll,
            getPage,
            getSortFactor,
            setPage,
            setSearch,
            setSortFactor,
            sortShows
        };
    })();

    // Make an API request to get TV shows and display them
    tvShowsApp.loadList().then(function() {
        tvShowsApp.displayShows(tvShowsApp.getAll('all'));
    });
    
    $('#search').keyup(() => {
        const search = $('#search').val();
        tvShowsApp.setSearch(search.length > 0 ? search : null);

        // Delay making an API request to search for a show until user has stopped typing for .5s
        tvShowsApp.debounce(
            () => {           
                // If search is empty, do not make an API request and show all TV shows from tvShowsList array  
                if (search.length === 0) {
                    tvShowsApp.displayShows(tvShowsApp.getAll('all'));
                    return;
                }
                // If search isn't empty make an API request with the search term and display the results
                tvShowsApp.loadList().then(function() {
                    tvShowsApp.displayShows(tvShowsApp.getAll('filtered'));                           
                });            
            }
        ,500);
    });

    $('#sort-search').change(function() {
        tvShowsApp.setSortFactor($(this).val() === '' ? null : $(this).val()); // Set sortingFactor to option selected or to null if no factor was chosen        
        const filteredTVShows = tvShowsApp.getAll('filtered');
        filteredTVShows.length > 0 ? tvShowsApp.displayShows(filteredTVShows) : tvShowsApp.displayShows(tvShowsApp.getAll('all')); // If a search has been made, sort those resulting shows, otherwise sort the regular list of TV shows
    });
    
    $(document).on('click', '.load-more', function() {
        $(this).remove();
        // Make an API Request to get the next page of TV shows and display them
        tvShowsApp.setPage(tvShowsApp.getPage() + 1);
        tvShowsApp.loadList().then(function() {
            tvShowsApp.displayShows(tvShowsApp.getAll('all'));
        });
    });
});
