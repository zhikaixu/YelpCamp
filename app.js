// if(process.env.NODE_ENV !== "production") {
//     require('dotenv').config();
// }
require('dotenv').config();
// console.log(process.env.SECRET)
// console.log(process.env.API_KEY)

// mongodb+srv://zeekai:<password>@cluster0.nma3jsq.mongodb.net/?retryWrites=true&w=majority

const express = require('express');
const app = express();
const path = require('path');
const mongoose = require('mongoose');
// const Campground = require('./models/campground');
const methodOverride = require('method-override');
const ejsMate = require('ejs-mate');
// const catchAsync = require('./utils/catchAsync');
const ExpressError = require('./utils/ExpressError');
// const Joi = require('joi');
// const {campgroundSchema, reviewSchema} = require("./schemas.js");
// const Review = require("./models/review");
const session = require('express-session');
const flash = require('connect-flash');
const passport = require("passport");
const LocalStrategy = require("passport-local");
const User = require('./models/user');

const campgroundRoutes = require('./routes/campgrounds')
const reviewRoutes = require('./routes/reviews')
const userRoutes = require('./routes/users')
const helmet = require('helmet');

const mongoSanitize = require('express-mongo-sanitize');
// const MongoStore = require('connect-mongo');
const db_url = process.env.DB_URL || 'mongodb://localhost:27017/yelp-camp';
// 'mongodb://localhost:27017/yelp-camp'
const MongoStore = require("connect-mongo");


mongoose.connect(db_url, {
    useNewUrlParser: true,
    // useCreateIndex: true,
    useUnifiedTopology: true,
})

const db = mongoose.connection;
db.on("error", console.error.bind(console, "connection error:"));
db.once("open", () => {
    console.log("Database connected");
});

app.engine('ejs', ejsMate); // <% layout('layouts/boilerplate') %> // All the things below will be passed to the given path--body
app.set('view engine', 'ejs');
app.set('views', path.join(__dirname, 'views'))

app.use(express.urlencoded({ extended: true })); // parse the req.body
app.use(methodOverride("_method"));
app.use(express.static(path.join(__dirname, 'public')))

const secret = process.env.SECRET || 'thisshouldbeabettersecret!'

const store = MongoStore.create({
    mongoUrl: db_url,
    crypto: {
        secret: secret
    },
    touchAfter: 24 * 60 * 60
});

store.on('error', function (e) {
    console.log("SESSION STORE ERROR", e)
})

const sessionConfig = {
    store,
    name: "session",
    secret: secret,
    resave: false,
    saveUninitialized: true,
    cookie: {
        httpOnly: true,
        // secure: true,
        expires: Date.now() + 1000 * 60 * 60 * 24 * 7,
        maxAge: 1000 * 60 * 60 * 24 * 7
    }
}
app.use(session(sessionConfig))
app.use(flash());
// app.use(helmet());

const scriptSrcUrls = [
    "https://stackpath.bootstrapcdn.com/",
    "https://api.tiles.mapbox.com/",
    "https://api.mapbox.com/",
    "https://kit.fontawesome.com/",
    "https://cdnjs.cloudflare.com/",
    "https://cdn.jsdelivr.net/",
    "https://res.cloudinary.com/dixrvc5du/"
];
const styleSrcUrls = [
    "https://kit-free.fontawesome.com/",
    "https://stackpath.bootstrapcdn.com/",
    "https://api.mapbox.com/",
    "https://api.tiles.mapbox.com/",
    "https://fonts.googleapis.com/",
    "https://use.fontawesome.com/",
    "https://cdn.jsdelivr.net/",
    "https://res.cloudinary.com/dixrvc5du/"
];
const connectSrcUrls = [
    "https://*.tiles.mapbox.com",
    "https://api.mapbox.com",
    "https://events.mapbox.com",
    "https://res.cloudinary.com/dixrvc5du/"
];
const fontSrcUrls = [];
app.use(
    helmet.contentSecurityPolicy({
        directives: {
            defaultSrc: [],
            connectSrc: ["'self'", ...connectSrcUrls],
            scriptSrc: ["'unsafe-inline'", "'self'", ...scriptSrcUrls],
            styleSrc: ["'self'", "'unsafe-inline'", ...styleSrcUrls],
            workerSrc: ["'self'", "blob:"],
            objectSrc: [],
            imgSrc: [
                "'self'",
                "blob:",
                "data:",
                "https://res.cloudinary.com/dixrvc5du/", //SHOULD MATCH YOUR CLOUDINARY ACCOUNT!
                "https://images.unsplash.com/"
            ],
            fontSrc: ["'self'", ...fontSrcUrls],
            mediaSrc: ["https://res.cloudinary.com/dv5vm4sqh/"],
            childSrc: ["blob:"]
        }
    })
);

app.use(passport.initialize()); // have to be after the usage of session
app.use(passport.session());
app.use(mongoSanitize());
passport.use(new LocalStrategy(User.authenticate()));

passport.serializeUser(User.serializeUser());
passport.deserializeUser(User.deserializeUser());

app.use((req, res, next) => {
    // console.log(req.session)
    // console.log(req.query);
    res.locals.currentUser = req.user;
    res.locals.success = req.flash('success');
    res.locals.error = req.flash('error');
    next();
})

// app.get('/fakeUser', async (req, res) => {
//     const user = new User({ email: 'zeekai@gmail.com', username: 'zeekai'})
//     newUser = await User.register(user, 'chicken');
//     res.send(newUser);
// })

app.use("/campgrounds", campgroundRoutes);
app.use("/campgrounds/:id/reviews", reviewRoutes)
app.use("/", userRoutes);

app.get("/", (req, res) => {
    // res.send("Hello from Yelp Camp!")
    res.render('home')
})



// if all route handlers are not meet
app.all("*", (req, res, next) => {
    // res.send("404!!!")
    next(new ExpressError('Page Not Found'), 404)
})

app.use((err, req, res, next) => {
    // const {statusCode = 500, message = 'Something went wrong'} = err;
    const { statusCode = 500 } = err;
    if (!err.message) err.message = "Oh No, Something Went Wrong!"
    res.status(statusCode).render("error", { err });
    // res.send('Oh boy, something went wrong!')
})

const port = process.env.PORT || 3000;

app.listen(port, () => {
    console.log("Connect on port!")
})