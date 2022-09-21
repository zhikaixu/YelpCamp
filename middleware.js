const { campgroundSchema, reviewSchema } = require("./schemas.js");
const ExpressError = require('./utils/ExpressError')
const Campground = require('./models/campground');
const Review = require("./models/review")

module.exports.isLoggedIn = (req, res, next) => {
    console.log("REQ.USER...", req.user);
    if (!req.isAuthenticated()) {
        // console.log(req.path, req.originalUrl)
        req.session.returnTo = req.originalUrl
        req.flash('error', 'You must be signed in first');
        return res.redirect('/login');
    }
    next();
}

module.exports.validateCampground = (req, res, next) => {
    // const campgroundSchema = Joi.object({
    //     campground: Joi.object({
    //         title: Joi.string().required(),
    //         price: Joi.number().required().min(0),
    //         image: Joi.string().required(),
    //         location: Joi.string().required(),
    //         description: Joi.string().required()
    //     }).required()
    // })
    // const result = campgroundSchema.validate(req.body);
    // if (result.error) {
    //     throw new ExpressError(result.error.details, 400);
    // }
    const { error } = campgroundSchema.validate(req.body);
    if (error) {
        const msg = error.details.map(el => el.message).join(",")
        // throw new ExpressError(result.error.details, 400);
        throw new ExpressError(msg, 400);
    } else {
        next();
    }
    // console.log(result);
}

module.exports.isAuthor = async(req, res, next) => {
    const {id} = req.params;
    const campground = await Campground.findById(id);
    // console.log(campground.author + "!!!!")
    // console.log(req.user._id + "!!!!")
    if (!campground.author.equals(req.user._id)) {
        req.flash('error', 'You do not have permission to do that!');
        return res.redirect(`/campgrounds/${id}`);
    }
    next();
}
module.exports.isReviewAuthor = async(req, res, next) => {
    const {id, reviewId} = req.params;
    const review = await Review.findById(reviewId);
    if (!review.author.equals(req.user._id)) {
        req.flash('error', 'You do not have permission to do that!');
        return res.redirect(`/campgrounds/${id}`);
    }
    next();
}

module.exports.validateReview = (req, res, next) => {
    console.log(req.body)
    const {error} = reviewSchema.validate(req.body);
    if (error) {
        const msg = error.details.map(el => el.message).join(",")
        // throw new ExpressError(result.error.details, 400);
        throw new ExpressError(msg, 400);
    } else {
        next();
    }
}