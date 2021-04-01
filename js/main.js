$(document).ready(function() {
    let tvShowsApp = (function() {
        let tvShowsList = [];
        let filteredTVShowsList = [];
        let tvShowProps = ['name','genres','rating','image,network,schedule,language,country'];
        let apiURL = 'https://api.tvmaze.com/shows';
        let apiSearchURL = 'https://api.tvmaze.com/search/shows?q=';
        let currentPage = 0;
        let search = null;
        let sortFactor = null;

        function sortShows(factor) {
            let shows = search ? filteredTVShowsList : tvShowsList;
            shows = JSON.parse(JSON.stringify(shows)); // make copy to not alter original array
            shows.sort((a,b) => {
                return a[factor] - b[factor];
            });
            return shows;
        }

        function debounce(func,timer,timeout) {
            clearTimeout(timer);
            timer = setTimeout(function() {
                func();
            },timeout); 
        }

        function add(show,filtered) {
            let isDataValid = true;

            if (typeof show === 'object') {
                for (let i = 0; i < tvShowProps.length; i++) {
                    if (Object.keys(show).indexOf(tvShowProps[i]) < 0) {
                        isDataValid = false;
                        break;
                    }
                }               
            } 

            if (isDataValid) {
                if (filtered) {                    
                    filteredTVShowsList.push(show);
                } else {
                    tvShowsList.push(show);
                }                
            }            
        }

        function addLoadMoreButton() {
            let tvShowsDiv = document.getElementById('tv-shows');
            let loadMoreButton = document.querySelector('.load-more.btn');
            
            if (loadMoreButton) {
                tvShowsDiv.removeChild(loadMoreButton);
            }

            if (search && search.length === 0 || !search) { // only add Load More button when results from all shows (not searched shows) are being shown
                console.log(search)
                $.get(`${apiURL}?page=${currentPage+1}`, (data,status) => {
                    if (status !== 'error') {
                        loadMoreButton = document.createElement('button');
                        loadMoreButton.innerText = 'Load More Shows';
                        loadMoreButton.classList.add('btn','load-more');
                        tvShowsDiv.appendChild(loadMoreButton);
                    }
                });
            }
        }

        function addListItem(show) {            
            let list = document.querySelector('#tv-shows-list');
            let listItem = document.createElement('li');
            let button = document.createElement('button');            
            button.classList.add('btn');
            button.addEventListener('click', function() {
                showInfo(show);
            });
            button.innerText = show.name;            
            listItem.classList.add('show');
            listItem.appendChild(button);
            list.appendChild(listItem);
        }

        function getAll(filtered) {
           if (filtered) {
            return filteredTVShowsList;
           } 

           return tvShowsList; 
        }

        function getPage() {
            return currentPage;
        }

        function setPage(page) {
            currentPage = page;
        }
        
        function setSearch(term) {
            search = term;
        }

        function getSortFactor() {
            return sortFactor;
        }

        function setSortFactor(factor) {
            sortFactor = factor;
        }

        function displayShows(shows) {
            if (shows.length > 0) {
                $('#tv-shows-list').html('');
                let sortFactor = tvShowsApp.getSortFactor();
                if (sortFactor) {
                    shows = tvShowsApp.sortShows(sortFactor);
                }
                shows.forEach((show) => tvShowsApp.addListItem(show));  
                addLoadMoreButton(); 
            } else {
                $('#tv-shows-list').html('<p>No shows found.</p>');
            }     
        }

        function loadList() {
            let url = search && search !== '' ? apiSearchURL+search : `${apiURL}?page=${currentPage}`; 
            let location = currentPage === 0 && !search || search && search.length === 0 ? 'before' : 'after';
            showLoadingMessage(location);
                        
            return fetch(url).then(function(response) {
                return response.json();
            }).then(function(results) {
                filteredTVShowsList = [];
                results.forEach((result) => {
                    console.log(result)
                    if (!result.image) {
                        console.log(result)
                    }
                    
                    if (!result.name) { // if url is search url, show properties from results are 1 level deeper in array
                        result = result.show;
                    }

                    let show = {
                        name: result.name,
                        country: result.network ? result.network.country.name : null,
                        genres: result.genres,
                        language: result.language,
                        rating: result.rating.average ? result.rating.average : null,
                        premiered: new Date(result.premiered).getFullYear(),
                        schedule: result.schedule,
                        network: result.network ? result.network.name: null,
                        summary: result.summary,
                        image: result.image ? result.image.medium : null
                    }
                    
                    search ? add(show,true) : add(show);  
                });
                hideLoadingMessage();
            }).catch(function(error) {
                console.log(error)
                hideLoadingMessage();
            });
        }

        function hideLoadingMessage() {
            let loadingMessageDiv = document.querySelector('.loading-message');
            let tvShowsDiv = document.getElementById('tv-shows');
            tvShowsDiv.removeChild(loadingMessageDiv);
        }

        function showLoadingMessage(location) {
            let loadingMessageDiv = document.querySelector('.loading-message');
            
            if (loadingMessageDiv) {
                document.body.removeChild(loadingMessageDiv);
            }

            loadingMessageDiv = document.createElement('div');
            loadingMessageDiv.innerHTML = 'Loading &#8230;'
            loadingMessageDiv.classList.add('loading-message');
            let tvShowsDiv = document.getElementById('tv-shows');
            let tvShowsList = document.getElementById('tv-shows-list');
            
            if (location === 'before') {
                tvShowsDiv.insertBefore(loadingMessageDiv,tvShowsList);
            } else {
                tvShowsDiv.appendChild(loadingMessageDiv);
            }
        }

        function hideInfo() {
            let infoDiv = document.querySelector('.info');
            let containerDiv = document.querySelector('.container');
            document.body.removeChild(infoDiv);
            containerDiv.style.opacity = 1;
        }

        function showInfo({name,genres,rating,image,summary,language,country,premiered,schedule,network}) {
            let infoDiv = document.querySelector('.info');
            let containerDiv = document.querySelector('.container');

            if (infoDiv) {
                document.body.removeChild(infoDiv);
            }

            infoDiv = document.createElement('div');
            let infoHtml = `
                <div class="info__container">
                    <span class="close">&#10008;</span>
            `;

            if (image) {
                infoHtml += `
                    <div>
                        <img src="${image}" alt="image of ${name}" />
                    </div>
                `;
            }
                    
            infoHtml+= `
            <div>
                <h2>${name}</h2>
                <ul class="tabs">
                    <li class="tabs-item active" data-item="summary">Summary</li> 
                    <li class="tabs-item" data-item="details">Details</li>
                </ul>
                    <div class="visible" data-content="summary">${summary}</div>    
                    <div data-content="details">
                        <p><b>Country:</b> ${country ? country : 'N/A'} </p>    
                        <p><b>Language:</b> ${language} </p> 
                        <p><b>Premiered:</b> ${premiered} </p>    
                        <p><b>Network:</b> ${network} </p>     
                        <p><b>Schedule:</b> ${schedule.days.join(', ')} ${schedule.time ? "at " + schedule.time : ''}        
                        <p><b>Rating:</b> ${rating ? rating : 'N/A'}
            `;
                
            infoHtml += `</p>
                <p><b>Genres:</b>
            `;
            
            if (genres.length === 0) {
                infoHtml += `N/A</p>`;
            } else {
                let genresArr = [];
                for (let i = 0; i < genres.length; i++) {
                    genresArr.push(genres[i])
                }
                infoHtml += genresArr.join(', ');
                infoHtml += `</p>`; 
            }

            infoHtml += `
                        </div>                  
                    </div>                    
                </div>
            `;
            infoDiv.classList.add('info');
            infoDiv.innerHTML = infoHtml;
            document.body.appendChild(infoDiv);
            infoDiv.querySelector('.close').addEventListener('click', hideInfo);
            containerDiv.addEventListener('click', function(e) {
                console.log(e.target.parentElement.classList);
                if (!e.target.classList.contains('show') && !e.target.parentElement.classList.contains('show')) {
                    hideInfo();
                }
            });

            window.addEventListener('keydown', function(e) {
                if (e.key === 'Escape' && document.querySelector('.info')) {
                    hideInfo();
                }
            });

            containerDiv.style.opacity = 0.5;
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

    tvShowsApp.loadList().then(function() {
        tvShowsApp.displayShows(tvShowsApp.getAll(false));
    });
    
    $('#search').keyup(() => {
        let search = $('#search').val();
        let timer;
        
        tvShowsApp.debounce(
            () => {                
                if (search.length === 0) {
                    console.log('empty search')
                    tvShowsApp.setSearch(null);
                    tvShowsApp.displayShows(tvShowsApp.getAll(false));
                    return;
                }
                tvShowsApp.setSearch(search);
                tvShowsApp.loadList().then(function() {
                    tvShowsApp.displayShows(tvShowsApp.getAll(true));                           
                });
            }
        ,timer,500);
    });

    $('#sort-search').change(function() {
        let factor = $(this).val() === '' ? null : $(this).val();
        tvShowsApp.setSortFactor(factor);
        let filteredTVShows = tvShowsApp.getAll(true).length; 
        if (filteredTVShows.length > 0) {
            tvShowsApp.displayShows(filteredTVShows);
        } else {
            tvShowsApp.displayShows(tvShowsApp.getAll(false));
        }
    });
    
    $(document).on('click','.load-more.btn',function() {
        $(this).remove();
        tvShowsApp.setPage(tvShowsApp.getPage() +1);
        tvShowsApp.loadList().then(function() {
            tvShowsApp.displayShows(tvShowsApp.getAll(false));
        });
    });

    $(document).on('click', '.tabs-item', function() {
        $('.tabs-item').removeClass('active');
        $('[data-content]').removeClass('visible');
        $(this).addClass('active');
        let item = $(this).data('item');
        $(`[data-content="${item}"]`).addClass('visible');
    });   
});
