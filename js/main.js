$(document).ready(function() {
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

    for (let i = 0; i < tvShowsList.length; i++) {
        let show = tvShowsList[i];
        console.log(show.name + ` (rating: ${show.rating}) ${show.rating > 7 ? " -Wow, that's a great show!": ''}`);
    }

    tvShowsList.map(({name,rating,genres}) => {
        let html = `
            <div class="show">
                <h2>${name}</h2>
                <p><b>Rating: ${rating}</b>
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
        $('#tv-shows').append(html);
    });
});
