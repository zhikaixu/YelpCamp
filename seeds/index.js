const mongoose = require('mongoose');
const Campground = require('../models/campground');
const cities = require('./cities');
const { descriptors } = require('./seedHelpers');
const { places } = require('./seedHelpers');

mongoose.connect('mongodb://localhost:27017/yelp-camp', {
    useNewUrlParser: true,
    // useCreateIndex: true,
    useUnifiedTopology: true
})

const db = mongoose.connection;
db.on("error", console.error.bind(console, "connection error:"));
db.once("open", () => {
    console.log("Database connected");
});

const sample = (array) => array[Math.floor(Math.random() * array.length)]

const seedDB = async () => {
    await Campground.deleteMany({});
    for (let i = 0; i < 300; i++) {
        const random1000 = Math.floor(Math.random() * 1000);
        const price = Math.floor(Math.random() * 20 + 10);
        const camp = new Campground({
            author: '631080cf1746a92d55474a7f',
            location: `${cities[random1000].city}, ${cities[random1000].state}`,
            title: `${sample(descriptors)} ${sample(places)}`,
            images: [
                {
                    url: 'https://res.cloudinary.com/dixrvc5du/image/upload/v1662623198/YelpCamp/gyqvh3ovodkxiu7lohif.jpg',
                    filename: 'YelpCamp/gyqvh3ovodkxiu7lohif',
                },
                {
                    url: 'https://res.cloudinary.com/dixrvc5du/image/upload/v1662623206/YelpCamp/fflphkqnjp8ddlng9viv.jpg',
                    filename: 'YelpCamp/fflphkqnjp8ddlng9viv'
                }
            ],
            description: 'Lorem ipsum dolor sit amet consectetur adipisicing elit. Quod repellat quis omnis mollitia fugiat accusamus distinctio qui, minima aperiam libero asperiores, exercitationem esse tempora obcaecati accusantium praesentium id iusto alias?',
            price: price,
            geometry: {
                type: "Point",
                coordinates: [cities[random1000].longitude,
                cities[random1000].latitude
                ]
            },
        })
        await camp.save()
    }
}

seedDB().then(() => {
    mongoose.connection.close();
});

