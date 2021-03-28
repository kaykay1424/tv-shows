$(document).ready(function() {
    let tvShowsApp = (function() {
        let tvShowsList = [];
        let filteredTVShowsList = [];
        let tvShowProps = ['name','genres','rating','image'];
        let apiURL = 'https://api.tvmaze.com/shows';
        let apiSearchURL = 'https://api.tvmaze.com/search/shows?q='

        function filter(search) {
            return tvShowsList.filter((show) => {
                let regex = new RegExp(search,'i');
                return show.name.match(regex);
            });  
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

        function addListItem(show) {
            let list = document.querySelector('#tv-shows-list');
            let listItem = document.createElement('li');
            let button = document.createElement('button');            
            button.classList.add('btn');
            button.addEventListener('click', function() {
                showDetails(show);
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

        function loadList(search) {
            let url = search ? apiSearchURL+search : apiURL; 
            showLoadingMessage();
                        
            return fetch(url).then(function(response) {
                return response.json();
            }).then(function(results) {
                results.forEach((result) => {
                    if (!result.name) { // if url is search url, show properties from results are 1 level deeper in array
                        result = result.show;
                    }
                    
                    let show = {
                        name: result.name,
                        genres: result.genres,
                        rating: result.rating.average,
                        image: result.image.medium
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

        function showLoadingMessage() {
            let loadingMessageDiv = document.createElement('div');
            loadingMessageDiv.innerHTML = 'Loading &#8230;'
            loadingMessageDiv.classList.add('loading-message');
            let tvShowsDiv = document.getElementById('tv-shows');
            let tvShowsList = document.getElementById('tv-shows-list');
            tvShowsDiv.insertBefore(loadingMessageDiv,tvShowsList);
        }

        function hideDetails() {
            let detailsDiv = document.querySelector('.details');
            let containerDiv = document.querySelector('.container');
            document.body.removeChild(detailsDiv);
            containerDiv.style.opacity = 1;
        }

        function showDetails({name,genres,rating,image}) {
            // let clickedButton = event.target;
            // clickedButton.nextElementSibling.classList.toggle('visible');
            // clickedButton.classList.toggle('clicked');
            // clickedButton.blur();
            let detailsDiv = document.querySelector('.details');
            let containerDiv = document.querySelector('.container');

            if (detailsDiv) {
                document.body.removeChild(detailsDiv);
            }

            detailsDiv = document.createElement('div');
            let detailsHtml = `
                <div class="details__container">
                    <span class="close">&#10008;</span>
                    <div>
                        <img src="${image}" alt="image of ${name}" />
                    </div>
                    <div>
                        <h2>${name}</h2>
                        <p><b>Rating:</b> ${rating ? rating : 'N/A'}
            `;
        
            if (rating > 7) {
                detailsHtml += " -Wow, that's a great show!";
            }
                
            detailsHtml += `</p>
                <p><b>Genres:</b>
            `;
            
            if (genres.length === 0) {
                detailsHtml += `N/A</p>`;
            } else {
                detailsHtml += `</p><ul>`;
                
                for (let i = 0; i < genres.length; i++) {
                    detailsHtml += `<li>${genres[i]}</li>`;
                }

                detailsHtml += `</ul>`; 
            }

            detailsHtml += `                  
                    </div>                    
                </div>
            `;
            detailsDiv.classList.add('details');
            detailsDiv.innerHTML = detailsHtml;
            document.body.appendChild(detailsDiv);
            detailsDiv.querySelector('.close').addEventListener('click', hideDetails);
            containerDiv.style.opacity = 0.5;
        }

        return {
            add,
            addListItem,
            filter,
            loadList,
            getAll
        };
    })();
 
    function displayShows(shows) {
        $('#tv-shows-list').html('');
        shows.forEach((show) => tvShowsApp.addListItem(show));
    }

    tvShowsApp.loadList().then(function() {
        displayShows(tvShowsApp.getAll(false));
    });

    $('#search-form').submit((e) => {
        e.preventDefault();
        let search = $('#search').val();
        tvShowsApp.loadList(search).then(function() {
            displayShows(tvShowsApp.getAll(true));
        });
    });

    $('#clear-search').click(() => {
        $('#search').val('');
        displayShows(tvShowsApp.getAll(false));
    });    
});
