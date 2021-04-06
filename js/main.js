$(document).ready(function() {
    let tvShowsApp = (function() {
        // Variables
        let tvShowsList = [];
        let filteredTVShowsList = [];
        let tvShowProps = ['id','name','genres','rating','image','network','schedule','language','country','status'];
        let apiURL = 'https://api.tvmaze.com/shows';
        let apiSearchURL = 'https://api.tvmaze.com/search/shows?q=';
        let currentPage = 0;
        let search = null;
        let sortFactor = null;
        let debounceTimer;

        // Helper Functions
        function debounce(func,timeout=500) {
            clearTimeout(debounceTimer);
            debounceTimer = setTimeout(function() {
                func();
            },timeout);
        }

        function getAge(birthdate) {            
            let currentDate = new Date();
            let age = currentDate.getFullYear() - birthdate.getFullYear();
            // Subtract 1 from age if person's birthday hasn't occurred this year yet
            if (birthdate.getMonth() > currentDate.getMonth()) { // if person's birthday is after current month
                age -= 1;
            } else if (birthdate.getMonth() === currentDate.getMonth()) {                                 
                if (birthdate.getDay() < currentDate.getDay()) { // if person's birthday is in the current month but is before the current day
                    age -= 1;
                }
            }
            return age;
        }

        function sortShows(factor) {
            let shows = search ? filteredTVShowsList : tvShowsList;
            shows = JSON.parse(JSON.stringify(shows)); // make copy to not alter original array
            shows.sort((a,b) => {
                // String sorting
                if (factor === 'country' || factor === 'language') {
                    // check which properties (if any) are null
                    if (a[factor] && b[factor]) { 
                        let prop1 = a[factor].toLowerCase();
                        let prop2 = b[factor].toLowerCase();
                        if (prop1 > prop2 ) return 1;
                        if (prop1 === prop2) return 0;
                        if (prop1 < prop2) return -1;
                    } else if (!a[factor] && !b[factor]) {
                        return 0;
                    } else if (!a[factor] && b[factor]) {
                        return -1;
                    } else {
                        return 1;
                    }
                }
                return a[factor] - b[factor];
            });
            return shows;
        }

        // Functions to add content/data
        function add(show,filtered) {
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
            // If show object is valid, add it to appropriate array based on 'filtered' parameter (will be either true or false)
            if (isDataValid) {
                if (filtered) {                    
                    filteredTVShowsList.push(show);
                } else {
                    tvShowsList.push(show);
                }                
            }            
        }

        function addListItem(show) {            
            let listItem = $(`<li class="show list-group-item list-group-item-action"></li>`);
            $(`<button class="btn btn-block text-left" data-target="#info-modal" data-toggle="modal">${show.name}</button>`).appendTo(listItem).on('click',() => {
                showInfo(show); // open modal and display TV show details
            });
            $('#tv-shows-list').append(listItem);
        }

        function addLoadMoreButton() {
            if ($('.load-more.btn').length > 0) $('.load-more.btn').remove(); // remove any Load More buttons
            // Only add Load More button when all shows (not searched shows) are being shown
            if (search && search.length === 0 || !search) { 
                $.get(`${apiURL}?page=${currentPage+1}`, (data,status) => {
                    if (status !== 'error') {
                        $('#tv-shows').append("<button class='btn load-more'>Load More Shows</button>");
                    }
                });
            }
        }

        // Functions to get variables
        function getAll(filtered) {
            // 'filtered' parameter will be true or false
           if (filtered) {
            return filteredTVShowsList;
           } 

           return tvShowsList; 
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
            let url = search && search !== '' ? apiSearchURL+search : `${apiURL}?page=${currentPage}`; // if a search for a show has been made use apiSearchURL, otherwise use apiURL to get current page of results
            let location = currentPage === 0 && !search || search && search.length === 0 ? 'before' : 'after'; // Show the loading message at the bottom of the page if there is no search for a show and show it at the top of the page if results only include 1st page of results and no show has been searched
            showLoadingMessage(location);
                        
            return $.ajax(url).then(function(results) {
                filteredTVShowsList = [];
                results.forEach((result) => {                    
                    if (!result.name) { // if url is search url, show's properties from results are 1 level deeper in array
                        result = result.show;
                    }

                    let show = {
                        id: result.id,
                        name: result.name,
                        country: result.network ? result.network.country.name : null,
                        genres: result.genres,
                        language: result.language,
                        rating: result.rating.average ? result.rating.average : null,
                        premiered: new Date(result.premiered).getFullYear(),
                        schedule: result.schedule,
                        network: result.network ? result.network.name: null,
                        summary: result.summary,
                        status: result.status,
                        image: result.image ? result.image.medium : null
                    }
                    
                    search ? add(show,true) : add(show);  // add the show to tvShowsList array if a search has not been made and add show to filteredTVShowsList array if a search has been made
                });
                removeLoadingMessage();
            }).catch(function(error) {
                removeLoadingMessage();
            });
        }

        // Functions to show content
        function displayShows(shows) {
            // if there are shows to display
            if (shows.length > 0) {
                $('#tv-shows-list').html('');
                let sortFactor = tvShowsApp.getSortFactor();
                // if a sorting factor has been selected, sort TV shows
                if (sortFactor) {
                    shows = tvShowsApp.sortShows(sortFactor); 
                }
                
                shows.forEach((show) => tvShowsApp.addListItem(show)); // add each show to the TV shows list              
                addLoadMoreButton(); 
            } else {
                $('#tv-shows-list').html('<p>No shows found.</p>');
            }     
        }

        function showExtraInfo(id,type) {
            $.ajax(`${apiURL}/${id}/${type}`).then(function(results) {
                let carouselIndicators = ``;
                let carouselItems = ``;
                let carouselID = 'carousel-'+type;
                
                results.forEach((info,i) => {
                    let isActive = i === 0 ? 'active': '';
                    carouselIndicators += `<li data-target="${'#'+carouselID}" data-slide-to="${i}" class="${isActive}">${i+1}</li>`;
                    
                    switch(type) {
                        case 'seasons':
                            carouselItems += 
                            `
                                <div class="carousel-item ${isActive}">
                                    <div class="carousel-item-header">
                                        <h5>Season ${info.number} (${info.premiereDate.replace(/-/g,'/')} - ${info.endDate.replace(/-/g,'/')})</h5>
                                        <p><b># of Episodes:</b> ${info.episodeOrder}</p>                            
                                    </div>
                                    ${info.image ? `<img src="${info.image.medium}" class="img-fluid ${info.summary ? 'float-left': 'mx-auto'}" alt="image of season ${info.number}">`: ''}                            
                                    ${info.summary ? info.summary: ''}
                                </div>
                            `;
                            break;
                        case 'episodes':
                            carouselItems += 
                            `
                                <div class="carousel-item ${isActive}">
                                    <div class="carousel-item-header">
                                        <h5>${info.name} </h5>
                                        <p><b>Episode #${info.number}</b> (Season ${info.season})</p>
                                    </div>
                                    ${info.image ? `<img src="${info.image.medium}" class="img-fluid ${info.summary ? 'float-left': 'mx-auto'}" alt="image of episode ${info.number}">`: ''}                            
                                    ${info.summary ? info.summary: ''}
                                </div>
                            `;
                            break;
                        case 'cast':
                            
                            let castAge = getAge(new Date(info.person.birthday));                            
                            let castLife = info.person.deathday ? `<p><b>Lived:</b>${new Date(info.person.birthday).getFullYear()}-${new Date().getFullYear}`: `<p><b>Age:</b> ${castAge}`;
                            let castDataContent = info.person.country? `<p><b>Country:</b> ${info.person.country.name} </p>`: '';
                            castDataContent += castLife;
                            carouselItems += 
                            `
                                <div class="carousel-item ${isActive}">
                                    <div class="carousel-item-header">
                                        <h5 data-toggle="popover" data-content="${castDataContent}">${info.person.name} (Actor) </h5>
                                        <img src="${info.person.image.medium}" class="img-fluid mx-auto" alt="image of ${info.person.name}">
                                    </div>
                                    ${info.character.image ? `
                                        <div>
                                            <h5>${info.character.name} (Character)</h5><img src=${info.character.image.medium} class='img-fluid mx-auto' alt='image of ${info.character.name}"'>
                                        </div>`
                                        : ''
                                    }
                                </div>
                            `;
                            break;
                        case 'crew':
                            let crewAge = getAge(new Date(info.person.birthday));
                            let crewLife = info.person.deathday ? `<p><b>Lived:</b>${new Date(info.person.birthday).getFullYear()}-${new Date().getFullYear}`: `<p><b>Age:</b> ${crewAge}`;
                            let crewDataContent = info.person.country? `<p><b>Country:</b> ${info.person.country.name} </p>`: '' 
                            crewDataContent += crewLife;
                            
                            carouselItems += 
                                `
                                    <div class="carousel-item ${isActive}">
                                        <div class="carousel-item-header">
                                            <h5 data-toggle="popover" data-content="${crewDataContent}">${info.person.name} (${info.type})</h5>                                            
                                        </div>
                                        ${info.person.image ? `<img src="${info.person.image.medium}" class="img-fluid mx-auto" alt="image of${info.person.name}">`: ''}
                                    </div>
                                `;
                            break;
                    }         
                });

                let carousel = `
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
                $('body').popover({
                    container: 'body',
                    html: true,
                    placement: 'top',
                    selector: '[data-toggle="popover"]',
                    trigger: 'click hover'
                }); // use popover for more details about crew/cast members (shows when hovering/clicking on member's name)
                $('#'+type).html(carousel); // add carousel to tab content that corresponds to the type argument passed into function
            }).catch(function() {
                $('#'+type).html('An error has occurred.');
            });
        }

        function showInfo({id,name,genres,rating,image,summary,language,country,premiered,schedule,network,status}) {  
            // Remove current TV show image (if exists) before adding new image (if exists)
            if ($('.modal-body .img-container img').length > 0) $('.modal-body .img-container img').remove();
            if (image) $('.modal-body .img-container').html(`<img src="${image}" class="img-fluid mx-auto" alt="image of ${name}" />`);
            // Focus content on the first tab (summary)
            $('.nav-link, .tab-pane').removeClass('active show');
            $('#summary-tab, #summary').addClass('active');
            $('#summary').addClass('show');
            let sortingFactor = getSortFactor();
            let detailsHTML = 
            `                    
                <p><span class="country ${sortingFactor === 'country' ? 'highlighted': ''}">Country:</span> ${country ? country : 'N/A'} </p>    
                <p><span class="language ${sortingFactor === 'language' ? 'highlighted': ''}">Language:</span> ${language} </p> 
                <p><span class="premiered ${sortingFactor === 'premiered' ? 'highlighted': ''}">Premiered:</span> ${premiered} </p> 
                <p><span class="status ${sortingFactor === 'status' ? 'highlighted': ''}">Status:</span> ${status ? status: 'N/A'}</p>   
                <p><span class="network ${sortingFactor === 'network' ? 'highlighted': ''}">Network:</span> ${network ? network : 'N/A'} </p>     
                <p><span class="schedule">Schedule:</span> ${schedule.days.join(', ')} ${schedule.time ? "at " + schedule.time : ''}        
                <p><span class="rating ${sortingFactor === 'rating' ? 'highlighted': ''}">Rating:</span> ${rating ? rating : 'N/A'}</p>
                <p><span class="genres">Genres:</span>
            `;
    
            if (genres.length === 0) {
                detailsHTML += 'N/A</p>';
            } else {
                let genresArr = [];
                for (let i = 0; i < genres.length; i++) {
                    genresArr.push(genres[i])
                }
                detailsHTML += genresArr.join(', ');
                detailsHTML += '</p>'; 
            }
            
            $('.modal-title').html('').append(name);
            $('#details').html('').append(detailsHTML);
            $('#summary').html('').append(summary);

            $('.nav-link').click(function() {
                let targetTabPaneID = $(this).attr('href');
                let targetTabPaneName = targetTabPaneID.replace('#',''); // get name of tab pane that corresponds to tab link clicked
                // Make an API request to get content that matches the tab clicked and display it in a carousel  
                if (targetTabPaneName === 'seasons') showExtraInfo(id, 'seasons');
                if (targetTabPaneName === 'episodes') showExtraInfo(id, 'episodes');
                if (targetTabPaneName === 'cast') showExtraInfo(id, 'cast');
                if (targetTabPaneName === 'crew') showExtraInfo(id, 'crew');
            });
        }

        function showLoadingMessage(location) {
            // 'location' parameter will be either 'before' or 'after'
            if ($('.loading-message-container').length > 0) $('.loading-message-container').remove();
            loadingMessageDiv = $(
                `
                <div class="loading-message-container">
                    <div class="spinner-border" role="status"></div> 
                    <span>Loading&#8230;</span>
                </div>
                `
            );
            location === 'before' ? $('#tv-shows').prepend(loadingMessageDiv): $('#tv-shows').append(loadingMessageDiv);            
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
        tvShowsApp.displayShows(tvShowsApp.getAll(false));
    });
    
    $('#search').keyup(() => {
        let search = $('#search').val();
        tvShowsApp.setSearch(search.length > 0 ? search : null);

        // Delay making an API request to search for a show until user has stopped typing for .5s
        tvShowsApp.debounce(
            () => {           
                // If search is empty, do not make an API request and show all TV shows from tvShowsList array  
                if (search.length === 0) {
                    tvShowsApp.displayShows(tvShowsApp.getAll(false));
                    return;
                }
                // If search isn't empty make an API request with the search term and display the results
                tvShowsApp.loadList().then(function() {
                    tvShowsApp.displayShows(tvShowsApp.getAll(true));                           
                });            
            }
        ,500);
    });

    $('#sort-search').change(function() {
        let factor = $(this).val() === '' ? null : $(this).val();
        tvShowsApp.setSortFactor(factor);
        let filteredTVShows = tvShowsApp.getAll(true); 
        // If a search has been made, sort those resulting shows, otherwise sort the regular list of TV shows
        if (filteredTVShows.length > 0) {
            tvShowsApp.displayShows(filteredTVShows);
        } else {
            tvShowsApp.displayShows(tvShowsApp.getAll(false));
        }
    });
    
    $(document).on('click','.load-more.btn',function() {
        $(this).remove();
        // Make an API Request to get the next page of TV shows and display them
        tvShowsApp.setPage(tvShowsApp.getPage() + 1);
        tvShowsApp.loadList().then(function() {
            tvShowsApp.displayShows(tvShowsApp.getAll(false));
        });
    });
});
