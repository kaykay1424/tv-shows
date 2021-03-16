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

        function getAll() {
            return tvShowsList;
        }
        
        return {
            add,
            filter,
            getAll
        };
    })();

    app.add({
        name: 'American Idol',
        genres: ['Music'],
        rating: 6.8
    })
 
    function displayShows(shows) {
        $('#tv-shows').html('').hide();
        shows.forEach(({name,rating,genres}) => {
            let html = `
                <div class="show">
                    <h2>${name}</h2>
                    <p><b>Rating:</b> ${rating}
            `;
        
            if (rating > 7) {
                html += " -Wow, that's a great show!";
            }
                
            html += `</p>
                    <p><b>Genres:</b> </p>
                    <ul>
            `;

            for (let i = 0; i < genres.length; i++) {
                html += `<li>${genres[i]}</li>`;
            }

            html += `
                    </ul>
                </div>
                <hr>
            `;
            $('#tv-shows').append(html).fadeIn();
        });
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
