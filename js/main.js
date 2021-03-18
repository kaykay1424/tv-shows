$(document).ready(function() {
    let app = (function() {
        let tvShowsList = [
            {
                name: 'The Voice',
                genres: ['Music'],
                rating: 6.8
            },
            {
                name: 'Superstore',
                genres: ['Comedy'],
                rating: 7.1
            },
            {
                name: 'American Ninja Warrior',
                genres: [
                    'Action',
                    'Sports'
                ],
                rating: 6.8
            }
        ];
        let tvShowProps = ['name','genres','rating'];

        function filter(search) {
            return tvShowsList.filter((show) => {
                let regex = new RegExp(search,'i');
                return show.name.match(regex);
            });
        }

        function add(show) {
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
                tvShowsList.push(show);
            }            
        }

        function addListItem({name,genres,rating}) {
            let list = document.querySelector('#tv-shows-list');
            let listItem = document.createElement('li');
            let button = document.createElement('button');
            let detailsDiv = document.createElement('div');
            let detailsHtml = `
                <h2>${name}</h2>
                <p><b>Rating:</b> ${rating}
            `;
        
            if (rating > 7) {
                detailsHtml += " -Wow, that's a great show!";
            }
                
            detailsHtml += `</p>
                <p><b>Genres:</b> </p>
                <ul>
            `;

            for (let i = 0; i < genres.length; i++) {
                detailsHtml += `<li>${genres[i]}</li>`;
            }

            detailsHtml += `
                </ul>
            `;
            button.classList.add('btn');
            button.addEventListener('click', function(event) {
                showDetails(event);
            });
            button.innerText = name;
            detailsDiv.classList.add('details');
            detailsDiv.innerHTML = detailsHtml;
            listItem.classList.add('show');
            listItem.appendChild(button);
            listItem.appendChild(detailsDiv)
            list.appendChild(listItem);
        }

        function getAll() {
            return tvShowsList;
        }

        function showDetails(event) {
            let clickedButton = event.target;
            clickedButton.nextElementSibling.classList.toggle('visible');
            clickedButton.classList.toggle('clicked');
            clickedButton.blur();
        }
        
        return {
            add,
            addListItem,
            filter,
            getAll
        };
    })();
 
    function displayShows(shows) {
        $('#tv-shows-list').html('');
        shows.forEach((show) => app.addListItem(show));
    }

    displayShows(app.getAll());

    $('#search-form').submit((e) => {
        e.preventDefault();
        let search = $('#search').val();
        displayShows(app.filter(search));
    });

    $('#clear-search').click(() => {
        $('#search').val('');
        displayShows(app.getAll());
    });    
});
