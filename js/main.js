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
    tvShowsList.map(({name,rating,genres}) => {
        let html = `
            <div class="show">
                <h2>${name}</h2>
                <p><b>Rating:</b> ${rating}</p>
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
